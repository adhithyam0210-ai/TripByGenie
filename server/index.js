const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'travel_genie_super_secure_jwt_secret_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Modular API v1 Routes
const v1Routes = require('./src/routes/v1');
app.use('/api/v1', v1Routes);

// Uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Local media file streaming endpoint (supports byte ranges for videos & local files)
app.get('/api/media/stream', (req, res) => {
  let filePath = req.query.path || '';
  filePath = filePath.replace(/^["']|["']$/g, '').trim();

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Media file not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(filePath).toLowerCase();

  let contentType = 'video/mp4';
  if (ext === '.webm') contentType = 'video/webm';
  if (ext === '.ogg' || ext === '.ogv') contentType = 'video/ogg';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.webp') contentType = 'image/webp';

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});
const upload = multer({ storage });

// JWT helper
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      agency_id: user.agency_id,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findById('users', decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or account is deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Role Authorization Middleware
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

// ==========================================
// 1. AUTHENTICATION & SESSION ROUTES
// ==========================================

// Login (Unified single login for all 4 roles)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  const agency = db.findById('agencies', user.agency_id);

  // Return clean user object without password_hash
  const { password_hash, ...safeUser } = user;
  res.json({
    token,
    user: safeUser,
    agency
  });
});

// Demo Login (Instant switch between roles for testing)
app.post('/api/auth/demo-login', (req, res) => {
  const { role, agency_slug } = req.body;
  let targetAgency = db.findOne('agencies', (a) => a.slug === (agency_slug || 'travel-genie'));
  if (!targetAgency) {
    targetAgency = db.findAll('agencies')[0];
  }

  const user = db.findOne('users', (u) => u.agency_id === targetAgency.id && u.role === (role || 'admin'));
  if (!user) {
    return res.status(404).json({ error: `Demo user for role '${role}' not found.` });
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({
    token,
    user: safeUser,
    agency: targetAgency
  });
});

// Customer Registration (Auto-creates customer profile + lead if associated with enquiry)
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, enquiry_data, agency_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existing = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const defaultAgency = agency_id ? db.findById('agencies', agency_id) : db.findAll('agencies')[0];
  const targetAgencyId = defaultAgency ? defaultAgency.id : 'agency_travel_genie';

  const newUser = db.insert('users', {
    agency_id: targetAgencyId,
    role: 'customer',
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    password_hash: bcrypt.hashSync(password, 10),
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  });

  // Create customer profile
  db.insert('customer_profiles', {
    user_id: newUser.id,
    agency_id: targetAgencyId,
    passport_number: '',
    emergency_contact: phone || '',
    preferred_destinations: [],
    total_trips: 0
  });

  // If registration was accompanied by a travel enquiry/package selection
  let createdLead = null;
  if (enquiry_data) {
    createdLead = db.insert('leads', {
      agency_id: targetAgencyId,
      customer_id: newUser.id,
      customer_name: name,
      customer_email: email,
      customer_phone: phone || '',
      interested_destination: enquiry_data.destination || 'Not Specified',
      interested_package_id: enquiry_data.package_id || null,
      travel_date: enquiry_data.travel_date || '',
      travelers_count: enquiry_data.travelers_count || 2,
      budget: enquiry_data.budget || 'Flexible',
      lead_source: enquiry_data.source || 'Website Registration',
      status: 'New',
      assigned_staff_id: null,
      assigned_staff_name: 'Unassigned',
      follow_up_date: null,
      notes: enquiry_data.notes || 'Registered through travel enquiry workflow.',
      created_at: new Date().toISOString()
    });

    // Notify admins of new lead
    const admins = db.findAll('users', (u) => u.agency_id === targetAgencyId && u.role === 'admin');
    for (const admin of admins) {
      db.createNotification(
        targetAgencyId,
        admin.id,
        'New Customer Registration & Enquiry',
        `${name} registered and submitted an enquiry for ${enquiry_data.destination || 'a travel package'}.`,
        'info',
        '/admin/leads'
      );
    }
  }

  const token = generateToken(newUser);
  const { password_hash, ...safeUser } = newUser;

  res.status(201).json({
    token,
    user: safeUser,
    agency: defaultAgency,
    lead: createdLead
  });
});

// Current User Details
app.get('/api/auth/me', authenticate, (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  const agency = db.findById('agencies', req.user.agency_id);
  res.json({
    user: safeUser,
    agency
  });
});

// Switch Agency (Multi-agency testing)
app.post('/api/auth/switch-agency', authenticate, (req, res) => {
  const { agency_id } = req.body;
  const targetAgency = db.findById('agencies', agency_id);
  if (!targetAgency) {
    return res.status(404).json({ error: 'Agency not found.' });
  }

  // Update user's active agency
  const updatedUser = db.update('users', req.user.id, { agency_id });
  const token = generateToken(updatedUser);
  const { password_hash, ...safeUser } = updatedUser;

  res.json({
    token,
    user: safeUser,
    agency: targetAgency
  });
});

// List all agencies (for agency switcher)
app.get('/api/agencies', (req, res) => {
  const agencies = db.findAll('agencies');
  res.json(agencies);
});

// ==========================================
// 2. PUBLIC TRAVEL WEBSITE ENDPOINTS
// ==========================================

// Public Agency Branding
app.get('/api/public/agency', (req, res) => {
  const agencySlug = req.query.slug || 'travel-genie';
  const agency = db.findOne('agencies', (a) => a.slug === agencySlug) || db.findAll('agencies')[0];
  const settings = db.findOne('agency_settings', (s) => s.agency_id === agency.id);
  res.json({ agency, settings });
});

// Public Hero Banners
app.get('/api/public/banners', (req, res) => {
  const agencyId = req.query.agency_id || 'agency_travel_genie';
  const banners = db.findAll('hero_banners', (b) => b.agency_id === agencyId && b.is_active);
  banners.sort((a, b) => a.display_order - b.display_order);
  res.json(banners);
});

// Public Destinations
app.get('/api/public/destinations', (req, res) => {
  const agencyId = req.query.agency_id || 'agency_travel_genie';
  const { region, featured } = req.query;

  let destinations = db.findAll('destinations', (d) => d.agency_id === agencyId && d.is_published);
  if (region && region !== 'all') {
    destinations = destinations.filter((d) => d.region.toLowerCase() === region.toLowerCase());
  }
  if (featured === 'true') {
    destinations = destinations.filter((d) => d.is_featured);
  }

  res.json(destinations);
});

// Destination Details by Slug or ID
app.get('/api/public/destinations/:slug', (req, res) => {
  const { slug } = req.params;
  const cleanSlug = (slug || '').toLowerCase().trim();
  const destination = db.findOne('destinations', (d) => 
    (d.slug && d.slug.toLowerCase() === cleanSlug) || 
    (d.id && d.id.toLowerCase() === cleanSlug) || 
    (d.name && d.name.toLowerCase() === cleanSlug) ||
    (d.name && d.name.toLowerCase().replace(/\s+/g, '-') === cleanSlug)
  );
  if (!destination) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  const packages = db.findAll('packages', (p) => 
    (p.destination_id === destination.id || 
     (p.title && p.title.toLowerCase().includes(destination.name.toLowerCase()))) && 
    (p.is_published !== false)
  );
  res.json({ destination, packages });
});

// Public Packages with Filters
app.get('/api/public/packages', (req, res) => {
  const agencyId = req.query.agency_id || 'agency_travel_genie';
  const { category, destination, max_price, duration, search, featured, group_tour } = req.query;

  let packages = db.findAll('packages', (p) => p.agency_id === agencyId && p.is_published);

  if (category && category !== 'all') {
    packages = packages.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (destination && destination !== 'all') {
    packages = packages.filter((p) => p.destination_id === destination);
  }

  if (max_price) {
    const max = Number(max_price);
    packages = packages.filter((p) => p.public_price <= max);
  }

  if (duration && duration !== 'all') {
    if (duration === 'short') packages = packages.filter((p) => p.duration_days <= 4);
    else if (duration === 'medium') packages = packages.filter((p) => p.duration_days >= 5 && p.duration_days <= 7);
    else if (duration === 'long') packages = packages.filter((p) => p.duration_days > 7);
  }

  if (group_tour === 'true') {
    packages = packages.filter((p) => p.is_group_tour);
  }

  if (featured === 'true') {
    packages = packages.filter((p) => p.is_featured);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    packages = packages.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Hide wholesale prices from public view
  const publicPackages = packages.map(({ wholesale_price, ...rest }) => rest);
  res.json(publicPackages);
});

// Package Details by Slug
app.get('/api/public/packages/:slug', (req, res) => {
  const { slug } = req.params;
  const cleanSlug = decodeURIComponent(slug || '').toLowerCase().trim().replace(/\/+$/, '');
  const pkg = db.findOne('packages', (p) => {
    if (!p) return false;
    const pSlug = (p.slug || '').toLowerCase().trim().replace(/\/+$/, '');
    const pId = (p.id || '').toLowerCase().trim();
    return pSlug === cleanSlug || pId === cleanSlug;
  });
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found.' });
  }

  const destination = db.findById('destinations', pkg.destination_id);
  const rawItineraries = db.findAll('package_itineraries', (it) => it.package_id === pkg.id);
  // Strict deduplication by day_number
  const dayMap = new Map();
  for (const it of rawItineraries) {
    const day = Number(it.day_number) || 1;
    if (!dayMap.has(day)) {
      dayMap.set(day, it);
    } else {
      const existing = dayMap.get(day);
      if ((it.description?.length || 0) > (existing.description?.length || 0)) {
        dayMap.set(day, it);
      }
    }
  }
  const itineraries = Array.from(dayMap.values()).sort((a, b) => a.day_number - b.day_number);

  const { wholesale_price, ...safePackage } = pkg;
  res.json({
    package: safePackage,
    destination,
    itineraries
  });
});

// Public Group Tours
app.get('/api/public/group-tours', (req, res) => {
  const agencyId = req.query.agency_id || 'agency_travel_genie';
  const tours = db.findAll('packages', (p) => p.agency_id === agencyId && p.is_group_tour && p.is_published);
  const publicTours = tours.map(({ wholesale_price, ...rest }) => rest);
  res.json(publicTours);
});

// Public Services
app.get('/api/public/services', (req, res) => {
  const services = db.findAll('travel_services');
  res.json(services);
});

// Public Testimonials
app.get('/api/public/testimonials', (req, res) => {
  const testimonials = db.findAll('testimonials', (t) => t.is_published);
  res.json(testimonials);
});

// Public Trip Enquiry / Lead Submission (Auto-creates CRM Lead & Notifies Admin/Staff)
app.post('/api/public/enquiry', (req, res) => {
  const {
    name,
    email,
    phone,
    destination,
    package_id,
    travel_date,
    travelers_count,
    budget,
    hotel_preference,
    travel_preference,
    additional_requirements,
    departure_city,
    source,
    agency_id
  } = req.body;

  if (!name || (!email && !phone)) {
    return res.status(400).json({ error: 'Name and email or phone number are required.' });
  }

  const targetAgencyId = agency_id || 'agency_travel_genie';

  // Check if customer account already exists with this email
  let existingUser = null;
  if (email) {
    existingUser = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
  }

  const notesCombined = [
    departure_city ? `Departure City: ${departure_city}` : '',
    hotel_preference ? `Hotel: ${hotel_preference}` : '',
    travel_preference ? `Preference: ${travel_preference}` : '',
    additional_requirements ? `Notes: ${additional_requirements}` : ''
  ].filter(Boolean).join(' | ');

  const newLead = db.insert('leads', {
    agency_id: targetAgencyId,
    customer_id: existingUser ? existingUser.id : null,
    customer_name: name,
    customer_email: email || '',
    customer_phone: phone || '',
    interested_destination: destination || 'Custom Tour',
    interested_package_id: package_id || null,
    travel_date: travel_date || '',
    travelers_count: Number(travelers_count) || 2,
    budget: budget || 'Flexible',
    lead_source: source || 'Customized Trip Form',
    status: 'New',
    assigned_staff_id: null,
    assigned_staff_name: 'Unassigned',
    follow_up_date: null,
    notes: notesCombined || 'Customer submitted customized travel plan request.',
    created_at: new Date().toISOString()
  });

  // Record initial activity
  db.recordActivity(newLead.id, existingUser ? existingUser.id : 'system', 'status_change', 'Lead created via Public Website enquiry form.');

  // Notify admins
  const admins = db.findAll('users', (u) => u.agency_id === targetAgencyId && u.role === 'admin');
  for (const admin of admins) {
    db.createNotification(
      targetAgencyId,
      admin.id,
      'New Lead Received',
      `Lead #${newLead.id} from ${name} for ${destination || 'Custom Tour'}.`,
      'info',
      '/admin/leads'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Your enquiry has been received. Our travel specialist will contact you shortly!',
    lead_id: newLead.id
  });
});

// Public Contact Form
app.post('/api/public/contact', (req, res) => {
  const { name, email, phone, subject, message, agency_id } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const targetAgencyId = agency_id || 'agency_travel_genie';
  const contact = db.insert('contact_enquiries', {
    agency_id: targetAgencyId,
    name,
    email,
    phone: phone || '',
    subject: subject || 'General Enquiry',
    message,
    status: 'New'
  });

  // Also create a lead from contact if they gave details
  db.insert('leads', {
    agency_id: targetAgencyId,
    customer_id: null,
    customer_name: name,
    customer_email: email,
    customer_phone: phone || '',
    interested_destination: subject || 'General Tour Request',
    interested_package_id: null,
    travel_date: '',
    travelers_count: 2,
    budget: 'Flexible',
    lead_source: 'Contact Form',
    status: 'New',
    assigned_staff_id: null,
    assigned_staff_name: 'Unassigned',
    notes: `Message: ${message}`,
    created_at: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for reaching out! We have received your message.'
  });
});

// ==========================================
// 3. CUSTOMER PORTAL ENDPOINTS
// ==========================================

// Customer Dashboard
app.get('/api/customer/dashboard', authenticate, authorize(['customer']), (req, res) => {
  const userId = req.user.id;
  const agencyId = req.user.agency_id;

  const enquiries = db.findAll('leads', (l) => l.customer_id === userId || (req.user.email && l.customer_email.toLowerCase() === req.user.email.toLowerCase()));
  const bookings = db.findAll('bookings', (b) => b.customer_id === userId || (req.user.email && b.customer_email.toLowerCase() === req.user.email.toLowerCase()));
  const notifications = db.findAll('notifications', (n) => n.user_id === userId);

  const upcomingBookings = bookings.filter((b) => new Date(b.travel_start_date) >= new Date() && b.booking_status !== 'Cancelled');
  const pastBookings = bookings.filter((b) => new Date(b.travel_start_date) < new Date() || b.booking_status === 'Completed');

  const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const pendingPayment = bookings.reduce((sum, b) => sum + (b.balance_amount || 0), 0);

  res.json({
    stats: {
      total_enquiries: enquiries.length,
      upcoming_trips: upcomingBookings.length,
      completed_trips: pastBookings.length,
      total_spent: totalSpent,
      pending_payment: pendingPayment
    },
    enquiries: enquiries.slice(0, 5),
    upcomingBookings,
    pastBookings,
    notifications: notifications.slice(0, 5)
  });
});

// Customer Enquiries
app.get('/api/customer/enquiries', authenticate, authorize(['customer']), (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email.toLowerCase();

  const enquiries = db.findAll('leads', (l) => l.customer_id === userId || (l.customer_email && l.customer_email.toLowerCase() === userEmail));
  
  // Attach quotations if any
  const enriched = enquiries.map((lead) => {
    const quotations = db.findAll('quotations', (q) => q.lead_id === lead.id);
    return { ...lead, quotations };
  });

  res.json(enriched);
});

// Customer Bookings
app.get('/api/customer/bookings', authenticate, authorize(['customer']), (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email.toLowerCase();

  const bookings = db.findAll('bookings', (b) => b.customer_id === userId || (b.customer_email && b.customer_email.toLowerCase() === userEmail));
  
  const enriched = bookings.map((b) => {
    const travellers = db.findAll('booking_travellers', (t) => t.booking_id === b.id);
    const payments = db.findAll('payments', (p) => p.booking_id === b.id);
    const pkg = db.findById('packages', b.package_id);
    return { ...b, travellers, payments, package: pkg };
  });

  res.json(enriched);
});

// Customer Payments
app.get('/api/customer/payments', authenticate, authorize(['customer']), (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email.toLowerCase();

  const bookings = db.findAll('bookings', (b) => b.customer_id === userId || (b.customer_email && b.customer_email.toLowerCase() === userEmail));
  const bookingIds = bookings.map((b) => b.id);

  const payments = db.findAll('payments', (p) => bookingIds.includes(p.booking_id));
  res.json({ payments, bookings });
});

// Customer Profile
app.get('/api/customer/profile', authenticate, authorize(['customer']), (req, res) => {
  const profile = db.findOne('customer_profiles', (cp) => cp.user_id === req.user.id);
  const { password_hash, ...safeUser } = req.user;
  res.json({ user: safeUser, profile });
});

app.put('/api/customer/profile', authenticate, authorize(['customer']), (req, res) => {
  const { name, phone, passport_number, emergency_contact, preferred_destinations } = req.body;

  db.update('users', req.user.id, { name, phone });
  let profile = db.findOne('customer_profiles', (cp) => cp.user_id === req.user.id);
  if (profile) {
    profile = db.update('customer_profiles', profile.id, {
      passport_number,
      emergency_contact,
      preferred_destinations
    });
  } else {
    profile = db.insert('customer_profiles', {
      user_id: req.user.id,
      agency_id: req.user.agency_id,
      passport_number,
      emergency_contact,
      preferred_destinations
    });
  }

  const updatedUser = db.findById('users', req.user.id);
  const { password_hash, ...safeUser } = updatedUser;
  res.json({ user: safeUser, profile });
});

// ==========================================
// 4. ADMIN PORTAL ENDPOINTS
// ==========================================

// Admin Dashboard KPI Stats & Charts
app.get('/api/admin/dashboard', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;

  const customers = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'customer');
  const staff = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'staff' && u.status === 'active');
  const agents = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'agent' && u.status === 'active');
  const leads = db.findAll('leads', (l) => l.agency_id === agencyId);
  const bookings = db.findAll('bookings', (b) => b.agency_id === agencyId);
  const packages = db.findAll('packages', (p) => p.agency_id === agencyId);

  // Lead metrics
  const newLeads = leads.filter((l) => l.status === 'New');
  const unassignedLeads = leads.filter((l) => !l.assigned_staff_id || l.status === 'Unassigned');
  const assignedLeads = leads.filter((l) => l.assigned_staff_id);
  const inProgressLeads = leads.filter((l) => ['Contacted', 'Follow-up Required', 'Quotation Sent', 'Negotiation'].includes(l.status));
  const convertedLeads = leads.filter((l) => l.status === 'Converted');

  // Revenue & Payments
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const collectedRevenue = bookings.reduce((sum, b) => sum + (b.advance_amount || 0), 0);
  const pendingPayments = bookings.reduce((sum, b) => sum + (b.balance_amount || 0), 0);

  const conversionRate = leads.length > 0 ? ((convertedLeads.length / leads.length) * 100).toFixed(1) : 0;

  // Monthly Lead Generation Mockup based on real data
  const monthlyLeads = [
    { month: 'Jun', leads: 24, converted: 8 },
    { month: 'Jul', leads: 32, converted: 12 },
    { month: 'Aug', leads: 28, converted: 10 },
    { month: 'Sep', leads: 45, converted: 18 },
    { month: 'Oct', leads: 52, converted: 22 },
    { month: 'Nov', leads: leads.length, converted: convertedLeads.length }
  ];

  // Revenue trends
  const revenueTrends = [
    { month: 'Jun', revenue: 420000 },
    { month: 'Jul', revenue: 680000 },
    { month: 'Aug', revenue: 590000 },
    { month: 'Sep', revenue: 840000 },
    { month: 'Oct', revenue: 950000 },
    { month: 'Nov', revenue: totalRevenue }
  ];

  // Top Packages
  const topPackages = packages.slice(0, 5).map((pkg) => {
    const pkgBookings = bookings.filter((b) => b.package_id === pkg.id);
    return {
      id: pkg.id,
      title: pkg.title,
      destination: pkg.category,
      price: pkg.public_price,
      bookingsCount: pkgBookings.length,
      revenue: pkgBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    };
  });

  res.json({
    kpis: {
      total_customers: customers.length,
      total_leads: leads.length,
      new_leads: newLeads.length,
      unassigned_leads: unassignedLeads.length,
      assigned_leads: assignedLeads.length,
      in_progress_leads: inProgressLeads.length,
      converted_leads: convertedLeads.length,
      conversion_rate: `${conversionRate}%`,
      total_bookings: bookings.length,
      total_revenue: totalRevenue,
      collected_revenue: collectedRevenue,
      pending_payments: pendingPayments,
      active_staff: staff.length,
      active_agents: agents.length
    },
    charts: {
      monthlyLeads,
      revenueTrends,
      topPackages
    },
    recentLeads: leads.slice(-6).reverse(),
    recentBookings: bookings.slice(-5).reverse()
  });
});

// Admin Lead Management (CRUD, Search, Filter, Assignment)
app.get('/api/admin/leads', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { status, staff_id, source, search, page = 1, limit = 20 } = req.query;

  const filters = {};
  if (status && status !== 'all') filters.status = status;
  if (staff_id && staff_id !== 'all') filters.assigned_staff_id = staff_id;
  if (source && source !== 'all') filters.lead_source = source;

  const result = db.query('leads', {
    agency_id: agencyId,
    search,
    searchFields: ['customer_name', 'customer_email', 'customer_phone', 'interested_destination'],
    filters,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page,
    limit
  });

  res.json(result);
});

// Admin Create Direct Lead
app.post('/api/admin/leads', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const {
    customer_name,
    customer_email,
    customer_phone,
    interested_destination,
    interested_package_id,
    travel_date,
    travelers_count,
    budget,
    lead_source,
    assigned_staff_id,
    notes,
    follow_up_date
  } = req.body;

  if (!customer_name) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  let staffName = 'Unassigned';
  let initialStatus = 'New';
  if (assigned_staff_id) {
    const staffUser = db.findById('users', assigned_staff_id);
    if (staffUser) {
      staffName = staffUser.name;
      initialStatus = 'Assigned';
    }
  }

  const newLead = db.insert('leads', {
    agency_id: agencyId,
    customer_id: null,
    customer_name,
    customer_email: customer_email || '',
    customer_phone: customer_phone || '',
    interested_destination: interested_destination || 'General Tour',
    interested_package_id: interested_package_id || null,
    travel_date: travel_date || '',
    travelers_count: Number(travelers_count) || 2,
    budget: budget || 'Flexible',
    lead_source: lead_source || 'Direct Admin Entry',
    status: initialStatus,
    assigned_staff_id: assigned_staff_id || null,
    assigned_staff_name: staffName,
    follow_up_date: follow_up_date || null,
    notes: notes || 'Lead entered directly by Administrator.',
    created_at: new Date().toISOString()
  });

  db.recordActivity(newLead.id, req.user.id, 'status_change', `Lead created directly by Admin ${req.user.name}.`);

  if (assigned_staff_id) {
    db.createNotification(
      agencyId,
      assigned_staff_id,
      'New Lead Assigned',
      `Admin assigned lead #${newLead.id} (${customer_name}) to you.`,
      'info',
      '/staff/leads'
    );
  }

  res.status(201).json(newLead);
});

// Admin Lead Details & Activity Timeline
app.get('/api/admin/leads/:id', authenticate, authorize(['admin']), (req, res) => {
  const lead = db.findById('leads', req.params.id);
  if (!lead || lead.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const activities = db.findAll('lead_activities', (a) => a.lead_id === lead.id);
  activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const quotations = db.findAll('quotations', (q) => q.lead_id === lead.id);
  const pkg = lead.interested_package_id ? db.findById('packages', lead.interested_package_id) : null;

  res.json({
    lead,
    activities,
    quotations,
    package: pkg
  });
});

// Admin Update Lead (Status, Notes, Follow-up date)
app.put('/api/admin/leads/:id', authenticate, authorize(['admin']), (req, res) => {
  const lead = db.findById('leads', req.params.id);
  if (!lead || lead.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const { status, notes, follow_up_date, budget, travelers_count } = req.body;
  const oldStatus = lead.status;

  const updated = db.update('leads', lead.id, {
    status: status || lead.status,
    notes: notes !== undefined ? notes : lead.notes,
    follow_up_date: follow_up_date !== undefined ? follow_up_date : lead.follow_up_date,
    budget: budget || lead.budget,
    travelers_count: travelers_count || lead.travelers_count
  });

  if (status && status !== oldStatus) {
    db.recordActivity(lead.id, req.user.id, 'status_change', `Status changed from '${oldStatus}' to '${status}'.`);
  }

  res.json(updated);
});

// Admin Assign / Reassign Leads to Staff (Single or Bulk)
app.post('/api/admin/leads/assign', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { lead_ids, staff_id, notes } = req.body;

  if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one lead ID.' });
  }

  const staffUser = staff_id ? db.findById('users', staff_id) : null;
  const staffName = staffUser ? staffUser.name : 'Unassigned';
  const newStatus = staff_id ? 'Assigned' : 'Unassigned';

  const updatedLeads = [];
  for (const id of lead_ids) {
    const lead = db.findById('leads', id);
    if (lead && lead.agency_id === agencyId) {
      const updated = db.update('leads', id, {
        assigned_staff_id: staff_id || null,
        assigned_staff_name: staffName,
        status: lead.status === 'New' || lead.status === 'Unassigned' ? newStatus : lead.status
      });

      db.recordActivity(id, req.user.id, 'assignment', `Assigned to ${staffName} by Admin. ${notes || ''}`);
      updatedLeads.push(updated);
    }
  }

  // Notify assigned staff
  if (staff_id) {
    db.createNotification(
      agencyId,
      staff_id,
      'Leads Assigned',
      `You have been assigned ${updatedLeads.length} lead(s) by Administrator.`,
      'info',
      '/staff/leads'
    );
  }

  res.json({
    success: true,
    message: `Successfully assigned ${updatedLeads.length} lead(s) to ${staffName}.`,
    leads: updatedLeads
  });
});

// Admin Delete Lead
app.delete('/api/admin/leads/:id', authenticate, authorize(['admin']), (req, res) => {
  const lead = db.findById('leads', req.params.id);
  if (!lead || lead.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Lead not found.' });
  }
  db.delete('leads', req.params.id);
  res.json({ success: true, message: 'Lead deleted successfully.' });
});

// Admin Staff Management (CRUD)
app.get('/api/admin/staff', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const staffUsers = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'staff');

  const enrichedStaff = staffUsers.map((staff) => {
    const profile = db.findOne('staff_profiles', (sp) => sp.user_id === staff.id) || {};
    const assignedLeads = db.findAll('leads', (l) => l.assigned_staff_id === staff.id);
    const convertedLeads = assignedLeads.filter((l) => l.status === 'Converted');
    const { password_hash, ...safeStaff } = staff;
    return {
      ...safeStaff,
      profile,
      assignedLeadsCount: assignedLeads.length,
      convertedLeadsCount: convertedLeads.length
    };
  });

  res.json(enrichedStaff);
});

// Admin Create Staff Account
app.post('/api/admin/staff', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { name, email, phone, department, designation, password, employee_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and temporary password are required.' });
  }

  const existing = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const newStaff = db.insert('users', {
    agency_id: agencyId,
    role: 'staff',
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    password_hash: bcrypt.hashSync(password, 10),
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  });

  const profile = db.insert('staff_profiles', {
    user_id: newStaff.id,
    agency_id: agencyId,
    employee_id: employee_id || `TG-EMP-${Math.floor(100 + Math.random() * 900)}`,
    department: department || 'Holidays',
    designation: designation || 'Travel Consultant',
    assigned_leads_count: 0,
    converted_leads_count: 0,
    rating: 5.0
  });

  const { password_hash, ...safeStaff } = newStaff;
  res.status(201).json({ ...safeStaff, profile });
});

// Admin Toggle Staff Status
app.put('/api/admin/staff/:id', authenticate, authorize(['admin']), (req, res) => {
  const staff = db.findById('users', req.params.id);
  if (!staff || staff.agency_id !== req.user.agency_id || staff.role !== 'staff') {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const { status, name, phone, department, designation, password } = req.body;
  const updateData = {};
  if (status) updateData.status = status;
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (password) updateData.password_hash = bcrypt.hashSync(password, 10);

  const updatedUser = db.update('users', staff.id, updateData);

  let profile = db.findOne('staff_profiles', (sp) => sp.user_id === staff.id);
  if (profile && (department || designation)) {
    profile = db.update('staff_profiles', profile.id, {
      department: department || profile.department,
      designation: designation || profile.designation
    });
  }

  const { password_hash, ...safeStaff } = updatedUser;
  res.json({ ...safeStaff, profile });
});

// Admin Agent Management (B2B Partners)
app.get('/api/admin/agents', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const agentUsers = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'agent');

  const enrichedAgents = agentUsers.map((agent) => {
    const profile = db.findOne('agent_profiles', (ap) => ap.user_id === agent.id) || {};
    const purchases = db.findAll('agent_purchases', (ap) => ap.agent_id === agent.id);
    const totalPurchasedAmount = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);
    const { password_hash, ...safeAgent } = agent;
    return {
      ...safeAgent,
      profile,
      purchasesCount: purchases.length,
      totalPurchasedAmount
    };
  });

  res.json(enrichedAgents);
});

// Admin Create Agent Account
app.post('/api/admin/agents', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { name, email, phone, company_name, wholesale_discount_pct, credit_limit, password } = req.body;

  if (!name || !email || !password || !company_name) {
    return res.status(400).json({ error: 'Name, company name, email, and password are required.' });
  }

  const existing = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const newAgent = db.insert('users', {
    agency_id: agencyId,
    role: 'agent',
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    password_hash: bcrypt.hashSync(password, 10),
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  });

  const profile = db.insert('agent_profiles', {
    user_id: newAgent.id,
    agency_id: agencyId,
    company_name,
    agent_id: `AGT-${Math.floor(1000 + Math.random() * 9000)}`,
    wholesale_discount_pct: Number(wholesale_discount_pct) || 12,
    credit_limit: Number(credit_limit) || 500000,
    total_purchases: 0,
    total_sales: 0,
    total_margin: 0,
    status: 'approved'
  });

  const { password_hash, ...safeAgent } = newAgent;
  res.status(201).json({ ...safeAgent, profile });
});

// Admin Update Agent (Pricing rules, status)
app.put('/api/admin/agents/:id', authenticate, authorize(['admin']), (req, res) => {
  const agent = db.findById('users', req.params.id);
  if (!agent || agent.agency_id !== req.user.agency_id || agent.role !== 'agent') {
    return res.status(404).json({ error: 'Agent not found.' });
  }

  const { status, name, phone, company_name, wholesale_discount_pct, credit_limit } = req.body;
  if (status || name || phone) {
    db.update('users', agent.id, {
      status: status || agent.status,
      name: name || agent.name,
      phone: phone || agent.phone
    });
  }

  let profile = db.findOne('agent_profiles', (ap) => ap.user_id === agent.id);
  if (profile) {
    profile = db.update('agent_profiles', profile.id, {
      company_name: company_name || profile.company_name,
      wholesale_discount_pct: wholesale_discount_pct !== undefined ? Number(wholesale_discount_pct) : profile.wholesale_discount_pct,
      credit_limit: credit_limit !== undefined ? Number(credit_limit) : profile.credit_limit
    });
  }

  const updatedAgent = db.findById('users', agent.id);
  const { password_hash, ...safeAgent } = updatedAgent;
  res.json({ ...safeAgent, profile });
});

// Admin Customer Management
app.get('/api/admin/customers', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const customers = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'customer');

  const enriched = customers.map((c) => {
    const profile = db.findOne('customer_profiles', (cp) => cp.user_id === c.id) || {};
    const bookings = db.findAll('bookings', (b) => b.customer_id === c.id || (c.email && b.customer_email.toLowerCase() === c.email.toLowerCase()));
    const enquiries = db.findAll('leads', (l) => l.customer_id === c.id || (c.email && l.customer_email.toLowerCase() === c.email.toLowerCase()));
    const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const { password_hash, ...safeCustomer } = c;
    return {
      ...safeCustomer,
      profile,
      bookingsCount: bookings.length,
      enquiriesCount: enquiries.length,
      totalSpent
    };
  });

  res.json(enriched);
});

// Admin Package Management (Full CRUD + Itineraries)
app.get('/api/admin/packages', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const packages = db.findAll('packages', (p) => p.agency_id === agencyId);
  res.json(packages);
});

app.post('/api/admin/packages', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const {
    title,
    destination_id,
    category,
    duration_days,
    duration_nights,
    public_price,
    wholesale_price,
    cover_image,
    gallery,
    description,
    highlights,
    inclusions,
    exclusions,
    accommodation,
    transportation,
    is_featured,
    is_published,
    is_group_tour,
    available_seats,
    total_seats,
    upcoming_date,
    itineraries
  } = req.body;

  if (!title || !public_price || !destination_id) {
    return res.status(400).json({ error: 'Title, destination, and public price are required.' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const newPackage = db.insert('packages', {
    agency_id: agencyId,
    title,
    slug,
    destination_id,
    category: category || 'Domestic Holiday Packages',
    duration_days: Number(duration_days) || 5,
    duration_nights: Number(duration_nights) || 4,
    public_price: Number(public_price),
    wholesale_price: Number(wholesale_price) || Math.round(Number(public_price) * 0.8),
    cover_image: cover_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    gallery: gallery || [],
    description: description || '',
    highlights: highlights || [],
    inclusions: inclusions || [],
    exclusions: exclusions || [],
    accommodation: accommodation || 'Handpicked 4-star hotels',
    transportation: transportation || 'Private AC transfers',
    is_featured: !!is_featured,
    is_published: is_published !== undefined ? !!is_published : true,
    is_group_tour: !!is_group_tour,
    available_seats: Number(available_seats) || 20,
    total_seats: Number(total_seats) || 20,
    upcoming_date: upcoming_date || '',
    created_at: new Date().toISOString()
  });

  // Save itineraries if provided
  if (Array.isArray(itineraries)) {
    for (const it of itineraries) {
      db.insert('package_itineraries', {
        package_id: newPackage.id,
        day_number: it.day_number || 1,
        title: it.title || `Day ${it.day_number}`,
        description: it.description || '',
        meals: it.meals || 'Breakfast',
        activities: it.activities || ''
      });
    }
  }

  res.status(201).json(newPackage);
});

app.put('/api/admin/packages/:id', authenticate, authorize(['admin']), (req, res) => {
  const pkg = db.findById('packages', req.params.id);
  if (!pkg || pkg.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Package not found.' });
  }

  const updated = db.update('packages', pkg.id, req.body);
  res.json(updated);
});

app.delete('/api/admin/packages/:id', authenticate, authorize(['admin']), (req, res) => {
  const pkg = db.findById('packages', req.params.id);
  if (!pkg || pkg.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Package not found.' });
  }

  db.delete('packages', req.params.id);
  res.json({ success: true, message: 'Package deleted successfully.' });
});

// Admin Destination Management (CRUD)
app.get('/api/admin/destinations', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const destinations = db.findAll('destinations', (d) => d.agency_id === agencyId);
  res.json(destinations);
});

app.post('/api/admin/destinations', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { name, country, region, description, image, is_featured, is_published } = req.body;

  if (!name || !country) {
    return res.status(400).json({ error: 'Destination name and country are required.' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const newDest = db.insert('destinations', {
    agency_id: agencyId,
    name,
    slug,
    country,
    region: region || 'India',
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    package_count: 0,
    is_featured: !!is_featured,
    is_published: is_published !== undefined ? !!is_published : true
  });

  res.status(201).json(newDest);
});

app.put('/api/admin/destinations/:id', authenticate, authorize(['admin']), (req, res) => {
  const dest = db.findById('destinations', req.params.id);
  if (!dest || dest.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  const updated = db.update('destinations', dest.id, req.body);
  res.json(updated);
});

app.delete('/api/admin/destinations/:id', authenticate, authorize(['admin']), (req, res) => {
  const dest = db.findById('destinations', req.params.id);
  if (!dest || dest.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  db.delete('destinations', req.params.id);
  res.json({ success: true, message: 'Destination deleted.' });
});

// Admin Hero Banner Management
app.get('/api/admin/banners', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const banners = db.findAll('hero_banners', (b) => b.agency_id === agencyId);
  banners.sort((a, b) => a.display_order - b.display_order);
  res.json(banners);
});

app.post('/api/admin/banners', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { title, subtitle, image_desktop, image_mobile, video_url, cta_text, cta_link, display_order, is_active } = req.body;

  if (!title || (!image_desktop && !video_url)) {
    return res.status(400).json({ error: 'Banner title and either desktop image or video URL are required.' });
  }

  const newBanner = db.insert('hero_banners', {
    agency_id: agencyId,
    title,
    subtitle: subtitle || '',
    image_desktop: image_desktop || '',
    image_mobile: image_mobile || image_desktop || '',
    video_url: video_url || '',
    cta_text: cta_text || 'Explore Packages',
    cta_link: cta_link || '/packages',
    display_order: Number(display_order) || 1,
    is_active: is_active !== undefined ? !!is_active : true
  });

  res.status(201).json(newBanner);
});

app.put('/api/admin/banners/:id', authenticate, authorize(['admin']), (req, res) => {
  const banner = db.findById('hero_banners', req.params.id);
  if (!banner || banner.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Banner not found.' });
  }

  const updated = db.update('hero_banners', banner.id, req.body);
  res.json(updated);
});

app.delete('/api/admin/banners/:id', authenticate, authorize(['admin']), (req, res) => {
  const banner = db.findById('hero_banners', req.params.id);
  if (!banner || banner.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Banner not found.' });
  }

  db.delete('hero_banners', req.params.id);
  res.json({ success: true, message: 'Banner deleted.' });
});

// Admin Bookings & Booking Status Workflow
app.get('/api/admin/bookings', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const bookings = db.findAll('bookings', (b) => b.agency_id === agencyId);
  bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(bookings);
});

app.put('/api/admin/bookings/:id', authenticate, authorize(['admin']), (req, res) => {
  const booking = db.findById('bookings', req.params.id);
  if (!booking || booking.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const { booking_status, payment_status, advance_amount, balance_amount } = req.body;
  const updated = db.update('bookings', booking.id, {
    booking_status: booking_status || booking.booking_status,
    payment_status: payment_status || booking.payment_status,
    advance_amount: advance_amount !== undefined ? Number(advance_amount) : booking.advance_amount,
    balance_amount: balance_amount !== undefined ? Number(balance_amount) : booking.balance_amount
  });

  // Notify customer if booking confirmed
  if (booking_status === 'Confirmed' && booking.customer_id) {
    db.createNotification(
      booking.agency_id,
      booking.customer_id,
      'Booking Confirmed!',
      `Your booking #${booking.booking_number} has been confirmed. Get ready for your trip!`,
      'success',
      '/customer/bookings'
    );
  }

  res.json(updated);
});

// Admin Payments (Financial Ledger & Manual Payment Entry)
app.get('/api/admin/payments', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const payments = db.findAll('payments', (p) => p.agency_id === agencyId);
  payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  res.json(payments);
});

app.post('/api/admin/payments', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { booking_id, amount, payment_type, payment_method, transaction_reference, notes } = req.body;

  if (!booking_id || !amount) {
    return res.status(400).json({ error: 'Booking ID and payment amount are required.' });
  }

  const booking = db.findById('bookings', booking_id);
  if (!booking || booking.agency_id !== agencyId) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const payAmount = Number(amount);
  const newPayment = db.insert('payments', {
    agency_id: agencyId,
    booking_id,
    amount: payAmount,
    payment_type: payment_type || 'Advance',
    payment_method: payment_method || 'Bank Transfer',
    transaction_reference: transaction_reference || `TXN-${Date.now()}`,
    payment_date: new Date().toISOString(),
    notes: notes || 'Manual payment recorded by Administrator.',
    status: 'Completed'
  });

  // Update booking advance and balance
  const currentAdvance = (booking.advance_amount || 0) + payAmount;
  const currentBalance = Math.max(0, (booking.total_amount || 0) - currentAdvance);
  const paymentStatus = currentBalance === 0 ? 'Paid' : 'Partial';

  db.update('bookings', booking.id, {
    advance_amount: currentAdvance,
    balance_amount: currentBalance,
    payment_status: paymentStatus
  });

  res.status(201).json(newPayment);
});

// Admin Reports & CSV Export
app.get('/api/admin/reports', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { date_from, date_to } = req.query;

  const leads = db.findAll('leads', (l) => l.agency_id === agencyId);
  const bookings = db.findAll('bookings', (b) => b.agency_id === agencyId);
  const staff = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'staff');
  const agents = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'agent');

  const staffPerformance = staff.map((s) => {
    const sLeads = leads.filter((l) => l.assigned_staff_id === s.id);
    const converted = sLeads.filter((l) => l.status === 'Converted');
    return {
      id: s.id,
      name: s.name,
      assigned: sLeads.length,
      converted: converted.length,
      rate: sLeads.length ? `${((converted.length / sLeads.length) * 100).toFixed(0)}%` : '0%'
    };
  });

  const agentPerformance = agents.map((a) => {
    const profile = db.findOne('agent_profiles', (ap) => ap.user_id === a.id) || {};
    const purchases = db.findAll('agent_purchases', (ap) => ap.agent_id === a.id);
    const totalVolume = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);
    return {
      id: a.id,
      name: a.name,
      company: profile.company_name || 'Partner',
      purchasesCount: purchases.length,
      totalVolume
    };
  });

  res.json({
    leadCount: leads.length,
    bookingCount: bookings.length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
    staffPerformance,
    agentPerformance
  });
});

// CSV Export Endpoint
app.get('/api/admin/reports/export-csv', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { type = 'leads' } = req.query;

  let csvContent = '';
  let filename = `export-${type}-${Date.now()}.csv`;

  if (type === 'leads') {
    const leads = db.findAll('leads', (l) => l.agency_id === agencyId);
    csvContent = 'Lead ID,Customer Name,Email,Phone,Destination,Status,Assigned Staff,Budget,Travel Date,Created Date\n';
    leads.forEach((l) => {
      csvContent += `"${l.id}","${l.customer_name}","${l.customer_email}","${l.customer_phone}","${l.interested_destination}","${l.status}","${l.assigned_staff_name || ''}","${l.budget}","${l.travel_date}","${l.created_at}"\n`;
    });
  } else if (type === 'bookings') {
    const bookings = db.findAll('bookings', (b) => b.agency_id === agencyId);
    csvContent = 'Booking Number,Customer Name,Package Title,Travel Start,Travelers,Total Amount,Advance,Balance,Payment Status,Booking Status\n';
    bookings.forEach((b) => {
      csvContent += `"${b.booking_number}","${b.customer_name}","${b.package_title}","${b.travel_start_date}","${b.travelers_count}","${b.total_amount}","${b.advance_amount}","${b.balance_amount}","${b.payment_status}","${b.booking_status}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// Admin Agency Settings
app.get('/api/admin/settings', authenticate, authorize(['admin']), (req, res) => {
  const agency = db.findById('agencies', req.user.agency_id);
  const settings = db.findOne('agency_settings', (s) => s.agency_id === req.user.agency_id);
  res.json({ agency, settings });
});

app.put('/api/admin/settings', authenticate, authorize(['admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { name, tagline, email, phone, address, currency, default_wholesale_discount_pct, terms_conditions } = req.body;

  const updatedAgency = db.update('agencies', agencyId, {
    name,
    tagline,
    email,
    phone,
    address,
    currency
  });

  let settings = db.findOne('agency_settings', (s) => s.agency_id === agencyId);
  if (settings) {
    settings = db.update('agency_settings', settings.id, {
      default_wholesale_discount_pct: Number(default_wholesale_discount_pct) || 12,
      terms_conditions
    });
  }

  res.json({ agency: updatedAgency, settings });
});

// ==========================================
// 5. STAFF PORTAL ENDPOINTS
// ==========================================

// Staff Dashboard
app.get('/api/staff/dashboard', authenticate, authorize(['staff']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;

  const assignedLeads = db.findAll('leads', (l) => l.agency_id === agencyId && l.assigned_staff_id === staffId);
  const newLeads = assignedLeads.filter((l) => l.status === 'Assigned' || l.status === 'New');
  const quotationsSent = assignedLeads.filter((l) => l.status === 'Quotation Sent');
  const convertedLeads = assignedLeads.filter((l) => l.status === 'Converted');
  const followUpsDueToday = assignedLeads.filter((l) => {
    if (!l.follow_up_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return l.follow_up_date.startsWith(today);
  });

  const quotations = db.findAll('quotations', (q) => q.staff_id === staffId);

  res.json({
    stats: {
      my_leads: assignedLeads.length,
      new_leads: newLeads.length,
      follow_ups_due: followUpsDueToday.length,
      quotations_sent: quotationsSent.length,
      converted_leads: convertedLeads.length
    },
    assignedLeads: assignedLeads.slice(0, 10),
    followUpsDueToday,
    recentQuotations: quotations.slice(0, 5)
  });
});

// Staff Assigned Leads (Strict isolation: only leads assigned to this staff)
app.get('/api/staff/leads', authenticate, authorize(['staff']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const { status, search } = req.query;

  let leads = db.findAll('leads', (l) => l.agency_id === agencyId && l.assigned_staff_id === staffId);

  if (status && status !== 'all') {
    leads = leads.filter((l) => l.status === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    leads = leads.filter((l) =>
      l.customer_name.toLowerCase().includes(q) ||
      l.interested_destination.toLowerCase().includes(q) ||
      l.customer_phone.includes(q) ||
      l.customer_email.toLowerCase().includes(q)
    );
  }

  leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(leads);
});

// Staff Lead Detail & Timeline
app.get('/api/staff/leads/:id', authenticate, authorize(['staff']), (req, res) => {
  const staffId = req.user.id;
  const lead = db.findById('leads', req.params.id);

  if (!lead || lead.assigned_staff_id !== staffId) {
    return res.status(403).json({ error: 'Access denied. You can only view leads assigned to you.' });
  }

  const activities = db.findAll('lead_activities', (a) => a.lead_id === lead.id);
  activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const quotations = db.findAll('quotations', (q) => q.lead_id === lead.id);
  const pkg = lead.interested_package_id ? db.findById('packages', lead.interested_package_id) : null;

  res.json({ lead, activities, quotations, package: pkg });
});

// Staff Update Lead Status, Notes & Follow-up
app.put('/api/staff/leads/:id/status', authenticate, authorize(['staff']), (req, res) => {
  const staffId = req.user.id;
  const lead = db.findById('leads', req.params.id);

  if (!lead || lead.assigned_staff_id !== staffId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { status, notes, follow_up_date } = req.body;
  const oldStatus = lead.status;

  const updated = db.update('leads', lead.id, {
    status: status || lead.status,
    notes: notes !== undefined ? notes : lead.notes,
    follow_up_date: follow_up_date !== undefined ? follow_up_date : lead.follow_up_date
  });

  if (status && status !== oldStatus) {
    db.recordActivity(lead.id, staffId, 'status_change', `Staff ${req.user.name} changed status to '${status}'. Note: ${notes || 'None'}`);
  } else if (notes) {
    db.recordActivity(lead.id, staffId, 'note', `Staff ${req.user.name} added note: ${notes}`);
  }

  res.json(updated);
});

// Staff Create & Dispatch Quotation
app.post('/api/staff/quotations', authenticate, authorize(['staff']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const { lead_id, package_id, items, total_amount, discount, notes, valid_until } = req.body;

  const lead = db.findById('leads', lead_id);
  if (!lead || lead.assigned_staff_id !== staffId) {
    return res.status(403).json({ error: 'Access denied. Cannot quote for this lead.' });
  }

  const tot = Number(total_amount);
  const disc = Number(discount) || 0;
  const finalAmt = Math.max(0, tot - disc);
  const quoteNum = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newQuote = db.insert('quotations', {
    agency_id: agencyId,
    lead_id,
    package_id: package_id || lead.interested_package_id,
    staff_id: staffId,
    quotation_number: quoteNum,
    customer_name: lead.customer_name,
    total_amount: tot,
    discount: disc,
    final_amount: finalAmt,
    status: 'Sent',
    valid_until: valid_until || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    items: items || [],
    notes: notes || 'Prepared and approved by travel consultant.',
    created_at: new Date().toISOString()
  });

  // Update lead status to 'Quotation Sent'
  db.update('leads', lead.id, { status: 'Quotation Sent' });
  db.recordActivity(lead.id, staffId, 'quotation', `Dispatched Quotation #${quoteNum} for ₹${finalAmt.toLocaleString('en-IN')}`);

  // Notify customer if they have an account
  if (lead.customer_id) {
    db.createNotification(
      agencyId,
      lead.customer_id,
      'New Quotation Received',
      `Your travel quotation #${quoteNum} is ready for review.`,
      'info',
      '/customer/enquiries'
    );
  }

  res.status(201).json(newQuote);
});

// Staff Convert Lead to Confirmed Booking
app.post('/api/staff/leads/:id/convert', authenticate, authorize(['staff']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const lead = db.findById('leads', req.params.id);

  if (!lead || lead.assigned_staff_id !== staffId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { total_amount, advance_amount, travel_start_date, travel_end_date, special_requests } = req.body;
  const tot = Number(total_amount);
  const adv = Number(advance_amount) || 0;
  const bal = Math.max(0, tot - adv);

  const bookingNum = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newBooking = db.insert('bookings', {
    agency_id: agencyId,
    booking_number: bookingNum,
    customer_id: lead.customer_id,
    customer_name: lead.customer_name,
    customer_email: lead.customer_email,
    agent_id: null,
    package_id: lead.interested_package_id,
    package_title: lead.interested_destination,
    travel_start_date: travel_start_date || lead.travel_date || new Date().toISOString().split('T')[0],
    travel_end_date: travel_end_date || '',
    travelers_count: lead.travelers_count || 2,
    total_amount: tot,
    advance_amount: adv,
    balance_amount: bal,
    payment_status: bal === 0 ? 'Paid' : (adv > 0 ? 'Partial' : 'Pending'),
    booking_status: 'Confirmed',
    special_requests: special_requests || lead.notes,
    created_at: new Date().toISOString()
  });

  // If advance was paid, record payment
  if (adv > 0) {
    db.insert('payments', {
      agency_id: agencyId,
      booking_id: newBooking.id,
      amount: adv,
      payment_type: 'Advance',
      payment_method: 'UPI',
      transaction_reference: `CONV-PAY-${Date.now()}`,
      payment_date: new Date().toISOString(),
      notes: 'Initial booking deposit recorded during lead conversion.',
      status: 'Completed'
    });
  }

  // Update lead status to 'Converted'
  db.update('leads', lead.id, { status: 'Converted' });
  db.recordActivity(lead.id, staffId, 'status_change', `Lead successfully CONVERTED to confirmed Booking #${bookingNum}!`);

  // Notify admin
  const admins = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'admin');
  for (const admin of admins) {
    db.createNotification(
      agencyId,
      admin.id,
      'Lead Converted!',
      `Staff ${req.user.name} converted lead #${lead.id} into confirmed booking #${bookingNum} (₹${tot.toLocaleString('en-IN')}).`,
      'success',
      '/admin/bookings'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Lead converted successfully!',
    booking: newBooking
  });
});

// Staff Follow-ups Agenda
app.get('/api/staff/follow-ups', authenticate, authorize(['staff']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;

  const leads = db.findAll('leads', (l) => l.agency_id === agencyId && l.assigned_staff_id === staffId && l.follow_up_date);
  leads.sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));
  res.json(leads);
});

// ==========================================
// 6. AGENT PORTAL (B2B WHOLESALE SYSTEM)
// ==========================================

// Agent Dashboard
app.get('/api/agent/dashboard', authenticate, authorize(['agent']), (req, res) => {
  const agentId = req.user.id;
  const agencyId = req.user.agency_id;

  const profile = db.findOne('agent_profiles', (ap) => ap.user_id === agentId) || {};
  const purchases = db.findAll('agent_purchases', (ap) => ap.agent_id === agentId);
  const bookings = db.findAll('bookings', (b) => b.agent_id === agentId);

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalClientSales = purchases.reduce((sum, p) => sum + (p.client_selling_price || 0), 0);
  const totalMargin = Math.max(0, totalClientSales - totalPurchasesAmount);

  res.json({
    profile,
    stats: {
      wholesale_discount_pct: profile.wholesale_discount_pct || 12,
      total_purchases: purchases.length,
      total_purchase_amount: totalPurchasesAmount,
      total_client_sales: totalClientSales,
      projected_gross_margin: totalMargin,
      credit_limit: profile.credit_limit || 500000,
      confirmed_bookings: bookings.length
    },
    recentPurchases: purchases.slice(0, 5),
    recentBookings: bookings.slice(0, 5)
  });
});

// Agent Wholesale Marketplace (Displays wholesale purchase price vs public selling price)
app.get('/api/agent/marketplace', authenticate, authorize(['agent']), (req, res) => {
  const agencyId = req.user.agency_id;
  const profile = db.findOne('agent_profiles', (ap) => ap.user_id === req.user.id);
  const discountPct = profile ? profile.wholesale_discount_pct : 12;

  const packages = db.findAll('packages', (p) => p.agency_id === agencyId && p.is_published);

  const b2bPackages = packages.map((pkg) => {
    // Calculated wholesale price based on agent tier or package wholesale_price
    const wholesalePrice = pkg.wholesale_price || Math.round(pkg.public_price * (1 - discountPct / 100));
    const potentialMargin = pkg.public_price - wholesalePrice;
    return {
      ...pkg,
      agent_wholesale_price: wholesalePrice,
      potential_margin: potentialMargin,
      margin_pct: ((potentialMargin / pkg.public_price) * 100).toFixed(1)
    };
  });

  res.json(b2bPackages);
});

// Agent Purchase Package at Wholesale Price
app.post('/api/agent/purchase', authenticate, authorize(['agent']), (req, res) => {
  const agentId = req.user.id;
  const agencyId = req.user.agency_id;
  const { package_id, travelers_count, travel_date, client_name, client_selling_price } = req.body;

  const pkg = db.findById('packages', package_id);
  if (!pkg || pkg.agency_id !== agencyId) {
    return res.status(404).json({ error: 'Package not found.' });
  }

  const profile = db.findOne('agent_profiles', (ap) => ap.user_id === agentId);
  const discountPct = profile ? profile.wholesale_discount_pct : 12;
  const wholesalePerPerson = pkg.wholesale_price || Math.round(pkg.public_price * (1 - discountPct / 100));

  const pax = Number(travelers_count) || 2;
  const totalCost = wholesalePerPerson * pax;
  const clientPrice = Number(client_selling_price) || (pkg.public_price * pax);
  const projectedMargin = Math.max(0, clientPrice - totalCost);

  const newPurchase = db.insert('agent_purchases', {
    agency_id: agencyId,
    agent_id: agentId,
    package_id: pkg.id,
    package_title: pkg.title,
    travelers_count: pax,
    travel_date: travel_date || pkg.upcoming_date || new Date().toISOString().split('T')[0],
    wholesale_price: wholesalePerPerson,
    total_cost: totalCost,
    client_name: client_name || 'B2B Partner Client',
    client_selling_price: clientPrice,
    projected_margin: projectedMargin,
    status: 'Confirmed',
    created_at: new Date().toISOString()
  });

  // Create corresponding B2B booking record
  const bookingNum = `B2B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  db.insert('bookings', {
    agency_id: agencyId,
    booking_number: bookingNum,
    customer_id: null,
    customer_name: client_name || `Client of ${profile ? profile.company_name : req.user.name}`,
    customer_email: req.user.email,
    agent_id: agentId,
    package_id: pkg.id,
    package_title: pkg.title,
    travel_start_date: travel_date || new Date().toISOString().split('T')[0],
    travel_end_date: '',
    travelers_count: pax,
    total_amount: clientPrice,
    advance_amount: totalCost,
    balance_amount: 0,
    payment_status: 'Paid',
    booking_status: 'Confirmed',
    special_requests: `B2B Wholesale purchase by Agent ${req.user.name}. Margin: ₹${projectedMargin.toLocaleString('en-IN')}`,
    created_at: new Date().toISOString()
  });

  // Record Agent Ledger Transaction
  db.insert('agent_transactions', {
    agency_id: agencyId,
    agent_id: agentId,
    type: 'Purchase',
    amount: totalCost,
    balance_after: totalCost,
    reference_id: newPurchase.id,
    description: `Wholesale purchase of ${pkg.title} for ${pax} pax.`,
    created_at: new Date().toISOString()
  });

  // Notify Admin of Agent Order
  const admins = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'admin');
  for (const admin of admins) {
    db.createNotification(
      agencyId,
      admin.id,
      'New B2B Agent Purchase',
      `Agent ${req.user.name} placed a wholesale purchase for ${pkg.title} (₹${totalCost.toLocaleString('en-IN')}).`,
      'info',
      '/admin/bookings'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Wholesale package purchased successfully!',
    purchase: newPurchase
  });
});

// Agent Purchases List
app.get('/api/agent/purchases', authenticate, authorize(['agent']), (req, res) => {
  const agentId = req.user.id;
  const purchases = db.findAll('agent_purchases', (ap) => ap.agent_id === agentId);
  purchases.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(purchases);
});

// Agent Transactions / Ledger
app.get('/api/agent/transactions', authenticate, authorize(['agent']), (req, res) => {
  const agentId = req.user.id;
  const transactions = db.findAll('agent_transactions', (tx) => tx.agent_id === agentId);
  transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(transactions);
});

// ==========================================
// 7. FILE UPLOAD ENDPOINT
// ==========================================
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// ==========================================
// 8. NOTIFICATIONS ENDPOINTS
// ==========================================
app.get('/api/notifications', authenticate, (req, res) => {
  const notifications = db.findAll('notifications', (n) => n.user_id === req.user.id);
  notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(notifications);
});

app.put('/api/notifications/:id/read', authenticate, (req, res) => {
  const notif = db.findById('notifications', req.params.id);
  if (!notif || notif.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found.' });
  }
  const updated = db.update('notifications', notif.id, { is_read: true });
  res.json(updated);
});

app.put('/api/notifications/read-all', authenticate, (req, res) => {
  const userNotifs = db.findAll('notifications', (n) => n.user_id === req.user.id && !n.is_read);
  for (const n of userNotifs) {
    db.update('notifications', n.id, { is_read: true });
  }
  res.json({ success: true, count: userNotifs.length });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    platform: 'Travel Genie Multi-Agency CRM & Booking Platform',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build from 'dist' if present
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler for API routes
const { errorHandler } = require('./src/middlewares/error.middleware');
app.use(errorHandler);

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[SERVER] TripByGenie Backend Server running on port ${PORT}`);
  console.log(`[SERVER] API Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
