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
const emailService = require('./src/services/email.service');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'travel_genie_super_secure_jwt_secret_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Mount Modular API v1 Routes
const v1Routes = require('./src/routes/v1');
app.use('/api/v1', v1Routes);

// Uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

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
const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB for pristine 4K/HD video and raw media
});

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
    // Super Admin has universal access to all management and operational resources
    if (req.user.role === 'admin') {
      return next();
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

// Login (Unified single login for all roles with Agent ID or Email support)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Agent ID and password are required.' });
  }

  const trimmed = (email || '').trim().toLowerCase();
  let user = db.findOne('users', (u) => u.email.toLowerCase() === trimmed);
  if (!user) {
    // Check if input is an Agent ID (e.g. B2B-2026-0001 or AGT-XXXX)
    const b2b = db.findOne('b2b_agents', (a) => a.agent_id && a.agent_id.toLowerCase() === trimmed);
    if (b2b && b2b.user_id) {
      user = db.findById('users', b2b.user_id);
    } else {
      const ap = db.findOne('agent_profiles', (a) => a.agent_id && a.agent_id.toLowerCase() === trimmed);
      if (ap && ap.user_id) {
        user = db.findById('users', ap.user_id);
      }
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid email/Agent ID or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Your account is pending activation or has been deactivated. Please contact administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email/Agent ID or password.' });
  }

  // Record last login timestamp
  db.update('users', user.id, { last_login_at: new Date().toISOString() });
  if (user.role === 'agent') {
    const b2b = db.findOne('b2b_agents', (b) => b.user_id === user.id);
    if (b2b) db.update('b2b_agents', b2b.id, { last_login_at: new Date().toISOString() });
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

// Demo Login (Instant switch between roles for testing: admin, manager, sales/staff, operations, agent, customer)
app.post('/api/auth/demo-login', (req, res) => {
  const { role, agency_slug } = req.body;
  let targetAgency = db.findOne('agencies', (a) => a.slug === (agency_slug || 'travel-genie'));
  if (!targetAgency) {
    targetAgency = db.findAll('agencies')[0];
  }

  const requestedRole = (role || 'admin').toLowerCase();
  const roleAliases = requestedRole === 'sales' ? ['sales', 'staff'] : [requestedRole];

  let user = db.findOne('users', (u) =>
    (u.agency_id === targetAgency.id || u.role === 'admin' || u.role === 'manager') &&
    roleAliases.includes(u.role.toLowerCase())
  );
  if (!user) {
    user = db.findOne('users', (u) => roleAliases.includes(u.role.toLowerCase()));
  }
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
  const banners = db.findAll('hero_banners', (b) => (!b.agency_id || b.agency_id === agencyId || b.agency_id === 'agency_001') && b.is_active);
  banners.sort((a, b) => a.display_order - b.display_order);
  res.json(banners);
});

// Helper to accurately match packages to a destination
const matchPackageToDestination = (pkg, dest) => {
  if (pkg.is_published === false) return false;
  const dId = (dest.id || '').toLowerCase().trim();
  const dName = (dest.name || '').toLowerCase().trim();
  const dSlug = (dest.slug || '').toLowerCase().trim();
  const pDestId = (pkg.destination_id || '').toLowerCase().trim();
  const pDest = (pkg.destination || '').toLowerCase().trim();
  const pTitle = (pkg.title || '').toLowerCase().trim();

  if (pDestId && pDestId === dId) return true;
  if (pDest && (pDest === dName || pDest === dSlug)) return true;
  if (dName && (pTitle.includes(dName) || pDest.includes(dName))) return true;

  if (dName === 'kashmir' && (pDestId === 'dest_jammu_and_kashmir' || pTitle.includes('kashmir') || pTitle.includes('srinagar') || pTitle.includes('gulmarg'))) return true;
  if (dName.includes('andaman') && (pDestId === 'dest_andaman' || pTitle.includes('andaman') || pTitle.includes('havelock') || pTitle.includes('port blair'))) return true;
  if (dName === 'goa' && (pDestId === 'dest_goa' || pTitle.includes('goa'))) return true;

  return false;
};

// Public Destinations
app.get('/api/public/destinations', (req, res) => {
  const agencyId = req.query.agency_id || 'agency_travel_genie';
  const { region, featured } = req.query;

  let destinations = db.findAll('destinations', (d) => (!d.agency_id || d.agency_id === agencyId || d.agency_id === 'agency_001') && d.is_published);
  if (region && region !== 'all') {
    destinations = destinations.filter((d) => d.region.toLowerCase() === region.toLowerCase());
  }
  if (featured === 'true') {
    destinations = destinations.filter((d) => d.is_featured);
  }

  const allPackages = db.findAll('packages', (p) => p.is_published !== false);
  const accurateDestinations = destinations.map((d) => ({
    ...d,
    package_count: allPackages.filter((p) => matchPackageToDestination(p, d)).length
  }));

  res.json(accurateDestinations);
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

  const packages = db.findAll('packages', (p) => matchPackageToDestination(p, destination));
  res.json({ destination: { ...destination, package_count: packages.length }, packages });
});

// Public Packages with Filters
app.get('/api/public/packages', (req, res) => {
  const agencyId = req.query.agency_id || 'agency_travel_genie';
  const { category, destination, max_price, duration, search, featured, group_tour } = req.query;

  let packages = db.findAll('packages', (p) => (!p.agency_id || p.agency_id === agencyId || p.agency_id === 'agency_001') && p.is_published);

  if (category && category !== 'all') {
    packages = packages.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (destination && destination !== 'all') {
    const dTarget = destination.toLowerCase().trim();
    const destObj = db.findOne('destinations', (d) => d.id === destination || d.slug === dTarget || (d.name && d.name.toLowerCase() === dTarget));
    if (destObj) {
      packages = packages.filter((p) => matchPackageToDestination(p, destObj));
    } else {
      packages = packages.filter((p) => p.destination_id === destination || (p.destination && p.destination.toLowerCase() === dTarget));
    }
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
    const dest = db.findOne('destinations', (d) => {
      if (!d) return false;
      const dSlug = (d.slug || '').toLowerCase().trim();
      const dId = (d.id || '').toLowerCase().trim();
      return dSlug === cleanSlug || dId === cleanSlug || dId === `dest_${cleanSlug.replace(/-/g, '_')}`;
    });
    if (dest) {
      return res.json({ is_destination: true, destination_slug: dest.slug || cleanSlug });
    }
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
  const tours = db.findAll('packages', (p) => (!p.agency_id || p.agency_id === agencyId || p.agency_id === 'agency_001') && (p.is_group_tour || p.category === 'Group Tours') && p.is_published !== false);
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
app.post('/api/public/enquiry', async (req, res) => {
  const {
    name,
    email,
    phone,
    destination,
    package_id,
    departure_date,
    return_date,
    travel_date,
    adults,
    children,
    infants,
    travelers_count,
    budget,
    hotel_preference,
    travel_preference,
    travel_type,
    additional_requirements,
    special_requirements,
    additional_message,
    departure_city,
    country,
    source,
    campaign_source,
    landing_page_url,
    agency_id
  } = req.body;

  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim();
  const trimmedPhone = (phone || '').trim();
  const trimmedDest = (destination || '').trim();
  const trimmedDepCity = (departure_city || '').trim();
  const finalTravelDate = travel_date || departure_date || '';

  // Full Name validation
  if (!trimmedName) {
    return res.status(400).json({ error: 'Full Name is required.' });
  }
  if (trimmedName.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  }
  if (/^\d+$/.test(trimmedName)) {
    return res.status(400).json({ error: 'Name cannot be only numbers.' });
  }
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return res.status(400).json({ error: 'Name must contain at least one letter.' });
  }
  if (/[^a-zA-Z0-9_\s]/.test(trimmedName)) {
    return res.status(400).json({ error: 'Name cannot contain special characters (only letters, numbers, spaces, and _ allowed).' });
  }

  // Email validation
  if (!trimmedEmail) {
    return res.status(400).json({ error: 'Email Address is required.' });
  }
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address with a domain (e.g. name@domain.com).' });
  }

  // Phone validation
  if (!trimmedPhone) {
    return res.status(400).json({ error: 'Mobile number is required.' });
  }
  const digitsOnly = trimmedPhone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return res.status(400).json({ error: 'Mobile number must contain at least 10 digits.' });
  }

  // Destination validation
  if (!trimmedDest) {
    return res.status(400).json({ error: 'Destination is required.' });
  }
  if (trimmedDest.length < 2) {
    return res.status(400).json({ error: 'Destination must be at least 2 characters.' });
  }
  if (/^\d+$/.test(trimmedDest)) {
    return res.status(400).json({ error: 'Destination cannot be only numbers.' });
  }

  // Departure City validation (optional)
  if (trimmedDepCity) {
    if (trimmedDepCity.length < 2) {
      return res.status(400).json({ error: 'Departure city must be at least 2 characters.' });
    }
    if (/^\d+$/.test(trimmedDepCity)) {
      return res.status(400).json({ error: 'Departure city cannot be only numbers.' });
    }
  }

  // Travel Date validation (optional)
  if (finalTravelDate) {
    const selectedDate = new Date(finalTravelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Travel date cannot be in the past.' });
    }
  }

  const targetAgencyId = agency_id || 'agency_travel_genie';

  // -------------------------------------------------------------
  // Accidental Duplicate Submission Prevention (30-second window on same email & destination)
  // -------------------------------------------------------------
  const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  const recentDuplicate = db.findOne('leads', (l) => {
    const isSameEmail = l.customer_email && l.customer_email.toLowerCase() === trimmedEmail.toLowerCase();
    const isSameDest = (l.interested_destination || '').toLowerCase() === trimmedDest.toLowerCase();
    const isRecent = l.created_at && l.created_at >= thirtySecsAgo;
    return isSameEmail && isSameDest && isRecent;
  });

  if (recentDuplicate) {
    return res.status(201).json({
      success: true,
      duplicate: true,
      message: 'Your enquiry has already been received! Our specialist is reviewing your request.',
      lead_id: recentDuplicate.id,
      enquiry_id: recentDuplicate.enquiry_id || recentDuplicate.id
    });
  }

  // Generate Unique Enquiry ID (e.g. ENQ-2026-0001)
  const enquiryId = db.generateUniqueCode('enquiries', 'ENQ', true);

  // Check if customer account already exists with this email (identity link)
  let existingUser = null;
  if (trimmedEmail) {
    existingUser = db.findOne('users', (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
  }

  const notesCombined = [
    trimmedDepCity ? `Departure City: ${trimmedDepCity}` : '',
    hotel_preference ? `Hotel: ${hotel_preference}` : '',
    travel_preference || travel_type ? `Preference: ${travel_preference || travel_type}` : '',
    additional_requirements || special_requirements ? `Requirements: ${additional_requirements || special_requirements}` : '',
    additional_message ? `Message: ${additional_message}` : '',
    landing_page_url || campaign_source ? `Source URL: ${landing_page_url || campaign_source}` : ''
  ].filter(Boolean).join(' | ');

  const totalPax = travelers_count ? Number(travelers_count) : ((Number(adults) || 2) + (Number(children) || 0) + (Number(infants) || 0));

  // 1. Save to dedicated enquiries table
  const newEnquiry = db.insert('enquiries', {
    enquiry_id: enquiryId,
    customer_name: trimmedName,
    customer_email: trimmedEmail,
    customer_phone: trimmedPhone,
    country: country || 'India',
    departure_city: trimmedDepCity || '',
    destination: trimmedDest,
    package_id: package_id || null,
    departure_date: finalTravelDate,
    return_date: return_date || '',
    adults: Number(adults) || 2,
    children: Number(children) || 0,
    infants: Number(infants) || 0,
    budget: budget || 'Flexible',
    travel_type: travel_type || travel_preference || 'Custom Tour',
    special_requirements: special_requirements || additional_requirements || '',
    additional_message: additional_message || '',
    source: source || 'Universal Landing Page',
    campaign_source: campaign_source || landing_page_url || '',
    status: 'NEW',
    created_at: new Date().toISOString()
  });

  // 2. Create corresponding CRM lead in leads table (compatible with New/NEW)
  const newLead = db.insert('leads', {
    agency_id: targetAgencyId,
    enquiry_id: enquiryId,
    customer_id: existingUser ? existingUser.id : null,
    customer_name: trimmedName,
    customer_email: trimmedEmail,
    customer_phone: trimmedPhone,
    country: country || 'India',
    city: trimmedDepCity || '',
    departure_city: trimmedDepCity || '',
    interested_destination: trimmedDest,
    interested_package_id: package_id || null,
    travel_date: finalTravelDate,
    return_date: return_date || '',
    adults: Number(adults) || 2,
    children: Number(children) || 0,
    infants: Number(infants) || 0,
    travelers_count: totalPax,
    budget: budget || 'Flexible',
    travel_type: travel_type || travel_preference || 'Holiday',
    lead_source: source || 'Universal Landing Page',
    campaign_source: campaign_source || landing_page_url || '',
    status: 'New', // Compatible with existing tests checking 'New' and case-insensitive queries for 'NEW'
    assigned_staff_id: null,
    assigned_staff_name: 'Unassigned',
    follow_up_date: null,
    notes: notesCombined || 'Customer submitted enquiry via Universal Landing Page.',
    created_at: new Date().toISOString()
  });

  // 3. Record audit trail & initial status history
  db.recordActivity(newLead.id, existingUser ? existingUser.id : 'system', 'status_change', `Lead created from Enquiry #${enquiryId} via Universal Landing Page enquiry form.`);
  db.recordLeadStatusHistory(targetAgencyId, newLead.id, 'NONE', 'NEW', 'system', `Enquiry #${enquiryId} submitted.`);
  db.recordAuditLog(targetAgencyId, 'system', 'CREATE_LEAD', 'lead', newLead.id, {
    enquiry_id: enquiryId,
    customer_name: trimmedName,
    customer_email: trimmedEmail,
    destination: trimmedDest
  });

  // 4. Send Enquiry Acknowledgement Email (Logged & dispatched)
  try {
    await emailService.sendEnquiryAcknowledgement({
      agency_id: targetAgencyId,
      to: trimmedEmail,
      name: trimmedName,
      enquiry_id: enquiryId,
      destination: trimmedDest
    });
  } catch (mailErr) {
    console.error('Failed to dispatch enquiry acknowledgement email:', mailErr);
  }

  // 5. Notify Admins and Managers
  const managersAndAdmins = db.findAll('users', (u) => u.agency_id === targetAgencyId && (u.role === 'admin' || u.role === 'manager'));
  for (const staffMember of managersAndAdmins) {
    db.createNotification(
      targetAgencyId,
      staffMember.id,
      'New Customer Enquiry',
      `Enquiry #${enquiryId} from ${trimmedName} for ${trimmedDest}. Awaiting assignment.`,
      'info',
      staffMember.role === 'manager' ? '/manager/leads' : '/admin/leads'
    );
  }

  // 6. Return response (No customer portal login account is generated at this stage)
  res.status(201).json({
    success: true,
    message: 'Your enquiry has been received. Our travel specialist will contact you shortly!',
    lead_id: newLead.id,
    enquiry_id: enquiryId
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

  const enquiries = db.findAll('leads', (l) => l.customer_id === userId || (req.user.email && l.customer_email && l.customer_email.toLowerCase() === req.user.email.toLowerCase()));
  const bookings = db.findAll('bookings', (b) => b.customer_id === userId || (req.user.email && b.customer_email && b.customer_email.toLowerCase() === req.user.email.toLowerCase()));
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

// Process Direct Customer Payment
app.post('/api/customer/payments', authenticate, authorize(['customer']), (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email.toLowerCase();
  const { booking_id, amount, payment_method, transaction_reference, notes } = req.body;

  if (!booking_id || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Booking ID and a valid payment amount are required.' });
  }

  const booking = db.findById('bookings', booking_id);
  if (!booking || (booking.customer_id !== userId && (!booking.customer_email || booking.customer_email.toLowerCase() !== userEmail))) {
    return res.status(404).json({ error: 'Booking not found or does not belong to your account.' });
  }

  const payAmount = Number(amount);
  const currentAdvance = (booking.advance_amount || 0) + payAmount;
  const currentBalance = Math.max(0, (booking.total_amount || 0) - currentAdvance);
  const paymentStatus = currentBalance === 0 ? 'Paid' : 'Partial';

  const newPayment = db.insert('payments', {
    agency_id: booking.agency_id,
    booking_id: booking.id,
    customer_id: userId,
    amount: payAmount,
    payment_type: currentBalance === 0 ? 'Full / Final Settlement' : 'Advance / Partial Installment',
    payment_method: payment_method || 'UPI / NetBanking',
    transaction_reference: transaction_reference || `CUST-TXN-${Date.now()}`,
    payment_date: new Date().toISOString(),
    notes: notes || 'Direct customer payment received online.',
    status: 'Completed'
  });

  // Update booking
  const updateFields = {
    advance_amount: currentAdvance,
    balance_amount: currentBalance,
    payment_status: paymentStatus
  };
  if (paymentStatus === 'Paid' && booking.booking_status === 'Pending') {
    updateFields.booking_status = 'Confirmed';
  }
  db.update('bookings', booking.id, updateFields);

  // Generate official tax invoice
  const subtotal = Math.round(payAmount / 1.05);
  const tax = payAmount - subtotal;
  const inv = db.insert('invoices', {
    agency_id: booking.agency_id,
    invoice_number: `TG-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    booking_id: booking.id,
    customer_id: userId,
    customer_name: req.user.name,
    invoice_date: new Date().toISOString().split('T')[0],
    subtotal,
    cgst: Math.round(tax / 2),
    sgst: Math.round(tax / 2),
    igst: 0,
    total_amount: payAmount,
    payment_status: paymentStatus,
    pdf_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  });

  // Notify customer
  db.insert('notifications', {
    agency_id: booking.agency_id,
    user_id: userId,
    title: 'Payment Successful!',
    message: `Payment of ₹${payAmount.toLocaleString('en-IN')} confirmed for booking #${booking.booking_number}. Invoice #${inv.invoice_number} generated.`,
    type: 'success',
    link: '/customer/payments',
    is_read: false,
    created_at: new Date().toISOString()
  });

  // Notify operations & manager
  const staffToNotify = db.findAll('users', (u) => u.agency_id === booking.agency_id && (u.role === 'manager' || u.role === 'admin' || u.role === 'operations'));
  for (const s of staffToNotify) {
    db.createNotification(
      booking.agency_id,
      s.id,
      'Customer Payment Received',
      `Customer ${req.user.name} paid ₹${payAmount.toLocaleString('en-IN')} for booking #${booking.booking_number}. Status: ${paymentStatus}.`,
      'info',
      s.role === 'operations' ? '/operations/bookings' : '/admin/payments'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Payment processed and verified successfully.',
    payment: newPayment,
    invoice: inv,
    booking_update: { advance_amount: currentAdvance, balance_amount: currentBalance, payment_status: paymentStatus }
  });
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
// 4. SUPER ADMIN USER & ID MANAGEMENT ENDPOINTS
// ==========================================

// Get all users with optional role & search filter
app.get('/api/admin/users', authenticate, authorize(['admin']), (req, res) => {
  const { role, search } = req.query;
  let users = db.findAll('users');
  if (role && role !== 'all') {
    users = users.filter((u) => u.role === role);
  }
  if (search) {
    const s = search.toLowerCase();
    users = users.filter((u) =>
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.display_id?.toLowerCase().includes(s) ||
      u.id?.toLowerCase().includes(s)
    );
  }
  const safeUsers = users.map(({ password_hash, ...rest }) => rest);
  res.json(safeUsers);
});

// Create new ID / User (Manager, Staff, Agent, Customer)
app.post('/api/admin/users', authenticate, authorize(['admin']), (req, res) => {
  const {
    role,
    name,
    email,
    phone,
    password,
    agency_id,
    department,
    designation,
    company_name,
    discount_pct,
    address
  } = req.body;

  if (!role || !name || !email || !password) {
    return res.status(400).json({ error: 'Role, Name, Email, and Password are required.' });
  }

  const existing = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const prefixMap = {
    admin: 'ADM',
    manager: 'MGR',
    staff: 'STF',
    sales: 'SLS',
    operations: 'OPS',
    agent: 'AGT',
    customer: 'CUS'
  };
  const prefix = prefixMap[role] || 'USR';
  const displayId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  const customId = `usr_${role}_${Date.now().toString(36)}`;

  const newUser = db.insert('users', {
    id: customId,
    display_id: displayId,
    agency_id: agency_id || 'agency_travel_genie',
    role,
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    password_hash: bcrypt.hashSync(password, 10),
    status: 'active',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
  });

  // Create role-specific profiles if needed
  if (role === 'staff') {
    db.insert('staff_profiles', {
      user_id: newUser.id,
      agency_id: newUser.agency_id,
      employee_id: displayId,
      department: department || 'Sales & Customer Operations',
      designation: designation || 'Travel Specialist',
      assigned_leads_count: 0,
      converted_leads_count: 0,
      rating: 5.0
    });
  } else if (role === 'agent') {
    db.insert('agent_profiles', {
      user_id: newUser.id,
      agency_id: newUser.agency_id,
      agency_name: company_name || `${name} Travels`,
      commercial_id: displayId,
      tier: 'standard',
      wholesale_discount_pct: Number(discount_pct) || 12,
      credit_limit: 500000,
      available_credit: 500000,
      kyc_status: 'verified'
    });
  } else if (role === 'customer') {
    db.insert('customer_profiles', {
      user_id: newUser.id,
      agency_id: newUser.agency_id,
      passport_number: '',
      emergency_contact: phone || '',
      preferred_currency: 'INR',
      loyalty_points: 100,
      notes: address || ''
    });
  }

  const { password_hash, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update User details / role / status
app.put('/api/admin/users/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const user = db.findById('users', id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { name, phone, status, role, agency_id, password } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (status) updates.status = status;
  if (role) updates.role = role;
  if (agency_id) updates.agency_id = agency_id;
  if (password) updates.password_hash = bcrypt.hashSync(password, 10);

  const updated = db.update('users', id, updates);
  const { password_hash, ...safeUser } = updated;
  res.json(safeUser);
});

// Delete User
app.delete('/api/admin/users/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const user = db.findById('users', id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role === 'admin' && user.email === 'admin@travelgenie.com') {
    return res.status(400).json({ error: 'Cannot delete primary Super Administrator.' });
  }
  db.delete('users', id);
  res.json({ success: true, message: 'User deleted successfully.' });
});

// ==========================================
// 4. ADMIN & MANAGER PORTAL ENDPOINTS
// ==========================================

// Admin Dashboard KPI Stats & Charts
app.get('/api/admin/dashboard', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/admin/leads', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { status, staff_id, source, search, page = 1, limit = 20 } = req.query;

  let allLeads = db.findAll('leads', (l) => !l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie');

  // Status Filter with case-insensitivity and special unassigned/assigned support
  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    if (sLower === 'unassigned') {
      allLeads = allLeads.filter(l => !l.assigned_staff_id || (l.status && l.status.toLowerCase() === 'unassigned'));
    } else if (sLower === 'assigned') {
      allLeads = allLeads.filter(l => !!l.assigned_staff_id || (l.status && l.status.toLowerCase() === 'assigned'));
    } else if (sLower === 'new') {
      allLeads = allLeads.filter(l => l.status && l.status.toLowerCase() === 'new');
    } else if (sLower === 'contacted') {
      allLeads = allLeads.filter(l => l.status && l.status.toLowerCase() === 'contacted');
    } else if (sLower === 'qualified') {
      allLeads = allLeads.filter(l => l.status && l.status.toLowerCase() === 'qualified');
    } else if (sLower === 'quotation_prepared' || sLower === 'quotation prepared') {
      allLeads = allLeads.filter(l => l.status && (l.status.toLowerCase() === 'quotation prepared' || l.status.toLowerCase() === 'quotation_prepared'));
    } else if (sLower === 'quotation_sent' || sLower === 'quotation sent') {
      allLeads = allLeads.filter(l => l.status && (l.status.toLowerCase() === 'quotation sent' || l.status.toLowerCase() === 'quotation_sent'));
    } else if (sLower === 'negotiation') {
      allLeads = allLeads.filter(l => l.status && l.status.toLowerCase() === 'negotiation');
    } else if (sLower === 'customer_confirmed' || sLower === 'customer confirmed') {
      allLeads = allLeads.filter(l => l.status && (l.status.toLowerCase() === 'customer confirmed' || l.status.toLowerCase() === 'customer_confirmed'));
    } else if (sLower === 'payment_pending' || sLower === 'payment pending') {
      allLeads = allLeads.filter(l => l.status && (l.status.toLowerCase() === 'payment pending' || l.status.toLowerCase() === 'payment_pending'));
    } else if (sLower === 'partially_paid' || sLower === 'partially paid') {
      allLeads = allLeads.filter(l => l.status && (l.status.toLowerCase() === 'partially paid' || l.status.toLowerCase() === 'partially_paid'));
    } else if (sLower === 'converted') {
      allLeads = allLeads.filter(l => l.status && l.status.toLowerCase() === 'converted');
    } else if (sLower === 'lost') {
      allLeads = allLeads.filter(l => l.status && l.status.toLowerCase() === 'lost');
    } else {
      allLeads = allLeads.filter(l => (l.status || '').toLowerCase() === sLower);
    }
  }

  // Staff Filter
  if (staff_id && staff_id !== 'all') {
    allLeads = allLeads.filter(l => l.assigned_staff_id === staff_id);
  }

  // Source Filter
  if (source && source !== 'all') {
    allLeads = allLeads.filter(l => (l.lead_source || '').toLowerCase().includes(source.toLowerCase()));
  }

  // Search Filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allLeads = allLeads.filter(l =>
      (l.customer_name && l.customer_name.toLowerCase().includes(q)) ||
      (l.customer_email && l.customer_email.toLowerCase().includes(q)) ||
      (l.customer_phone && l.customer_phone.toLowerCase().includes(q)) ||
      (l.interested_destination && l.interested_destination.toLowerCase().includes(q)) ||
      (l.enquiry_id && l.enquiry_id.toLowerCase().includes(q)) ||
      (l.id && l.id.toLowerCase().includes(q))
    );
  }

  // Sort by created_at desc
  allLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = allLeads.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 20);
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (pageNum - 1) * pageSize;
  const paginated = allLeads.slice(startIndex, startIndex + pageSize);

  res.json({
    data: paginated,
    total,
    page: pageNum,
    limit: pageSize,
    totalPages
  });
});

// Admin Create Direct Lead
app.post('/api/admin/leads', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/admin/leads/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.put('/api/admin/leads/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.post('/api/admin/leads/assign', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
    if (lead && (!lead.agency_id || lead.agency_id === agencyId || lead.agency_id === 'agency_travel_genie' || !agencyId)) {
      const prevStaff = lead.assigned_staff_id;
      const prevStaffName = lead.assigned_staff_name;
      const prevStatus = lead.status;
      const effectiveAgencyId = lead.agency_id || agencyId || 'agency_travel_genie';

      const updated = db.update('leads', id, {
        assigned_staff_id: staff_id || null,
        assigned_staff_name: staffName,
        assigned_sales_executive: staffName,
        status: (lead.status === 'New' || lead.status === 'NEW' || lead.status === 'Unassigned' || lead.status === 'UNASSIGNED') ? newStatus : lead.status
      });

      // 1. Record in lead_assignments table
      db.insert('lead_assignments', {
        agency_id: effectiveAgencyId,
        lead_id: id,
        assigned_by: req.user.id,
        assigned_by_name: req.user.name,
        staff_id: staff_id || null,
        staff_name: staffName,
        previous_staff_id: prevStaff || null,
        previous_staff_name: prevStaffName || 'Unassigned',
        notes: notes || '',
        assigned_at: new Date().toISOString()
      });

      // 2. Record status history
      if (prevStatus !== updated.status) {
        db.recordLeadStatusHistory(effectiveAgencyId, id, prevStatus, updated.status, req.user.id, `Lead assigned to ${staffName}. ${notes || ''}`);
      }

      // 3. Record in lead_activities
      db.recordActivity(id, req.user.id, 'assignment', `Assigned to ${staffName} by Admin/Manager. ${notes || ''}`);

      // 4. Record audit log
      db.recordAuditLog(effectiveAgencyId, req.user.id, 'ASSIGN_LEAD', 'lead', id, {
        staff_id,
        staff_name: staffName,
        previous_staff_id: prevStaff,
        notes
      });

      updatedLeads.push(updated);
    }
  }

  // Notify assigned staff
  if (staff_id) {
    db.createNotification(
      agencyId || 'agency_travel_genie',
      staff_id,
      'Leads Assigned',
      `You have been assigned ${updatedLeads.length} lead(s) by Operations Manager.`,
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
app.delete('/api/admin/leads/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const lead = db.findById('leads', req.params.id);
  if (lead) {
    db.delete('leads', req.params.id);
  }
  res.json({ success: true, message: 'Lead deleted successfully.' });
});

// Admin Flush Test Leads (Clean reset of lead database)
app.post('/api/admin/leads/flush', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  // Keep empty or only flush agency leads
  const remainingLeads = db.findAll('leads', (l) => l.agency_id && l.agency_id !== agencyId && l.agency_id !== 'agency_travel_genie');
  db.data.leads = remainingLeads;
  db.save();
  res.json({ success: true, message: 'All fake and test leads have been completely flushed.' });
});

// Admin Staff Management (CRUD)
app.get('/api/admin/staff', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const staffUsers = db.findAll('users', (u) => (u.agency_id === agencyId || !u.agency_id) && (u.role === 'staff' || u.role === 'sales'));

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
app.post('/api/admin/staff', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.put('/api/admin/staff/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/admin/agents', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const agentUsers = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'agent');

  const enrichedAgents = agentUsers.map((agent) => {
    const b2b = db.findOne('b2b_agents', (b) => b.user_id === agent.id || (b.email && agent.email && b.email.toLowerCase() === agent.email.toLowerCase())) || {};
    const profile = db.findOne('agent_profiles', (ap) => ap.user_id === agent.id) || {};
    const purchases = db.findAll('agent_purchases', (ap) => ap.agent_id === agent.id);
    const totalPurchasedAmount = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);
    const activeInvitation = db.findOne('agent_account_invitations', (inv) => (inv.user_id === agent.id || (inv.email && agent.email && inv.email.toLowerCase() === agent.email.toLowerCase())) && !inv.is_used);

    let invitationStatus = b2b.invitation_status || (agent.status === 'active' ? 'ACTIVATED' : 'NOT_SENT');
    if (activeInvitation && new Date(activeInvitation.expires_at) < new Date()) {
      invitationStatus = 'INVITATION_EXPIRED';
    } else if (agent.status === 'active') {
      invitationStatus = 'ACTIVATED';
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const activeInvitationLink = activeInvitation && new Date(activeInvitation.expires_at) > new Date()
      ? `${baseUrl}/activate-account?token=${encodeURIComponent(activeInvitation.token)}&type=b2b`
      : null;

    const { password_hash, ...safeAgent } = agent;
    const resolvedAgentId = b2b.agent_id || profile.agent_id || `B2B-${agent.id.slice(-4)}`;

    return {
      ...safeAgent,
      agent_id: resolvedAgentId,
      company_name: b2b.company_name || profile.company_name || agent.name,
      business_address: b2b.business_address || '',
      gst_number: b2b.gst_number || '',
      business_reg_number: b2b.business_reg_number || '',
      contact_person: b2b.contact_person || agent.name,
      account_type: b2b.account_type || 'WHOLESALE',
      account_status: agent.status.toUpperCase(),
      invitation_status: invitationStatus,
      active_invitation_link: activeInvitationLink,
      invitation_sent_at: b2b.invitation_sent_at || activeInvitation?.created_at || null,
      activated_at: b2b.activated_at || null,
      last_login_at: b2b.last_login_at || agent.last_login_at || null,
      profile: {
        ...profile,
        agent_id: resolvedAgentId,
        company_name: b2b.company_name || profile.company_name,
        wholesale_discount_pct: b2b.wholesale_discount_pct !== undefined ? b2b.wholesale_discount_pct : (profile.wholesale_discount_pct || 12),
        credit_limit: b2b.credit_limit !== undefined ? b2b.credit_limit : (profile.credit_limit || 500000)
      },
      purchasesCount: purchases.length,
      totalPurchasedAmount
    };
  });

  res.json(enrichedAgents);
});

// Admin Create B2B Agent Account with Unique Agent ID & Automatic Email Invitation
app.post('/api/admin/agents', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const agencyId = req.user.agency_id;
  const {
    name,
    company_name,
    email,
    phone,
    business_address,
    gst_number,
    business_reg_number,
    contact_person,
    account_type,
    wholesale_discount_pct,
    credit_limit,
    password
  } = req.body;

  if (!name || !company_name || !email || !phone) {
    return res.status(400).json({ error: 'Agent name, company name, email, and mobile number are required.' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const existingUser = db.findOne('users', (u) => u.email.toLowerCase() === trimmedEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  // 1. Generate Unique Agent ID (Format: B2B-YYYY-XXXX)
  const agentId = db.generateUniqueCode('b2b_agents', 'B2B');

  // 2. Insert User Record (pending activation unless password explicitly supplied)
  const isDirectPassword = !!password;
  const newUser = db.insert('users', {
    agency_id: agencyId,
    role: 'agent',
    name,
    email: trimmedEmail,
    phone: phone || '',
    password_hash: isDirectPassword ? bcrypt.hashSync(password, 10) : '',
    status: isDirectPassword ? 'active' : 'pending',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    created_at: new Date().toISOString()
  });

  // 3. Insert B2B Agent Record
  const newB2BAgent = db.insert('b2b_agents', {
    agent_id: agentId,
    user_id: newUser.id,
    agency_id: agencyId,
    agent_name: name,
    company_name,
    email: trimmedEmail,
    phone,
    business_address: business_address || '',
    gst_number: gst_number || '',
    business_reg_number: business_reg_number || '',
    contact_person: contact_person || name,
    account_type: account_type || 'WHOLESALE',
    account_status: isDirectPassword ? 'ACTIVE' : 'INVITATION_PENDING',
    invitation_status: 'INVITATION_SENT',
    wholesale_discount_pct: Number(wholesale_discount_pct) || 12,
    credit_limit: Number(credit_limit) || 500000,
    invitation_sent_at: new Date().toISOString(),
    activated_at: isDirectPassword ? new Date().toISOString() : null,
    last_login_at: null,
    created_at: new Date().toISOString()
  });

  // Maintain agent_profiles for backward compatibility with marketplace/orders
  db.insert('agent_profiles', {
    user_id: newUser.id,
    agency_id: agencyId,
    company_name,
    agent_id: agentId,
    wholesale_discount_pct: Number(wholesale_discount_pct) || 12,
    credit_limit: Number(credit_limit) || 500000,
    total_purchases: 0,
    total_sales: 0,
    total_margin: 0,
    status: isDirectPassword ? 'approved' : 'pending',
    created_at: new Date().toISOString()
  });

  // 4. Generate Single-Use Cryptographic Invitation Token (48h expiry)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  db.insert('agent_account_invitations', {
    agent_id: agentId,
    b2b_agent_id: newB2BAgent.id,
    user_id: newUser.id,
    email: trimmedEmail,
    token: rawToken,
    token_hash: tokenHash,
    expires_at: expiresAt,
    is_used: false,
    used_at: null,
    created_by: req.user.id,
    created_at: new Date().toISOString()
  });

  // 5. Record Invitation Audit History
  db.recordAgentInvitationHistory(agentId, 'INVITATION_CREATED', req.user.id, {
    agent_name: name,
    company_name,
    email: trimmedEmail,
    account_type: account_type || 'WHOLESALE'
  });

  // 6. Send Automatic Agent Invitation Email
  let emailResult = { success: false };
  try {
    emailResult = await emailService.sendAgentInvitationEmail({
      agency_id: agencyId,
      to: trimmedEmail,
      name,
      company_name,
      agent_id: agentId,
      activation_token: rawToken
    });
  } catch (err) {
    console.error('Failed to send agent invitation email:', err);
    db.update('b2b_agents', newB2BAgent.id, { invitation_status: 'INVITATION_FAILED' });
  }

  const { password_hash, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    message: 'B2B Agent account created and invitation email sent successfully.',
    agent_id: agentId,
    agent: {
      ...safeUser,
      ...newB2BAgent,
      profile: {
        agent_id: agentId,
        company_name,
        wholesale_discount_pct: Number(wholesale_discount_pct) || 12,
        credit_limit: Number(credit_limit) || 500000
      }
    },
    invitation: {
      invitation_status: emailResult.success ? 'INVITATION_SENT' : 'INVITATION_FAILED',
      expires_at: expiresAt,
      activation_link: emailResult.activation_link || null
    }
  });
});

// Admin Resend Agent Invitation
app.post('/api/admin/agents/:id/resend-invitation', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;
  const agencyId = req.user.agency_id;

  let agentUser = db.findById('users', id);
  let b2bAgent = db.findOne('b2b_agents', (b) => b.id === id || b.user_id === id || b.agent_id === id);

  if (!agentUser && b2bAgent) {
    agentUser = db.findById('users', b2bAgent.user_id);
  }
  if (!b2bAgent && agentUser) {
    b2bAgent = db.findOne('b2b_agents', (b) => b.user_id === agentUser.id || (b.email && agentUser.email && b.email.toLowerCase() === agentUser.email.toLowerCase()));
  }

  if (!agentUser && !b2bAgent) {
    return res.status(404).json({ error: 'Agent not found.' });
  }

  const agentEmail = (b2bAgent?.email || agentUser?.email).toLowerCase();
  const agentName = b2bAgent?.agent_name || agentUser?.name;
  const agentId = b2bAgent?.agent_id || `B2B-${agentUser.id.slice(-4)}`;
  const companyName = b2bAgent?.company_name || 'B2B Travel Partner';

  // Invalidate any previous unused invitation tokens
  const previousInvitations = db.findAll('agent_account_invitations', (inv) => inv.email.toLowerCase() === agentEmail && !inv.is_used);
  for (const prev of previousInvitations) {
    db.update('agent_account_invitations', prev.id, { is_used: true, used_at: new Date().toISOString() });
  }

  // Generate fresh cryptographic single-use token (48h expiry)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  db.insert('agent_account_invitations', {
    agent_id: agentId,
    b2b_agent_id: b2bAgent?.id || null,
    user_id: agentUser?.id || null,
    email: agentEmail,
    token: rawToken,
    token_hash: tokenHash,
    expires_at: expiresAt,
    is_used: false,
    used_at: null,
    created_by: req.user.id,
    created_at: new Date().toISOString()
  });

  // Record audit history
  db.recordAgentInvitationHistory(agentId, 'INVITATION_RESENT', req.user.id, {
    resent_at: new Date().toISOString()
  });

  // Update b2b_agents status
  if (b2bAgent) {
    db.update('b2b_agents', b2bAgent.id, {
      invitation_status: 'INVITATION_SENT',
      invitation_sent_at: new Date().toISOString()
    });
  }

  // Send invitation email
  const emailResult = await emailService.sendAgentInvitationEmail({
    agency_id: agencyId,
    to: agentEmail,
    name: agentName,
    company_name: companyName,
    agent_id: agentId,
    activation_token: rawToken
  });

  res.json({
    success: true,
    message: 'New invitation link has been generated and dispatched to the agent.',
    agent_id: agentId,
    invitation_status: 'INVITATION_SENT',
    expires_at: expiresAt,
    activation_link: emailResult.activation_link
  });
});

// Admin Update Agent Status (Active, Suspended, Inactive)
app.put('/api/admin/agents/:id/status', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!status || !['active', 'suspended', 'inactive', 'pending'].includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Valid status is required (active, suspended, inactive, pending).' });
  }

  const targetStatus = status.toLowerCase();
  let user = db.findById('users', id);
  let b2b = db.findOne('b2b_agents', (b) => b.id === id || b.user_id === id || b.agent_id === id);

  if (!user && b2b) user = db.findById('users', b2b.user_id);
  if (!b2b && user) b2b = db.findOne('b2b_agents', (b) => b.user_id === user.id);

  if (!user) {
    return res.status(404).json({ error: 'Agent not found.' });
  }

  const oldStatus = user.status;
  db.update('users', user.id, { status: targetStatus });
  if (b2b) {
    db.update('b2b_agents', b2b.id, {
      account_status: targetStatus.toUpperCase()
    });
    db.recordAgentStatusHistory(b2b.agent_id, oldStatus, targetStatus, req.user.id, reason || 'Status updated by Manager.');
  }

  res.json({
    success: true,
    message: `Agent account status updated to ${targetStatus}.`,
    status: targetStatus
  });
});

// Admin Reset Agent Access Credentials
app.post('/api/admin/agents/:id/reset-access', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;
  const agencyId = req.user.agency_id;

  let agentUser = db.findById('users', id);
  let b2bAgent = db.findOne('b2b_agents', (b) => b.id === id || b.user_id === id || b.agent_id === id);
  if (!agentUser && b2bAgent) agentUser = db.findById('users', b2bAgent.user_id);
  if (!b2bAgent && agentUser) b2bAgent = db.findOne('b2b_agents', (b) => b.user_id === agentUser.id);

  if (!agentUser) {
    return res.status(404).json({ error: 'Agent not found.' });
  }

  // Clear password hash and set pending
  db.update('users', agentUser.id, { password_hash: '', status: 'pending' });
  if (b2bAgent) {
    db.update('b2b_agents', b2bAgent.id, { account_status: 'ACTIVATION_PENDING', invitation_status: 'INVITATION_SENT' });
  }

  // Issue new token and send email
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  db.insert('agent_account_invitations', {
    agent_id: b2bAgent?.agent_id || `B2B-${agentUser.id.slice(-4)}`,
    b2b_agent_id: b2bAgent?.id || null,
    user_id: agentUser.id,
    email: agentUser.email.toLowerCase(),
    token: rawToken,
    token_hash: tokenHash,
    expires_at: expiresAt,
    is_used: false,
    used_at: null,
    created_by: req.user.id,
    created_at: new Date().toISOString()
  });

  const emailResult = await emailService.sendAgentInvitationEmail({
    agency_id: agencyId,
    to: agentUser.email,
    name: agentUser.name,
    company_name: b2bAgent?.company_name || 'B2B Partner',
    agent_id: b2bAgent?.agent_id || `B2B-${agentUser.id.slice(-4)}`,
    activation_token: rawToken
  });

  res.json({
    success: true,
    message: 'Agent credentials have been reset. A new activation email has been dispatched.',
    activation_link: emailResult.activation_link
  });
});

// Admin Update Agent (Pricing rules, wholesale tiers)
app.put('/api/admin/agents/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agent = db.findById('users', req.params.id) || db.findOne('users', (u) => u.id === req.params.id);
  let b2b = db.findOne('b2b_agents', (b) => b.id === req.params.id || b.user_id === req.params.id || b.agent_id === req.params.id);
  if (!agent && b2b) agent = db.findById('users', b2b.user_id);

  if (!agent || agent.agency_id !== req.user.agency_id || agent.role !== 'agent') {
    return res.status(404).json({ error: 'Agent not found.' });
  }

  const { status, name, phone, company_name, wholesale_discount_pct, credit_limit, business_address, gst_number } = req.body;
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

  if (b2b) {
    b2b = db.update('b2b_agents', b2b.id, {
      company_name: company_name || b2b.company_name,
      agent_name: name || b2b.agent_name,
      phone: phone || b2b.phone,
      business_address: business_address !== undefined ? business_address : b2b.business_address,
      gst_number: gst_number !== undefined ? gst_number : b2b.gst_number,
      wholesale_discount_pct: wholesale_discount_pct !== undefined ? Number(wholesale_discount_pct) : b2b.wholesale_discount_pct,
      credit_limit: credit_limit !== undefined ? Number(credit_limit) : b2b.credit_limit,
      account_status: status ? status.toUpperCase() : b2b.account_status
    });
  }

  const updatedAgent = db.findById('users', agent.id);
  const { password_hash, ...safeAgent } = updatedAgent;
  res.json({ ...safeAgent, profile, b2b });
});

// Admin Customer Account Management (Section 11: Customer Account Monitoring & Lifecycle)
app.get('/api/admin/customers', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const customers = db.findAll('users', (u) => u.agency_id === agencyId && u.role === 'customer');
  const allBookings = db.findAll('bookings', (b) => b.agency_id === agencyId);
  const allInvitations = db.findAll('customer_account_invitations', (i) => true);

  const customerMap = new Map();

  // 1. Map existing customer user accounts
  customers.forEach((c) => {
    const profile = db.findOne('customer_profiles', (cp) => cp.user_id === c.id) || {};
    const bookings = allBookings.filter((b) => b.customer_id === c.id || (c.email && b.customer_email && b.customer_email.toLowerCase() === c.email.toLowerCase()));
    const latestBooking = bookings[bookings.length - 1] || null;
    const latestInvitation = allInvitations.filter((i) => i.email.toLowerCase() === c.email.toLowerCase()).slice(-1)[0] || null;
    const enquiries = db.findAll('leads', (l) => l.customer_id === c.id || (c.email && l.customer_email && l.customer_email.toLowerCase() === c.email.toLowerCase()));
    const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const { password_hash, ...safeCustomer } = c;

    let computedStatus = 'ACTIVE';
    if (c.status === 'inactive' || c.account_status === 'SUSPENDED') {
      computedStatus = 'SUSPENDED';
    } else if (c.status === 'pending_activation' || !password_hash) {
      computedStatus = latestInvitation ? 'INVITATION_SENT' : 'INVITATION_PENDING';
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const activeCustInv = allInvitations.filter((i) => i.email.toLowerCase() === c.email.toLowerCase() && !i.is_used && new Date(i.expires_at) > new Date()).slice(-1)[0] || null;
    const activeCustomerInvitationLink = activeCustInv
      ? `${baseUrl}/activate-account?token=${encodeURIComponent(activeCustInv.token)}&type=customer`
      : null;

    customerMap.set(c.email.toLowerCase(), {
      ...safeCustomer,
      customer_id: c.customer_code || c.id,
      customer_code: c.customer_code || c.id,
      profile,
      bookingsCount: bookings.length,
      enquiriesCount: enquiries.length,
      totalSpent,
      booking_id: latestBooking?.booking_number || latestBooking?.id || '—',
      raw_booking_id: latestBooking?.id || null,
      advance_payment_status: latestBooking?.payment_status || '—',
      account_status: computedStatus,
      activation_status: password_hash ? 'ACTIVATED' : (latestInvitation ? 'INVITATION_SENT' : 'NOT_ACTIVATED'),
      active_invitation_link: activeCustomerInvitationLink,
      invitation_sent_date: latestInvitation?.created_at || c.created_at || '—',
      last_login: c.last_login_at || (password_hash ? 'Active Session' : 'Never'),
      can_create_login: false // Already has account created
    });
  });

  // 2. Also map verified bookings where account has not been created yet (status: NOT_CREATED)
  allBookings.forEach((b) => {
    const bEmail = (b.customer_email || '').toLowerCase().trim();
    if (bEmail && !customerMap.has(bEmail)) {
      const isConfirmed = b.booking_status === 'BOOKING_CONFIRMED' || b.booking_status === 'Confirmed';
      const hasAdvance = (Number(b.advance_amount) || 0) > 0 || b.payment_status === 'PARTIALLY_PAID' || b.payment_status === 'PAID';

      customerMap.set(bEmail, {
        id: `unreg_${b.id}`,
        customer_id: b.customer_code || 'Pending Account Creation',
        customer_code: b.customer_code || 'Pending Account Creation',
        name: b.customer_name,
        email: b.customer_email,
        phone: b.customer_phone || '',
        status: 'pending',
        account_status: 'NOT_CREATED',
        activation_status: 'NOT_CREATED',
        booking_id: b.booking_number || b.id,
        raw_booking_id: b.id,
        advance_payment_status: b.payment_status || 'PENDING',
        bookingsCount: 1,
        enquiriesCount: 1,
        totalSpent: b.total_amount || 0,
        invitation_sent_date: '—',
        last_login: 'Never',
        can_create_login: isConfirmed && hasAdvance,
        created_at: b.created_at
      });
    }
  });

  res.json(Array.from(customerMap.values()));
});

// Admin Package Management (Full CRUD + Itineraries)
app.get('/api/admin/packages', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const packages = db.findAll('packages', (p) => p.agency_id === agencyId);
  res.json(packages);
});

app.post('/api/admin/packages', authenticate, authorize(['admin', 'manager']), (req, res) => {
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

app.get('/api/admin/packages/:id/itineraries', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const itins = db.findAll('package_itineraries', (it) => it.package_id === req.params.id);
  const dayMap = new Map();
  for (const it of itins) {
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
  const sorted = Array.from(dayMap.values()).sort((a, b) => a.day_number - b.day_number);
  res.json(sorted);
});

app.put('/api/admin/packages/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const pkg = db.findById('packages', req.params.id);
  if (!pkg) {
    const cleanId = (req.params.id || '').toLowerCase().trim();
    const dest = db.findOne('destinations', (d) => {
      if (!d) return false;
      const dSlug = (d.slug || '').toLowerCase().trim();
      const dId = (d.id || '').toLowerCase().trim();
      return dSlug === cleanId || dId === cleanId || dId === `dest_${cleanId.replace(/-/g, '_')}`;
    });
    if (dest) {
      return res.json({ is_destination: true, destination_slug: dest.slug || cleanId });
    }
    return res.status(404).json({ error: 'Package not found.' });
  }

  const { itineraries, ...packageUpdates } = req.body;
  const updated = db.update('packages', pkg.id, packageUpdates);

  if (Array.isArray(itineraries)) {
    // Delete existing itineraries for this package
    const currentItins = db.getTable('package_itineraries');
    db.data['package_itineraries'] = currentItins.filter((it) => it.package_id !== pkg.id);

    // Insert updated itineraries
    for (let i = 0; i < itineraries.length; i++) {
      const it = itineraries[i];
      const dayNum = Number(it.day_number) || (i + 1);
      db.insert('package_itineraries', {
        package_id: pkg.id,
        day_number: dayNum,
        title: it.title || `Day ${dayNum}`,
        description: it.description || '',
        meals: it.meals || 'Breakfast Included',
        activities: it.activities || 'Sightseeing & Transfers'
      });
    }
    db.persist();
  }

  res.json(updated);
});

app.delete('/api/admin/packages/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const pkg = db.findById('packages', req.params.id);
  if (!pkg || pkg.agency_id !== req.user.agency_id) {
    return res.status(404).json({ error: 'Package not found.' });
  }

  db.delete('packages', req.params.id);
  res.json({ success: true, message: 'Package deleted successfully.' });
});

// Admin Destination Management (CRUD)
app.get('/api/admin/destinations', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const destinations = db.findAll('destinations', (d) => d.agency_id === agencyId);
  const allPackages = db.findAll('packages', (p) => p.is_published !== false);
  const accurateDestinations = destinations.map((d) => ({
    ...d,
    package_count: allPackages.filter((p) => matchPackageToDestination(p, d)).length
  }));
  res.json(accurateDestinations);
});

app.post('/api/admin/destinations', authenticate, authorize(['admin', 'manager']), (req, res) => {
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

app.put('/api/admin/destinations/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const dest = db.findById('destinations', req.params.id) || db.findOne('destinations', (d) => String(d.id) === String(req.params.id));
  if (!dest) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  const updated = db.update('destinations', dest.id, {
    ...req.body,
    agency_id: dest.agency_id || req.user.agency_id || 'agency_travel_genie'
  });
  res.json(updated);
});

app.delete('/api/admin/destinations/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const dest = db.findById('destinations', req.params.id) || db.findOne('destinations', (d) => String(d.id) === String(req.params.id));
  if (!dest) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  db.delete('destinations', dest.id);
  res.json({ success: true, message: 'Destination deleted.' });
});

// Admin Hero Banner Management
app.get('/api/admin/banners', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const banners = db.findAll('hero_banners', (b) => !b.agency_id || b.agency_id === agencyId || req.user.role === 'admin');
  banners.sort((a, b) => a.display_order - b.display_order);
  res.json(banners);
});

app.post('/api/admin/banners', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id || 'agency_travel_genie';
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

app.put('/api/admin/banners/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  let banner = db.findById('hero_banners', req.params.id) || db.findOne('hero_banners', (b) => String(b.id) === String(req.params.id));
  if (!banner) {
    return res.status(404).json({ error: 'Banner not found.' });
  }

  const { title, subtitle, image_desktop, image_mobile, video_url, cta_text, cta_link, display_order, is_active } = req.body;
  const updated = db.update('hero_banners', banner.id, {
    title: title !== undefined ? title : banner.title,
    subtitle: subtitle !== undefined ? subtitle : banner.subtitle,
    image_desktop: image_desktop !== undefined ? image_desktop : banner.image_desktop,
    image_mobile: image_mobile !== undefined ? image_mobile : banner.image_mobile,
    video_url: video_url !== undefined ? video_url : banner.video_url,
    cta_text: cta_text !== undefined ? cta_text : banner.cta_text,
    cta_link: cta_link !== undefined ? cta_link : banner.cta_link,
    display_order: display_order !== undefined ? Number(display_order) : banner.display_order,
    is_active: is_active !== undefined ? !!is_active : banner.is_active,
    agency_id: banner.agency_id || req.user.agency_id || 'agency_travel_genie'
  });
  res.json(updated);
});

app.delete('/api/admin/banners/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  let banner = db.findById('hero_banners', req.params.id) || db.findOne('hero_banners', (b) => String(b.id) === String(req.params.id));
  if (!banner) {
    return res.status(404).json({ error: 'Banner not found.' });
  }

  db.delete('hero_banners', banner.id);
  res.json({ success: true, message: 'Banner deleted.' });
});

// Admin Bookings & Booking Status Workflow
app.get('/api/admin/bookings', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const bookings = db.findAll('bookings', (b) => !b.agency_id || b.agency_id === agencyId || b.agency_id === 'agency_travel_genie');
  bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(bookings);
});

// Admin Flush Bookings & Execution Records (Clean reset)
app.post('/api/admin/bookings/flush', authenticate, authorize(['admin', 'manager']), (req, res) => {
  db.data.bookings = [];
  db.data.payments = [];
  db.data.invoices = [];
  db.data.operations_arrangements = [];
  db.data.operations_tasks = [];
  db.data.booking_status_history = [];
  db.data.customer_account_invitations = [];
  db.save();
  res.json({ success: true, message: 'All booking and execution test data has been completely flushed.' });
});

app.put('/api/admin/bookings/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/admin/payments', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const payments = db.findAll('payments', (p) => p.agency_id === agencyId);
  payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  res.json(payments);
});

app.post('/api/admin/payments', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/admin/reports', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/admin/reports/export-csv', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/admin/settings', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agency = db.findById('agencies', req.user.agency_id);
  const settings = db.findOne('agency_settings', (s) => s.agency_id === req.user.agency_id);
  res.json({ agency, settings });
});

app.put('/api/admin/settings', authenticate, authorize(['admin', 'manager']), (req, res) => {
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
app.get('/api/staff/dashboard', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  const assignedLeads = isManagerOrAdmin
    ? db.findAll('leads', (l) => !l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie')
    : db.findAll('leads', (l) => (!l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie') && l.assigned_staff_id === staffId);
  const newLeads = assignedLeads.filter((l) => l.status === 'Assigned' || l.status === 'New');
  const quotationsSent = assignedLeads.filter((l) => l.status === 'Quotation Sent');
  const convertedLeads = assignedLeads.filter((l) => l.status === 'Converted');
  const followUpsDueToday = assignedLeads.filter((l) => {
    if (!l.follow_up_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return l.follow_up_date.startsWith(today);
  });

  const quotations = isManagerOrAdmin ? db.findAll('quotations') : db.findAll('quotations', (q) => q.staff_id === staffId);

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

// Staff Assigned Leads (Strict isolation: only leads assigned to this staff, or all for admin/manager)
app.get('/api/staff/leads', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const { status, search } = req.query;
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  let leads = isManagerOrAdmin
    ? db.findAll('leads', (l) => !l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie')
    : db.findAll('leads', (l) => (!l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie') && l.assigned_staff_id === staffId);

  if (status && status !== 'all') {
    leads = leads.filter((l) => l.status === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    leads = leads.filter((l) =>
      (l.customer_name && l.customer_name.toLowerCase().includes(q)) ||
      (l.interested_destination && l.interested_destination.toLowerCase().includes(q)) ||
      (l.customer_phone && l.customer_phone.includes(q)) ||
      (l.customer_email && l.customer_email.toLowerCase().includes(q))
    );
  }

  leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(leads);
});

// Staff Lead Detail & Timeline
app.get('/api/staff/leads/:id', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead || (!isManagerOrAdmin && lead.assigned_staff_id !== staffId)) {
    return res.status(403).json({ error: 'Access denied. You can only view leads assigned to you.' });
  }

  const activities = db.findAll('lead_activities', (a) => a.lead_id === lead.id);
  activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const quotations = db.findAll('quotations', (q) => q.lead_id === lead.id);
  const pkg = lead.interested_package_id ? db.findById('packages', lead.interested_package_id) : null;

  res.json({ lead, activities, quotations, package: pkg });
});

// Staff Update Lead Status, Notes & Follow-up
app.put('/api/staff/leads/:id/status', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead || (!isManagerOrAdmin && lead.assigned_staff_id !== staffId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { status, notes, follow_up_date, lost_reason } = req.body;
  const oldStatus = lead.status;

  const updatePayload = {
    status: status || lead.status,
    notes: notes !== undefined ? notes : lead.notes,
    follow_up_date: follow_up_date !== undefined ? follow_up_date : lead.follow_up_date
  };

  if (lost_reason) {
    updatePayload.lost_reason = lost_reason;
    updatePayload.notes = `${lead.notes || ''} | Reason Lost: ${lost_reason}`.trim();
  }

  const updated = db.update('leads', lead.id, updatePayload);

  if (status && status !== oldStatus) {
    db.recordActivity(lead.id, staffId, 'status_change', `Staff ${req.user.name} changed status to '${status}'. ${notes ? `Note: ${notes}` : ''} ${lost_reason ? `Reason: ${lost_reason}` : ''}`);
    db.recordLeadStatusHistory(req.user.agency_id, lead.id, oldStatus, status, staffId, notes || lost_reason || '');
  } else if (notes) {
    db.recordActivity(lead.id, staffId, 'note', `Staff ${req.user.name} added note: ${notes}`);
  }

  res.json(updated);
});

// Staff Log Customer Interaction (Call notes, preferences, WhatsApp, Meetings)
app.post('/api/staff/leads/:id/interactions', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead || (!isManagerOrAdmin && lead.assigned_staff_id !== staffId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { channel = 'CALL', summary, customer_response, follow_up_date, preferences } = req.body;
  if (!summary) {
    return res.status(400).json({ error: 'Interaction summary is required.' });
  }

  const interaction = db.insert('customer_interactions', {
    agency_id: agencyId,
    lead_id: lead.id,
    staff_id: staffId,
    staff_name: req.user.name,
    channel,
    summary,
    customer_response: customer_response || '',
    preferences: preferences || null,
    created_at: new Date().toISOString()
  });

  db.recordActivity(lead.id, staffId, 'interaction', `[${channel}] ${summary} ${customer_response ? `| Customer Response: ${customer_response}` : ''}`);

  if (follow_up_date) {
    db.update('leads', lead.id, { follow_up_date });
    db.insert('follow_ups', {
      agency_id: agencyId,
      lead_id: lead.id,
      staff_id: staffId,
      scheduled_date: follow_up_date,
      notes: summary,
      status: 'SCHEDULED',
      created_at: new Date().toISOString()
    });
  }

  res.status(201).json(interaction);
});

// Staff Create & Dispatch Quotation (With Itinerary, GST, Advance % and Version History)
app.post('/api/staff/quotations', authenticate, authorize(['staff', 'admin', 'manager']), async (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const {
    lead_id,
    package_id,
    items,
    package_amount,
    additional_charges,
    discount,
    taxes,
    total_amount,
    advance_percentage,
    required_advance_amount,
    terms_and_conditions,
    notes,
    valid_until
  } = req.body;

  const lead = db.findById('leads', lead_id);
  if (!lead || lead.assigned_staff_id !== staffId) {
    return res.status(403).json({ error: 'Access denied. Cannot quote for this lead.' });
  }

  // Calculate pricing breakdown
  const pkgAmt = Number(package_amount) || Number(total_amount) || 0;
  const addCharges = Number(additional_charges) || 0;
  const disc = Number(discount) || 0;
  const subtotal = Math.max(0, pkgAmt + addCharges - disc);
  const taxAmt = taxes !== undefined ? Number(taxes) : Math.round(subtotal * 0.05); // Standard 5% GST
  const finalAmt = subtotal + taxAmt;

  // Advance calculation (percentage or fixed)
  const advPct = Number(advance_percentage) || 30; // Default 30% advance
  const reqAdvance = required_advance_amount ? Number(required_advance_amount) : Math.round((finalAmt * advPct) / 100);
  const balPayment = Math.max(0, finalAmt - reqAdvance);

  // Maintain quotation version history
  const existingQuotes = db.findAll('quotations', (q) => q.lead_id === lead_id);
  const version = existingQuotes.length + 1;
  const quoteNum = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-V${version}`;

  // Pull package details if package_id provided
  const pkg = (package_id || lead.interested_package_id) ? db.findById('packages', package_id || lead.interested_package_id) : null;
  const itinerary = pkg?.itinerary || items || [];

  const newQuote = db.insert('quotations', {
    agency_id: agencyId,
    lead_id,
    package_id: package_id || lead.interested_package_id,
    package_title: pkg ? pkg.title : lead.interested_destination,
    staff_id: staffId,
    staff_name: req.user.name,
    quotation_number: quoteNum,
    version,
    customer_name: lead.customer_name,
    customer_email: lead.customer_email,
    customer_phone: lead.customer_phone,
    package_amount: pkgAmt,
    additional_charges: addCharges,
    discount: disc,
    taxes: taxAmt,
    subtotal,
    total_amount: pkgAmt + addCharges,
    final_amount: finalAmt,
    required_advance_amount: reqAdvance,
    advance_percentage: advPct,
    balance_amount: balPayment,
    terms_and_conditions: terms_and_conditions || 'Standard cancellation policy applies. 30% non-refundable advance required to confirm.',
    valid_until: valid_until || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    items: items || [],
    itinerary,
    notes: notes || 'Custom holiday quotation prepared and verified by sales executive.',
    status: 'Sent',
    created_at: new Date().toISOString()
  });

  // Record quotation items
  if (Array.isArray(items) && items.length > 0) {
    for (const itm of items) {
      db.insert('quotation_items', {
        agency_id: agencyId,
        quotation_id: newQuote.id,
        description: itm.description || itm.title,
        amount: Number(itm.amount) || 0
      });
    }
  }

  // Update lead status to 'Quotation Sent'
  db.update('leads', lead.id, {
    status: 'Quotation Sent',
    latest_quotation_id: newQuote.id,
    latest_quotation_number: quoteNum
  });

  db.recordLeadStatusHistory(agencyId, lead.id, lead.status, 'Quotation Sent', staffId, `Quotation #${quoteNum} dispatched.`);
  db.recordActivity(lead.id, staffId, 'quotation', `Dispatched Quotation #${quoteNum} (v${version}) for ₹${finalAmt.toLocaleString('en-IN')}. Required Advance: ₹${reqAdvance.toLocaleString('en-IN')}`);

  // Dispatched email notification to customer
  if (lead.customer_email) {
    try {
      await emailService.sendQuotationEmail({
        agency_id: agencyId,
        to: lead.customer_email,
        name: lead.customer_name,
        quote_number: quoteNum,
        destination: pkg ? pkg.title : lead.interested_destination,
        total_amount: finalAmt,
        required_advance: reqAdvance,
        valid_until: newQuote.valid_until
      });
    } catch (mailErr) {
      console.error('Error dispatching quotation email:', mailErr);
    }
  }

  // Notify customer portal if they already have an active profile
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

// Staff Customer Trip Confirmation (Lead Status -> CUSTOMER_CONFIRMED -> PAYMENT_PENDING)
app.post('/api/staff/leads/:id/confirm-trip', authenticate, authorize(['staff', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const lead = db.findById('leads', req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  if (req.user.role === 'staff' && lead.assigned_staff_id !== staffId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const {
    quotation_id,
    agreed_price,
    required_advance_amount,
    advance_percentage,
    travel_start_date,
    travel_end_date,
    travelers_count,
    special_requests
  } = req.body;

  const quotation = quotation_id ? db.findById('quotations', quotation_id) : null;
  const finalPrice = Number(agreed_price) || (quotation ? Number(quotation.final_amount) : Number(lead.budget) || 120000);
  const advPct = Number(advance_percentage) || 30;
  const reqAdvance = required_advance_amount ? Number(required_advance_amount) : Math.round((finalPrice * advPct) / 100);
  const balDue = Math.max(0, finalPrice - reqAdvance);

  const bookingNum = db.generateUniqueCode('bookings', 'BK', true);

  // Create booking in PENDING state awaiting partial payment
  // (Customer account is NOT created yet!)
  const newBooking = db.insert('bookings', {
    agency_id: agencyId,
    booking_number: bookingNum,
    enquiry_id: lead.enquiry_id || lead.id,
    lead_id: lead.id,
    quotation_id: quotation ? quotation.id : null,
    quotation_number: quotation ? quotation.quotation_number : null,
    sales_executive_id: staffId,
    sales_executive_name: req.user.name,
    customer_id: lead.customer_id || null, // Will be linked when manager creates account
    customer_name: lead.customer_name,
    customer_email: lead.customer_email,
    customer_phone: lead.customer_phone,
    package_id: quotation?.package_id || lead.interested_package_id || null,
    package_title: quotation?.package_title || lead.interested_destination,
    travel_start_date: travel_start_date || lead.travel_date || new Date().toISOString().split('T')[0],
    travel_end_date: travel_end_date || '',
    travelers_count: Number(travelers_count) || lead.travelers_count || 2,
    total_amount: finalPrice,
    required_advance_amount: reqAdvance,
    advance_percentage: advPct,
    advance_amount: 0,
    balance_amount: finalPrice,
    payment_status: 'PENDING',
    booking_status: 'PAYMENT_PENDING',
    payment_link: `/pay/${bookingNum}`,
    special_requests: special_requests || lead.notes || '',
    created_at: new Date().toISOString()
  });

  // Update lead status to Customer Confirmed & Payment Pending
  db.update('leads', lead.id, {
    status: 'Customer Confirmed',
    booking_id: newBooking.id,
    booking_number: bookingNum
  });

  db.recordLeadStatusHistory(agencyId, lead.id, lead.status, 'Customer Confirmed', staffId, `Customer confirmed trip. Booking #${bookingNum} created awaiting advance deposit of ₹${reqAdvance.toLocaleString('en-IN')}.`);
  db.recordActivity(lead.id, staffId, 'status_change', `Trip Confirmed! Booking #${bookingNum} registered. Required advance: ₹${reqAdvance.toLocaleString('en-IN')}.`);
  db.recordBookingStatusHistory(agencyId, newBooking.id, 'NONE', 'PAYMENT_PENDING', staffId, 'Initial trip confirmation recorded.');

  // Notify Managers of trip confirmation
  const managers = db.findAll('users', (u) => u.agency_id === agencyId && (u.role === 'manager' || u.role === 'admin'));
  for (const m of managers) {
    db.createNotification(
      agencyId,
      m.id,
      'Trip Confirmed by Customer',
      `${lead.customer_name} confirmed holiday for ${lead.interested_destination}. Booking #${bookingNum} awaiting advance payment of ₹${reqAdvance.toLocaleString('en-IN')}.`,
      'info',
      '/admin/bookings'
    );
  }

  res.status(201).json({
    success: true,
    message: `Trip confirmed successfully! Booking #${bookingNum} registered. Awaiting advance payment of ₹${reqAdvance.toLocaleString('en-IN')}.`,
    booking: newBooking,
    lead_status: 'Customer Confirmed'
  });
});

// Payment Verification Endpoint (Handles partial advance payment, prevents duplicate, updates booking)
app.post('/api/payments/verify-advance', async (req, res) => {
  const {
    booking_id,
    booking_number,
    amount,
    payment_method = 'UPI',
    transaction_reference,
    notes,
    simulate_failure = false
  } = req.body;

  if (!booking_id && !booking_number) {
    return res.status(400).json({ error: 'booking_id or booking_number is required.' });
  }

  const booking = booking_id ? db.findById('bookings', booking_id) : db.findOne('bookings', (b) => b.booking_number === booking_number);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const agencyId = booking.agency_id;
  const payAmount = Number(amount);

  if (!payAmount || payAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  // 1. Guard against simulated or actual gateway failures
  if (simulate_failure) {
    const failedPayment = db.insert('payments', {
      agency_id: agencyId,
      booking_id: booking.id,
      booking_number: booking.booking_number,
      customer_id: booking.customer_id || null,
      amount: payAmount,
      payment_type: 'Advance',
      payment_method,
      transaction_reference: transaction_reference || `FAILED-TXN-${Date.now()}`,
      status: 'FAILED',
      failure_reason: 'Transaction declined by issuer / simulated gateway failure',
      payment_date: new Date().toISOString()
    });

    return res.status(400).json({
      success: false,
      error: 'Payment failed: Transaction was declined by the bank or gateway.',
      payment: failedPayment,
      booking_status: booking.booking_status
    });
  }

  // 2. Prevent Duplicate Payment Processing (Idempotency)
  const txnRef = transaction_reference || `TXN-ADV-${Date.now()}`;
  const existingPayment = db.findOne('payments', (p) => p.transaction_reference === txnRef && p.status === 'SUCCESS');
  if (existingPayment) {
    return res.status(200).json({
      success: true,
      message: 'Payment already verified previously.',
      payment: existingPayment,
      booking
    });
  }

  // 3. Insert Verified Successful Payment
  const newPayment = db.insert('payments', {
    agency_id: agencyId,
    booking_id: booking.id,
    booking_number: booking.booking_number,
    customer_id: booking.customer_id || null,
    amount: payAmount,
    payment_type: payAmount >= booking.total_amount ? 'FULL' : 'Advance',
    payment_method,
    transaction_reference: txnRef,
    gateway: 'Razorpay / UPI Payment Gateway',
    status: 'SUCCESS',
    notes: notes || 'Verified partial advance payment for holiday reservation.',
    payment_date: new Date().toISOString()
  });

  // 4. Update Booking Payment and Trip Status
  const currentAdvance = (Number(booking.advance_amount) || 0) + payAmount;
  const currentBalance = Math.max(0, Number(booking.total_amount) - currentAdvance);
  const paymentStatus = currentBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
  const bookingStatus = 'BOOKING_CONFIRMED'; // Confirmed after verified deposit

  const updatedBooking = db.update('bookings', booking.id, {
    advance_amount: currentAdvance,
    balance_amount: currentBalance,
    payment_status: paymentStatus,
    booking_status: bookingStatus,
    advance_paid_at: new Date().toISOString()
  });

  db.recordBookingStatusHistory(agencyId, booking.id, booking.booking_status, bookingStatus, 'payment_gateway', `Advance payment of ₹${payAmount.toLocaleString('en-IN')} verified. Txn: ${txnRef}.`);

  // 5. Update Corresponding Lead Status to Partially Paid / Converted
  if (booking.lead_id) {
    db.update('leads', booking.lead_id, {
      status: currentBalance === 0 ? 'Converted' : 'Partially Paid'
    });
    db.recordLeadStatusHistory(agencyId, booking.lead_id, 'Customer Confirmed', currentBalance === 0 ? 'Converted' : 'Partially Paid', 'system', `Partial payment verified.`);
    db.recordActivity(booking.lead_id, 'system', 'payment', `Advance payment of ₹${payAmount.toLocaleString('en-IN')} successfully verified via gateway.`);
  }

  // 6. Generate Official Tax Invoice
  const subtotal = Math.round(payAmount / 1.05);
  const tax = payAmount - subtotal;
  const invoiceNum = `TG-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const inv = db.insert('invoices', {
    agency_id: agencyId,
    invoice_number: invoiceNum,
    booking_id: booking.id,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    invoice_date: new Date().toISOString().split('T')[0],
    subtotal,
    cgst: Math.round(tax / 2),
    sgst: Math.round(tax / 2),
    igst: 0,
    total_amount: payAmount,
    payment_status: paymentStatus,
    pdf_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  });

  // 7. Send Payment Confirmation Email
  if (booking.customer_email) {
    try {
      await emailService.sendPaymentReceiptEmail({
        agency_id: agencyId,
        to: booking.customer_email,
        name: booking.customer_name,
        booking_number: booking.booking_number,
        amount_paid: payAmount,
        remaining_balance: currentBalance,
        txn_ref: txnRef
      });
    } catch (e) {
      console.error('Failed to send payment receipt email:', e);
    }
  }

  // 8. Notify Manager: Booking is now eligible for Customer Login Creation!
  const managers = db.findAll('users', (u) => u.agency_id === agencyId && (u.role === 'manager' || u.role === 'admin'));
  for (const m of managers) {
    db.createNotification(
      agencyId,
      m.id,
      'Advance Payment Received - Account Creation Eligible!',
      `Verified advance of ₹${payAmount.toLocaleString('en-IN')} for booking #${booking.booking_number} (${booking.customer_name}). Eligible for "CREATE CUSTOMER LOGIN".`,
      'success',
      '/admin/bookings'
    );
  }

  // Notify Sales Executive
  if (booking.sales_executive_id) {
    db.createNotification(
      agencyId,
      booking.sales_executive_id,
      'Partial Payment Verified!',
      `Customer ${booking.customer_name} paid ₹${payAmount.toLocaleString('en-IN')} for booking #${booking.booking_number}.`,
      'success',
      '/staff/bookings'
    );
  }

  res.status(200).json({
    success: true,
    message: `Payment of ₹${payAmount.toLocaleString('en-IN')} successfully verified! Booking #${booking.booking_number} is confirmed.`,
    payment: newPayment,
    invoice: inv,
    booking: updatedBooking
  });
});

// Staff Convert Lead to Confirmed Booking
app.post('/api/staff/leads/:id/convert', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead || (!isManagerOrAdmin && lead.assigned_staff_id !== staffId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { total_amount, advance_amount, payment_method, payment_proof, travel_start_date, travel_end_date, special_requests } = req.body;
  const tot = Number(total_amount);
  const adv = Number(advance_amount) || 0;
  const bal = Math.max(0, tot - adv);

  const bookingNum = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newBooking = db.insert('bookings', {
    agency_id: agencyId,
    booking_number: bookingNum,
    lead_id: lead.id,
    customer_id: lead.customer_id,
    customer_name: lead.customer_name,
    customer_email: lead.customer_email,
    customer_phone: lead.customer_phone,
    agent_id: null,
    package_id: lead.interested_package_id,
    package_title: lead.interested_destination,
    travel_start_date: travel_start_date || lead.travel_date || new Date().toISOString().split('T')[0],
    travel_end_date: travel_end_date || '',
    travelers_count: lead.travelers_count || 2,
    total_amount: tot,
    advance_amount: adv,
    balance_amount: bal,
    payment_method: payment_method || 'UPI',
    payment_proof: payment_proof || '',
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
      payment_method: payment_method || 'UPI',
      transaction_reference: payment_proof || `CONV-PAY-${Date.now()}`,
      payment_proof: payment_proof || '',
      payment_date: new Date().toISOString(),
      notes: `Advance payment recorded during lead conversion. Proof/Ref: ${payment_proof || 'Verified by Sales'}`,
      status: 'Completed'
    });

    const subtotal = Math.round(adv / 1.05);
    const tax = adv - subtotal;
    db.insert('invoices', {
      agency_id: agencyId,
      invoice_number: `TG-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      booking_id: newBooking.id,
      customer_id: lead.customer_id,
      customer_name: lead.customer_name,
      invoice_date: new Date().toISOString().split('T')[0],
      subtotal,
      cgst: Math.round(tax / 2),
      sgst: Math.round(tax / 2),
      igst: 0,
      total_amount: adv,
      payment_status: bal === 0 ? 'Paid' : 'Partial',
      pdf_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      created_at: new Date().toISOString()
    });
  }

  // Auto-create operational arrangements & checklist tasks
  db.insert('operations_arrangements', {
    agency_id: agencyId,
    booking_id: newBooking.id,
    trip_status: 'Booking Received',
    hotel_name: 'Pending Hotel Allocation',
    room_category: 'Standard / As per quotation',
    meal_plan: 'Breakfast included',
    vehicle_type: 'AC Sedan / SUV as per group size',
    special_instructions: special_requests || lead.notes || '',
    dossier_generated: false,
    updated_at: new Date().toISOString()
  });

  const opsChecklist = [
    { title: 'Verify Passenger Identification & Passport Copies', priority: 'High', due_days: 2 },
    { title: 'Confirm Hotel Accommodations & Room Vouchers', priority: 'High', due_days: 5 },
    { title: 'Arrange Airport & Local Transportation Logistics', priority: 'Medium', due_days: 7 },
    { title: 'Generate Consolidated Travel Itinerary Dossier', priority: 'High', due_days: 10 }
  ];
  const nowMs = Date.now();
  for (const item of opsChecklist) {
    db.insert('operations_tasks', {
      agency_id: agencyId,
      booking_id: newBooking.id,
      task_title: item.title,
      due_date: new Date(nowMs + item.due_days * 86400000).toISOString().split('T')[0],
      status: 'PENDING',
      priority: item.priority,
      assigned_executive: 'usr_operations_karthik',
      created_at: new Date().toISOString()
    });
  }

  // Audit booking status change
  db.insert('booking_status_history', {
    agency_id: agencyId,
    booking_id: newBooking.id,
    from_status: 'QUOTATION_PENDING',
    to_status: 'CONFIRMED',
    changed_by: req.user.id,
    notes: `Lead converted to confirmed booking #${bookingNum} with ₹${adv} advance deposit.`,
    created_at: new Date().toISOString()
  });

  // Update lead status to 'Converted'
  db.update('leads', lead.id, { status: 'Converted' });
  db.recordActivity(lead.id, staffId, 'status_change', `Lead successfully CONVERTED to confirmed Booking #${bookingNum}!`);

  // Notify Admin, Manager, and Operations Executive
  const opsStaff = db.findAll('users', (u) => u.agency_id === agencyId && (u.role === 'admin' || u.role === 'manager' || u.role === 'operations'));
  for (const staffMember of opsStaff) {
    db.createNotification(
      agencyId,
      staffMember.id,
      'New Confirmed Booking for Execution!',
      `Staff ${req.user.name} converted lead #${lead.id} into confirmed booking #${bookingNum} (${lead.interested_destination}). Operational arrangements initialized.`,
      'success',
      staffMember.role === 'operations' ? '/operations/bookings' : '/admin/bookings'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Lead converted successfully!',
    booking: newBooking
  });
});

// Staff Follow-ups Agenda
app.get('/api/staff/follow-ups', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;

  let leads;
  if (req.user.role === 'manager' || req.user.role === 'admin') {
    leads = db.findAll('leads', (l) => l.agency_id === agencyId && l.follow_up_date);
  } else {
    leads = db.findAll('leads', (l) => l.agency_id === agencyId && l.assigned_staff_id === staffId && l.follow_up_date);
  }
  leads.sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));
  res.json(leads);
});

// ==========================================
// 5.5 MANAGER CUSTOMER ACCOUNT CREATION & ACTIVATION
// ==========================================

// Manager Create Customer Login (Strict Eligibility: Verified Email + Confirmed Booking + Verified Advance Payment)
app.post('/api/admin/customers/create-login', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const agencyId = req.user.agency_id;
  const { booking_id, email, temp_password, name } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: 'Booking ID is required to create a customer account.' });
  }

  const booking = db.findById('bookings', booking_id);
  if (!booking || (booking.agency_id && booking.agency_id !== agencyId && booking.agency_id !== 'agency_travel_genie')) {
    return res.status(404).json({ error: 'Booking record not found.' });
  }

  const customerEmail = ((email || booking.customer_email) || '').trim().toLowerCase();
  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid customer email address is required on the booking.' });
  }

  // 1. Mandatory Business Rule: Booking must be confirmed and have verified advance payment
  const isConfirmed = booking.booking_status === 'BOOKING_CONFIRMED' || booking.booking_status === 'Confirmed';
  const hasAdvance = (Number(booking.advance_amount) || 0) > 0 ||
    booking.payment_status === 'PARTIALLY_PAID' ||
    booking.payment_status === 'PAID' ||
    booking.payment_status === 'Partial' ||
    booking.payment_status === 'Paid';

  if (!isConfirmed || !hasAdvance) {
    return res.status(400).json({
      error: 'Ineligible for account creation: Booking must be Confirmed and have a successfully verified advance payment.'
    });
  }

  const finalTempPassword = (temp_password || '').trim() || `Genie@${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = bcrypt.hashSync(finalTempPassword, 10);
  const appUrl = req.headers.origin || 'http://localhost:3000';

  // 2. Check if an active customer account already exists with this email (Reuse existing identity)
  const existingUser = db.findOne('users', (u) => u.email.toLowerCase() === customerEmail);
  if (existingUser) {
    db.update('users', existingUser.id, {
      password_hash: passwordHash,
      temp_password: finalTempPassword,
      status: 'active',
      account_status: 'ACTIVE'
    });

    db.update('bookings', booking.id, {
      customer_id: existingUser.id,
      customer_code: existingUser.customer_code || existingUser.id,
      customer_account_status: 'ACTIVE'
    });

    db.recordAuditLog(agencyId, req.user.id, 'LINK_BOOKING_TO_EXISTING_CUSTOMER', 'booking', booking.id, {
      user_id: existingUser.id,
      email: customerEmail
    });

    const loginUrl = `${appUrl}/login?email=${encodeURIComponent(customerEmail)}`;
    return res.status(200).json({
      success: true,
      already_exists: true,
      message: `Customer account updated with credentials for ${customerEmail}.`,
      customer_id: existingUser.customer_code || existingUser.id,
      email: customerEmail,
      temp_password: finalTempPassword,
      login_url: loginUrl,
      activation_link: loginUrl,
      account_status: 'ACTIVE'
    });
  }

  // 3. Generate Unique Customer ID (e.g. CUS-2026-0001)
  const customerCode = db.generateUniqueCode('users', 'CUS', true);

  // 4. Create user with temporary password and active status
  let userRecord = db.insert('users', {
    agency_id: agencyId,
    role: 'customer',
    customer_code: customerCode,
    name: name || booking.customer_name,
    email: customerEmail,
    phone: booking.customer_phone || '',
    password_hash: passwordHash,
    temp_password: finalTempPassword,
    status: 'active',
    account_status: 'ACTIVE',
    activation_status: 'ACTIVATED',
    created_at: new Date().toISOString()
  });

  // 5. Ensure customer profile exists
  let custProfile = db.findOne('customer_profiles', (cp) => cp.user_id === userRecord.id);
  if (!custProfile) {
    db.insert('customer_profiles', {
      user_id: userRecord.id,
      customer_code: customerCode,
      agency_id: agencyId,
      name: name || booking.customer_name,
      email: customerEmail,
      phone: booking.customer_phone || '',
      preferred_currency: 'INR'
    });
  }

  // 6. Ensure customer directory record exists
  let customerDir = db.findOne('customers', (c) => c.email.toLowerCase() === customerEmail);
  if (!customerDir) {
    db.insert('customers', {
      id: customerCode,
      customer_code: customerCode,
      user_id: userRecord.id,
      agency_id: agencyId,
      name: name || booking.customer_name,
      email: customerEmail,
      phone: booking.customer_phone || '',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    });
  } else {
    db.update('customers', customerDir.id, {
      status: 'ACTIVE',
      customer_code: customerCode
    });
  }

  // 7. Generate Secure Single-Use Cryptographic Activation Token (48h expiry)
  const activationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  // Invalidate any previous unused tokens for this email
  const oldInvitations = db.findAll('customer_account_invitations', (inv) => inv.email.toLowerCase() === customerEmail && !inv.is_used);
  for (const oldInv of oldInvitations) {
    db.update('customer_account_invitations', oldInv.id, { is_used: true, notes: 'Superceded by new invitation.' });
  }

  const invitation = db.insert('customer_account_invitations', {
    customer_id: customerCode,
    user_id: userRecord.id,
    booking_id: booking.id,
    booking_number: booking.booking_number,
    email: customerEmail,
    token: activationToken,
    expires_at: expiresAt,
    is_used: false,
    used_at: null,
    created_by: req.user.id,
    created_by_name: req.user.name,
    created_at: new Date().toISOString()
  });

  // 8. Associate Booking with Customer Record
  db.update('bookings', booking.id, {
    customer_id: userRecord.id,
    customer_code: customerCode,
    customer_account_status: 'ACTIVE',
    invitation_sent_at: new Date().toISOString()
  });

  // 9. Record Status History & Audit Logs
  db.insert('customer_account_status_history', {
    agency_id: agencyId,
    user_id: userRecord.id,
    customer_id: customerCode,
    booking_id: booking.id,
    from_status: 'NOT_CREATED',
    to_status: 'ACTIVE',
    changed_by: req.user.id,
    notes: `Manager ${req.user.name} generated customer login ID and temporary password.`,
    created_at: new Date().toISOString()
  });

  db.recordAuditLog(agencyId, req.user.id, 'CREATE_CUSTOMER_LOGIN', 'customer', customerCode, {
    booking_id: booking.id,
    booking_number: booking.booking_number,
    customer_name: booking.customer_name,
    email: customerEmail
  });

  // 10. Automatically Dispatch Onboarding Email with Activation Link
  let emailResult = null;
  try {
    emailResult = await emailService.sendAccountActivationEmail({
      agency_id: agencyId,
      to: customerEmail,
      name: booking.customer_name,
      customer_id: customerCode,
      booking_id: booking.booking_number,
      activation_token: activationToken,
      app_url: appUrl
    });
  } catch (mailErr) {
    console.error('Failed to send onboarding email:', mailErr);
  }

  const loginUrl = `${appUrl}/login?email=${encodeURIComponent(customerEmail)}`;
  const activationLink = emailResult?.activation_link || `${appUrl}/activate?token=${activationToken}&email=${encodeURIComponent(customerEmail)}`;

  res.status(201).json({
    success: true,
    message: `Customer login account created successfully! Credentials ready.`,
    customer_id: customerCode,
    email: customerEmail,
    temp_password: finalTempPassword,
    login_url: loginUrl,
    activation_link: activationLink,
    booking_id: booking.booking_number,
    account_status: 'ACTIVE'
  });
  activation_link: emailResult?.activation_link || undefined
});
});

// Manager Create Paid Customer Account & Generate Customer ID
// Supports both linking an existing confirmed booking OR entering new paid customer details directly
app.post('/api/admin/customers/create-paid', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const agencyId = req.user.agency_id;
  const {
    booking_id,
    name,
    email,
    phone,
    destination,
    total_amount,
    advance_amount,
    payment_method,
    payment_reference,
    travel_date,
    notes
  } = req.body;

  let booking = null;

  // Case 1: Linking to an existing booking
  if (booking_id) {
    booking = db.findById('bookings', booking_id);
    if (!booking || booking.agency_id !== agencyId) {
      return res.status(404).json({ error: 'Selected booking record was not found.' });
    }
  } else {
    // Case 2: Direct creation with verified payment
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Customer Name, Email address, and Mobile number are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const advancePaid = Number(advance_amount) || 0;
    if (advancePaid <= 0) {
      return res.status(400).json({ error: 'Advance payment amount must be greater than zero to generate a paid customer ID.' });
    }

    const bookingTotal = Number(total_amount) || advancePaid;
    const bookingNumber = db.generateUniqueCode('bookings', 'BK', true);

    booking = db.insert('bookings', {
      agency_id: agencyId,
      booking_number: bookingNumber,
      customer_name: name.trim(),
      customer_email: cleanEmail,
      customer_phone: phone.trim(),
      destination_name: destination || 'Custom Tour Holiday',
      total_amount: bookingTotal,
      advance_amount: advancePaid,
      remaining_amount: Math.max(0, bookingTotal - advancePaid),
      booking_status: 'BOOKING_CONFIRMED',
      payment_status: advancePaid >= bookingTotal ? 'PAID' : 'PARTIALLY_PAID',
      advance_payment_method: payment_method || 'UPI',
      advance_payment_reference: payment_reference || `TXN-${Date.now().toString().slice(-6)}`,
      departure_date: travel_date || null,
      notes: notes || 'Direct paid customer onboarding via Manager portal',
      created_by: req.user.id,
      created_by_name: req.user.name,
      created_at: new Date().toISOString()
    });

    // Record verified transaction
    db.insert('payments', {
      agency_id: agencyId,
      booking_id: booking.id,
      booking_number: booking.booking_number,
      customer_name: name.trim(),
      customer_email: cleanEmail,
      amount: advancePaid,
      payment_method: payment_method || 'UPI',
      payment_type: 'ADVANCE_DEPOSIT',
      status: 'SUCCESS',
      transaction_reference: payment_reference || `TXN-${Date.now().toString().slice(-6)}`,
      notes: 'Verified advance payment for customer account creation',
      verified_by: req.user.id,
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  }

  const customerEmail = (booking.customer_email || '').trim().toLowerCase();
  const customerName = booking.customer_name || name || 'Valued Customer';
  const customerPhone = booking.customer_phone || phone || '';

  // Check if active user already exists
  const existingUser = db.findOne('users', (u) => u.email.toLowerCase() === customerEmail);
  if (existingUser && existingUser.status === 'active' && existingUser.password_hash) {
    db.update('bookings', booking.id, {
      customer_id: existingUser.id,
      customer_code: existingUser.customer_code || existingUser.id,
      customer_account_status: 'ACTIVE'
    });

    return res.status(200).json({
      success: true,
      already_exists: true,
      message: `Customer account already exists for ${customerEmail}. Booking #${booking.booking_number} has been linked to their existing portal.`,
      customer_id: existingUser.customer_code || existingUser.id,
      booking_id: booking.booking_number,
      email: customerEmail,
      account_status: 'ACTIVE'
    });
  }

  // Generate Unique Customer ID (e.g. CUS-2026-0001)
  const customerCode = db.generateUniqueCode('users', 'CUS', true);

  // Create or update user with pending activation status
  let userRecord = existingUser;
  if (!userRecord) {
    userRecord = db.insert('users', {
      agency_id: agencyId,
      role: 'customer',
      customer_code: customerCode,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      password_hash: '',
      status: 'pending_activation',
      account_status: 'INVITATION_SENT',
      activation_status: 'INVITATION_SENT',
      created_at: new Date().toISOString()
    });
  } else {
    userRecord = db.update('users', userRecord.id, {
      customer_code: userRecord.customer_code || customerCode,
      account_status: 'INVITATION_SENT',
      activation_status: 'INVITATION_SENT'
    });
  }

  // Ensure customer profile exists
  let custProfile = db.findOne('customer_profiles', (cp) => cp.user_id === userRecord.id);
  if (!custProfile) {
    db.insert('customer_profiles', {
      user_id: userRecord.id,
      customer_code: customerCode,
      agency_id: agencyId,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      preferred_currency: 'INR'
    });
  }

  // Ensure customer directory record exists
  let customerDir = db.findOne('customers', (c) => c.email.toLowerCase() === customerEmail);
  if (!customerDir) {
    db.insert('customers', {
      id: customerCode,
      customer_code: customerCode,
      user_id: userRecord.id,
      agency_id: agencyId,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      status: 'INVITATION_SENT',
      created_at: new Date().toISOString()
    });
  } else {
    db.update('customers', customerDir.id, {
      status: 'INVITATION_SENT',
      customer_code: customerCode
    });
  }

  // Generate Secure Single-Use Cryptographic Activation Token (48h expiry)
  const activationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  // Invalidate any previous unused tokens for this email
  const oldInvitations = db.findAll('customer_account_invitations', (inv) => inv.email.toLowerCase() === customerEmail && !inv.is_used);
  for (const oldInv of oldInvitations) {
    db.update('customer_account_invitations', oldInv.id, { is_used: true, notes: 'Superceded by new invitation.' });
  }

  db.insert('customer_account_invitations', {
    customer_id: customerCode,
    user_id: userRecord.id,
    booking_id: booking.id,
    booking_number: booking.booking_number,
    email: customerEmail,
    token: activationToken,
    expires_at: expiresAt,
    is_used: false,
    used_at: null,
    created_by: req.user.id,
    created_by_name: req.user.name,
    created_at: new Date().toISOString()
  });

  // Link booking with customer ID
  db.update('bookings', booking.id, {
    customer_id: userRecord.id,
    customer_code: customerCode,
    customer_account_status: 'INVITATION_SENT'
  });

  db.recordAuditLog(agencyId, req.user.id, 'CREATE_PAID_CUSTOMER_ACCOUNT', 'customer', customerCode, {
    booking_id: booking.id,
    booking_number: booking.booking_number,
    customer_name: customerName,
    email: customerEmail
  });

  // Automatically Dispatch Onboarding Email with Activation Link
  let emailResult = null;
  try {
    emailResult = await emailService.sendAccountActivationEmail({
      agency_id: agencyId,
      to: customerEmail,
      name: customerName,
      customer_id: customerCode,
      booking_id: booking.booking_number,
      activation_token: activationToken,
      app_url: req.headers.origin || 'http://localhost:3000'
    });
  } catch (mailErr) {
    console.error('Failed to send onboarding email:', mailErr);
  }

  res.status(201).json({
    success: true,
    message: `Paid customer onboarded successfully! Generated Customer ID: ${customerCode}.`,
    customer_id: customerCode,
    email: customerEmail,
    booking_id: booking.booking_number,
    advance_amount: Number(booking.advance_amount) || 0,
    account_status: 'INVITATION_SENT',
    activation_link: emailResult?.activation_link || undefined
  });
});

// Manager Resend Activation Invitation
app.post('/api/admin/customers/resend-invitation', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const agencyId = req.user.agency_id;
  const { customer_id, booking_id, email } = req.body;

  let booking = null;
  if (booking_id) {
    booking = db.findById('bookings', booking_id);
  }

  const targetEmail = (email || booking?.customer_email || '').trim().toLowerCase();
  if (!targetEmail) {
    return res.status(400).json({ error: 'Customer email or booking reference is required.' });
  }

  const user = db.findOne('users', (u) => u.email.toLowerCase() === targetEmail);
  if (!user) {
    return res.status(404).json({ error: 'Customer account not found for this email.' });
  }

  const custCode = user.customer_code || customer_id || 'CUS-2026-0001';
  const bookingNum = booking?.booking_number || 'TRV-2026-0001';

  // Invalidate old tokens
  const oldInvitations = db.findAll('customer_account_invitations', (inv) => inv.email.toLowerCase() === targetEmail && !inv.is_used);
  for (const oldInv of oldInvitations) {
    db.update('customer_account_invitations', oldInv.id, { is_used: true, notes: 'Superceded by resend invitation.' });
  }

  // Generate fresh token
  const activationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  db.insert('customer_account_invitations', {
    customer_id: custCode,
    user_id: user.id,
    booking_id: booking?.id || 'manual',
    booking_number: bookingNum,
    email: targetEmail,
    token: activationToken,
    expires_at: expiresAt,
    is_used: false,
    used_at: null,
    created_by: req.user.id,
    created_by_name: req.user.name,
    created_at: new Date().toISOString()
  });

  const emailRes = await emailService.sendAccountActivationEmail({
    agency_id: agencyId,
    to: targetEmail,
    name: user.name,
    customer_id: custCode,
    booking_id: bookingNum,
    activation_token: activationToken,
    app_url: req.headers.origin || 'http://localhost:3000'
  });

  db.recordAuditLog(agencyId, req.user.id, 'RESEND_CUSTOMER_INVITATION', 'customer', custCode, {
    email: targetEmail
  });

  res.json({
    success: true,
    message: `Activation invitation resent successfully to ${targetEmail}.`,
    customer_id: custCode,
    activation_link: emailRes.activation_link
  });
});

// Manager Update Customer Account Status (Suspend / Reactivate)
app.put('/api/admin/customers/:id/status', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const { status, reason } = req.body;
  if (!['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required: ACTIVE, SUSPENDED, DEACTIVATED.' });
  }

  const user = db.findById('users', req.params.id) || db.findOne('users', (u) => u.customer_code === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Customer account not found.' });
  }

  const userStatus = status === 'ACTIVE' ? 'active' : 'inactive';
  db.update('users', user.id, {
    status: userStatus,
    account_status: status
  });

  const custDir = db.findOne('customers', (c) => c.user_id === user.id || c.customer_code === req.params.id);
  if (custDir) {
    db.update('customers', custDir.id, { status });
  }

  db.recordAuditLog(req.user.agency_id, req.user.id, 'UPDATE_CUSTOMER_STATUS', 'customer', user.id, {
    new_status: status,
    reason: reason || ''
  });

  res.json({
    success: true,
    message: `Customer account status updated to ${status}.`
  });
});

// Verify Account Activation Token (Supports Customer & B2B Agent Invitations)
app.get('/api/auth/verify-activation-token', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Activation token is required.' });
  }

  // 1. Check Customer Invitations
  let invitation = db.findOne('customer_account_invitations', (inv) => inv.token === token);
  let isAgent = false;

  // 2. Check B2B Agent Invitations
  if (!invitation) {
    invitation = db.findOne('agent_account_invitations', (inv) => inv.token === token);
    if (invitation) isAgent = true;
  }

  if (!invitation) {
    return res.status(404).json({ error: 'Invalid activation link. Please request a new invitation.' });
  }

  if (invitation.is_used) {
    return res.status(400).json({ error: 'This activation link has already been used. Please log in directly.' });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This activation link has expired (valid for 48 hours). Please contact your administrator for a fresh link.' });
  }

  if (isAgent) {
    const b2b = db.findOne('b2b_agents', (b) => b.agent_id === invitation.agent_id || (b.email && invitation.email && b.email.toLowerCase() === invitation.email.toLowerCase()));
    return res.json({
      valid: true,
      email: invitation.email,
      role: 'agent',
      agent_id: invitation.agent_id,
      company_name: b2b ? b2b.company_name : 'B2B Travel Partner'
    });
  }

  res.json({
    valid: true,
    email: invitation.email,
    role: 'customer',
    customer_id: invitation.customer_id,
    booking_number: invitation.booking_number
  });
});

// Activate Account & Set Password (Supports Customer & B2B Agent Invitations)
app.post('/api/auth/activate-account', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // 1. Check Customer Invitations
  let invitation = db.findOne('customer_account_invitations', (inv) => inv.token === token);
  let isAgent = false;

  // 2. Check B2B Agent Invitations
  if (!invitation) {
    invitation = db.findOne('agent_account_invitations', (inv) => inv.token === token);
    if (invitation) isAgent = true;
  }

  if (!invitation) {
    return res.status(404).json({ error: 'Invalid activation link.' });
  }

  if (invitation.is_used) {
    return res.status(400).json({ error: 'This activation token has already been used. Please log in directly.' });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This activation link has expired.' });
  }

  const user = db.findById('users', invitation.user_id) || db.findOne('users', (u) => u.email.toLowerCase() === invitation.email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Associated account record not found.' });
  }

  // Hash new password securely with bcrypt
  const passwordHash = bcrypt.hashSync(password, 10);

  if (isAgent) {
    // Invalidate single-use agent invitation token
    db.update('agent_account_invitations', invitation.id, {
      is_used: true,
      used_at: new Date().toISOString()
    });

    // Activate user account
    db.update('users', user.id, {
      password_hash: passwordHash,
      status: 'active',
      account_status: 'ACTIVE',
      activation_status: 'ACTIVATED',
      activated_at: new Date().toISOString()
    });

    // Activate B2B agent master record
    const b2b = db.findOne('b2b_agents', (b) => b.agent_id === invitation.agent_id || (b.email && invitation.email && b.email.toLowerCase() === invitation.email.toLowerCase()) || b.user_id === user.id);
    if (b2b) {
      db.update('b2b_agents', b2b.id, {
        account_status: 'ACTIVE',
        invitation_status: 'ACTIVATED',
        activated_at: new Date().toISOString()
      });
      db.recordAgentInvitationHistory(b2b.agent_id, 'ACCOUNT_ACTIVATED', user.id, {
        email: user.email,
        activated_at: new Date().toISOString()
      });
      db.recordAgentStatusHistory(b2b.agent_id, 'INVITATION_PENDING', 'ACTIVE', user.id, 'Agent activated account via secure single-use invitation link.');
    }

    // Update agent_profiles if present
    const profile = db.findOne('agent_profiles', (ap) => ap.user_id === user.id);
    if (profile) {
      db.update('agent_profiles', profile.id, { status: 'approved' });
    }

    return res.json({
      success: true,
      role: 'agent',
      agent_id: invitation.agent_id,
      message: 'Your B2B Agent account has been activated successfully! Please log in to access your wholesale dashboard.'
    });
  }

  // Customer activation path
  db.update('customer_account_invitations', invitation.id, {
    is_used: true,
    used_at: new Date().toISOString()
  });

  const updatedUser = db.update('users', user.id, {
    password_hash: passwordHash,
    status: 'active',
    account_status: 'ACTIVE',
    activation_status: 'ACTIVATED',
    activated_at: new Date().toISOString()
  });

  // Update customer directory
  const custDir = db.findOne('customers', (c) => c.user_id === user.id || c.email.toLowerCase() === invitation.email.toLowerCase());
  if (custDir) {
    db.update('customers', custDir.id, {
      status: 'ACTIVE',
      activated_at: new Date().toISOString()
    });
  }

  // Update associated bookings
  const bookings = db.findAll('bookings', (b) => b.customer_email && b.customer_email.toLowerCase() === user.email.toLowerCase());
  for (const b of bookings) {
    db.update('bookings', b.id, {
      customer_id: user.id,
      customer_account_status: 'ACTIVE'
    });
  }

  // Audit log
  db.recordAuditLog(user.agency_id, user.id, 'ACTIVATE_CUSTOMER_ACCOUNT', 'customer', user.id, {
    customer_id: invitation.customer_id,
    email: user.email
  });

  // In-app notifications
  db.createNotification(
    user.agency_id,
    user.id,
    'Welcome to Your Travel Portal!',
    'Your customer account is now fully active. Explore your holiday bookings, payments, and itineraries.',
    'success',
    '/customer/dashboard'
  );

  // Notify Managers
  const managers = db.findAll('users', (u) => u.agency_id === user.agency_id && (u.role === 'manager' || u.role === 'admin'));
  for (const m of managers) {
    db.createNotification(
      user.agency_id,
      m.id,
      'Customer Account Activated',
      `Customer ${user.name} (${user.email}) has activated their account.`,
      'info',
      '/admin/customers'
    );
  }

  res.status(200).json({
    success: true,
    message: 'Account activated successfully! You can now log into your travel portal.',
    email: user.email
  });
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
app.get('/api/agent/marketplace', authenticate, authorize(['agent', 'manager', 'admin']), (req, res) => {
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
  const { package_id, travelers_count, travel_date, client_name, client_selling_price, client_email, client_phone, traveler_details } = req.body;

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
    client_email: client_email || '',
    client_phone: client_phone || '',
    traveler_details: traveler_details || [],
    client_selling_price: clientPrice,
    projected_margin: projectedMargin,
    status: 'Confirmed',
    created_at: new Date().toISOString()
  });

  // Create corresponding confirmed B2B booking record
  const bookingNum = `B2B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  db.insert('bookings', {
    agency_id: agencyId,
    booking_number: bookingNum,
    customer_id: null,
    customer_name: client_name || `Client of ${profile ? profile.company_name : req.user.name}`,
    customer_email: client_email || req.user.email,
    customer_phone: client_phone || '',
    booking_type: 'B2B',
    agent_id: agentId,
    agent_name: req.user.name,
    package_id: pkg.id,
    package_title: pkg.title,
    travel_start_date: travel_date || new Date().toISOString().split('T')[0],
    travel_end_date: '',
    travelers_count: pax,
    traveler_details: traveler_details || [],
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
app.get('/api/agent/purchases', authenticate, authorize(['agent', 'manager', 'admin']), (req, res) => {
  const agentId = req.user.id;
  const agencyId = req.user.agency_id;
  let purchases;
  if (req.user.role === 'manager' || req.user.role === 'admin') {
    purchases = db.findAll('agent_purchases', (ap) => ap.agency_id === agencyId || !ap.agency_id);
  } else {
    purchases = db.findAll('agent_purchases', (ap) => ap.agent_id === agentId);
  }
  purchases.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(purchases);
});

// Agent Transactions / Ledger
app.get('/api/agent/transactions', authenticate, authorize(['agent', 'manager', 'admin']), (req, res) => {
  const agentId = req.user.id;
  const agencyId = req.user.agency_id;
  let transactions;
  if (req.user.role === 'manager' || req.user.role === 'admin') {
    transactions = db.findAll('agent_transactions', (tx) => tx.agency_id === agencyId || !tx.agency_id);
  } else {
    transactions = db.findAll('agent_transactions', (tx) => tx.agent_id === agentId);
  }
  transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(transactions);
});

// ==========================================
// 7. FILE UPLOAD ENDPOINT
// ==========================================
app.post('/api/upload', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findById('users', decoded.id);
      if (user) req.user = user;
    } catch (e) {
      // Continue gracefully so local file uploads aren't blocked by token expiration
    }
  }
  next();
}, upload.single('file'), (req, res) => {
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

// ==========================================
// OPERATIONS EXECUTIVE & LOGISTICS PORTAL
// ==========================================

// Operations Dashboard Stats & Overview
app.get('/api/operations/dashboard', authenticate, authorize(['operations', 'manager', 'admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const bookings = db.findAll('bookings', (b) => b.agency_id === agencyId);
  const arrangements = db.findAll('operations_arrangements', (a) => a.agency_id === agencyId) || [];
  const documents = db.findAll('travel_documents', (d) => d.agency_id === agencyId) || [];

  const arrangementsMap = new Map();
  arrangements.forEach((a) => arrangementsMap.set(a.booking_id, a));

  const stats = {
    total_confirmed_bookings: bookings.length,
    arrangements_pending: bookings.filter((b) => {
      const arr = arrangementsMap.get(b.id);
      return !arr || arr.trip_status === 'Booking Received' || arr.trip_status === 'Arrangements Pending';
    }).length,
    hotel_confirmed: arrangements.filter((a) => a.trip_status === 'Hotel Confirmed').length,
    transport_confirmed: arrangements.filter((a) => a.trip_status === 'Transport Confirmed').length,
    documents_ready: arrangements.filter((a) => a.trip_status === 'Documents Ready' || a.trip_status === 'Ready to Travel').length,
    trips_in_progress: arrangements.filter((a) => a.trip_status === 'Trip In Progress').length,
    trips_completed: arrangements.filter((a) => a.trip_status === 'Trip Completed').length,
    issues_reported: arrangements.filter((a) => a.trip_status === 'Issue Reported').length,
    total_documents: documents.length,
    pending_customer_verifications: documents.filter((d) => d.category === 'Customer-Provided' && d.status === 'pending').length
  };

  const enrichedBookings = bookings.map((b) => {
    const arr = arrangementsMap.get(b.id) || {
      id: `arr_${b.id}`,
      agency_id: agencyId,
      booking_id: b.id,
      trip_status: 'Booking Received',
      updated_at: b.created_at
    };
    const docs = documents.filter((d) => d.booking_id === b.id);
    return {
      ...b,
      operations: arr,
      documents_count: docs.length
    };
  });

  res.json({ stats, bookings: enrichedBookings });
});

// Get all bookings for operations execution
app.get('/api/operations/bookings', authenticate, authorize(['operations', 'manager', 'admin']), (req, res) => {
  const agencyId = req.user.agency_id;
  const bookings = db.findAll('bookings', (b) => b.agency_id === agencyId);
  const arrangements = db.findAll('operations_arrangements', (a) => a.agency_id === agencyId) || [];
  const documents = db.findAll('travel_documents', (d) => d.agency_id === agencyId) || [];

  const arrMap = new Map();
  arrangements.forEach((a) => arrMap.set(a.booking_id, a));

  const result = bookings.map((b) => {
    const arr = arrMap.get(b.id) || {
      id: `arr_${b.id}`,
      agency_id: agencyId,
      booking_id: b.id,
      trip_status: 'Booking Received',
      updated_at: b.created_at
    };
    const docs = documents.filter((d) => d.booking_id === b.id);
    return {
      ...b,
      operations: arr,
      documents: docs
    };
  });

  res.json(result);
});

// Update operations arrangements (hotel, vehicle, driver, guide)
app.put('/api/operations/bookings/:id/arrangements', authenticate, authorize(['operations', 'manager', 'admin']), (req, res) => {
  const bookingId = req.params.id;
  const booking = db.findById('bookings', bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  let arrangement = db.findOne('operations_arrangements', (a) => a.booking_id === bookingId);
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  if (arrangement) {
    arrangement = db.update('operations_arrangements', arrangement.id, updateData);
  } else {
    arrangement = db.insert('operations_arrangements', {
      agency_id: booking.agency_id,
      booking_id: bookingId,
      trip_status: req.body.trip_status || 'Arrangements Pending',
      ...updateData
    });
  }

  // Notify customer if booking has customer_id
  if (booking.customer_id) {
    db.insert('notifications', {
      agency_id: booking.agency_id,
      user_id: booking.customer_id,
      title: 'Trip Arrangements Updated',
      message: `Logistics details for your trip ${booking.package_title} have been updated by our Operations team.`,
      type: 'info',
      link: '/customer/documents',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  res.json(arrangement);
});

// Advance trip operational status
app.put('/api/operations/bookings/:id/trip-status', authenticate, authorize(['operations', 'manager', 'admin']), (req, res) => {
  const bookingId = req.params.id;
  const { trip_status } = req.body;
  const booking = db.findById('bookings', bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  let arrangement = db.findOne('operations_arrangements', (a) => a.booking_id === bookingId);
  if (arrangement) {
    arrangement = db.update('operations_arrangements', arrangement.id, {
      trip_status,
      updated_at: new Date().toISOString()
    });
  } else {
    arrangement = db.insert('operations_arrangements', {
      agency_id: booking.agency_id,
      booking_id: bookingId,
      trip_status,
      updated_at: new Date().toISOString()
    });
  }

  // Update booking_status if completed
  if (trip_status === 'Trip Completed') {
    db.update('bookings', booking.id, { booking_status: 'Completed' });
  } else if (trip_status === 'Trip In Progress') {
    db.update('bookings', booking.id, { booking_status: 'In Progress' });
  }

  res.json(arrangement);
});

// Generate consolidated travel dossier
app.post('/api/operations/bookings/:id/generate-dossier', authenticate, authorize(['operations', 'manager', 'admin']), (req, res) => {
  const bookingId = req.params.id;
  const booking = db.findById('bookings', bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  let arrangement = db.findOne('operations_arrangements', (a) => a.booking_id === bookingId);
  const dossierDoc = db.insert('travel_documents', {
    agency_id: booking.agency_id,
    booking_id: bookingId,
    customer_id: booking.customer_id,
    category: 'Booking Confirmation',
    title: `Consolidated Travel Dossier - ${booking.package_title}`,
    file_name: `TripByGenie_Consolidated_Dossier_${booking.booking_number}.pdf`,
    file_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    file_size: '1.4 MB',
    file_type: 'application/pdf',
    status: 'available',
    uploaded_by_role: req.user.role,
    uploaded_by_name: req.user.name,
    notes: 'Official all-inclusive travel dossier with hotel confirmations, driver contacts, day-by-day itineraries, and emergency support numbers.',
    created_at: new Date().toISOString()
  });

  if (arrangement) {
    arrangement = db.update('operations_arrangements', arrangement.id, {
      dossier_generated: true,
      dossier_url: dossierDoc.file_url,
      trip_status: 'Documents Ready',
      updated_at: new Date().toISOString()
    });
  }

  if (booking.customer_id) {
    db.insert('notifications', {
      agency_id: booking.agency_id,
      user_id: booking.customer_id,
      title: 'Travel Documents Ready!',
      message: `Your consolidated travel dossier for ${booking.package_title} is ready to download in your Digital Document Wallet.`,
      type: 'success',
      link: '/customer/documents',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  res.json({ success: true, document: dossierDoc, arrangement });
});

// ==========================================
// DIGITAL DOCUMENT WALLET & TRAVEL DOCUMENTS
// ==========================================

// Get travel documents (scoped by role & query)
app.get('/api/documents', authenticate, (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;
  const agencyId = req.user.agency_id;
  const { booking_id, category, customer_id } = req.query;

  let docs = db.findAll('travel_documents', (d) => d.agency_id === agencyId) || [];

  if (userRole === 'customer') {
    // Customers only see documents for their bookings or uploaded by them
    const userBookings = db.findAll('bookings', (b) => b.customer_id === userId).map((b) => b.id);
    docs = docs.filter((d) => d.customer_id === userId || userBookings.includes(d.booking_id));
  } else if (userRole === 'agent') {
    docs = docs.filter((d) => d.agent_id === userId || d.uploaded_by_role === 'agent');
  }

  if (booking_id) {
    docs = docs.filter((d) => d.booking_id === booking_id);
  }
  if (category && category !== 'all') {
    docs = docs.filter((d) => d.category === category);
  }
  if (customer_id) {
    docs = docs.filter((d) => d.customer_id === customer_id);
  }

  res.json(docs);
});

// Upload travel document (supports customer uploads and staff/ops vouchers)
app.post('/api/documents/upload', authenticate, (req, res) => {
  const {
    booking_id,
    customer_id,
    category,
    title,
    file_name,
    file_url,
    file_size,
    file_type,
    notes,
    expiry_date
  } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Document title and category are required.' });
  }

  const isCustomerUpload = req.user.role === 'customer' || category === 'Customer-Provided';
  const newDoc = db.insert('travel_documents', {
    agency_id: req.user.agency_id,
    booking_id: booking_id || '',
    customer_id: customer_id || (req.user.role === 'customer' ? req.user.id : ''),
    category,
    title,
    file_name: file_name || `${title.replace(/\s+/g, '_')}.pdf`,
    file_url: file_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    file_size: file_size || '350 KB',
    file_type: file_type || 'application/pdf',
    status: isCustomerUpload ? 'pending' : 'available',
    uploaded_by_role: req.user.role,
    uploaded_by_name: req.user.name,
    notes: notes || '',
    expiry_date: expiry_date || '',
    created_at: new Date().toISOString()
  });

  // Notify operations if uploaded by customer
  if (isCustomerUpload) {
    const opsUsers = db.findAll('users', (u) => u.role === 'operations' || u.role === 'manager');
    opsUsers.forEach((op) => {
      db.insert('notifications', {
        agency_id: req.user.agency_id,
        user_id: op.id,
        title: 'New Traveler Document Uploaded',
        message: `${req.user.name} uploaded ${title} for verification.`,
        type: 'info',
        link: '/operations/bookings',
        is_read: false,
        created_at: new Date().toISOString()
      });
    });
  }

  res.status(201).json(newDoc);
});

// Verify or reject customer document
app.put('/api/documents/:id/verify', authenticate, authorize(['operations', 'manager', 'admin']), (req, res) => {
  const { status, notes } = req.body; // 'verified' | 'rejected'
  const doc = db.findById('travel_documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const updated = db.update('travel_documents', doc.id, {
    status: status || 'verified',
    notes: notes ? `${doc.notes ? doc.notes + ' ' : ''}${notes}` : doc.notes,
    verified_by: req.user.name,
    verified_at: new Date().toISOString()
  });

  if (doc.customer_id) {
    db.insert('notifications', {
      agency_id: doc.agency_id,
      user_id: doc.customer_id,
      title: status === 'verified' ? 'Document Verified' : 'Document Action Required',
      message: `Your uploaded document "${doc.title}" has been marked as ${status}.`,
      type: status === 'verified' ? 'success' : 'alert',
      link: '/customer/documents',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  res.json(updated);
});

// Delete document
app.delete('/api/documents/:id', authenticate, (req, res) => {
  const doc = db.findById('travel_documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  db.delete('travel_documents', doc.id);
  res.json({ success: true, message: 'Document deleted successfully.' });
});

// Authenticated Secure Document Download (Enforces Customer and Agent Isolation)
app.get('/api/documents/:id/download', authenticate, (req, res) => {
  const doc = db.findById('travel_documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Travel document not found.' });
  }

  const user = req.user;
  // Authorization isolation checks
  if (user.role === 'customer') {
    const userBookings = db.findAll('bookings', (b) => b.customer_id === user.id).map((b) => b.id);
    if (doc.customer_id !== user.id && !userBookings.includes(doc.booking_id)) {
      return res.status(403).json({ error: 'Access denied: cannot access another traveler’s private travel document.' });
    }
  } else if (user.role === 'agent') {
    if (doc.agent_id && doc.agent_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: cannot access another travel agent’s document.' });
    }
  }

  // Audit document access
  db.insert('audit_logs', {
    user_id: user.id,
    action: 'DOCUMENT_DOWNLOADED',
    entity_type: 'TRAVEL_DOCUMENT',
    entity_id: doc.id,
    details: `${user.name} (${user.role}) downloaded ${doc.title}`,
    created_at: new Date().toISOString()
  });

  // If local file exists, send file as attachment
  if (doc.local_path && fs.existsSync(doc.local_path)) {
    return res.download(doc.local_path, doc.file_name || 'document.pdf');
  }

  // Redirect to secure document URL
  if (doc.file_url) {
    return res.redirect(doc.file_url);
  }

  res.status(404).json({ error: 'Document binary file path unavailable.' });
});

// ==========================================
// CUSTOMER SUPPORT TICKETS
// ==========================================

// Get tickets (scoped)
app.get('/api/support/tickets', authenticate, (req, res) => {
  const user = req.user;
  let tickets = db.findAll('support_tickets', (t) => t.agency_id === user.agency_id) || [];

  if (user.role === 'customer') {
    tickets = tickets.filter((t) => t.user_id === user.id);
  }

  res.json(tickets);
});

// Create new support ticket
app.post('/api/support/tickets', authenticate, (req, res) => {
  const { subject, category, priority, booking_id, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  const ticketNum = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  const newTicket = db.insert('support_tickets', {
    ticket_number: ticketNum,
    agency_id: req.user.agency_id,
    user_id: req.user.id,
    customer_name: req.user.name,
    customer_email: req.user.email,
    booking_id: booking_id || '',
    subject,
    category: category || 'General Enquiry',
    priority: priority || 'medium',
    status: 'open',
    assigned_to: 'Support & Operations Team',
    messages: [
      {
        id: `msg_${Date.now()}`,
        sender_role: req.user.role,
        sender_name: req.user.name,
        message,
        created_at: new Date().toISOString()
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Notify team
  const teamUsers = db.findAll('users', (u) => u.role === 'operations' || u.role === 'manager' || u.role === 'admin');
  teamUsers.forEach((m) => {
    db.insert('notifications', {
      agency_id: req.user.agency_id,
      user_id: m.id,
      title: `New Support Ticket ${ticketNum}`,
      message: `${req.user.name}: "${subject}"`,
      type: 'warning',
      link: '/manager/dashboard',
      is_read: false,
      created_at: new Date().toISOString()
    });
  });

  res.status(201).json(newTicket);
});

// Reply to support ticket
app.post('/api/support/tickets/:id/messages', authenticate, (req, res) => {
  const ticket = db.findById('support_tickets', req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Support ticket not found.' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const newMessage = {
    id: `msg_${Date.now()}`,
    sender_role: req.user.role,
    sender_name: req.user.name,
    message,
    created_at: new Date().toISOString()
  };

  const updatedMessages = [...(ticket.messages || []), newMessage];
  const newStatus = req.user.role === 'customer' ? 'open' : 'in_progress';

  const updated = db.update('support_tickets', ticket.id, {
    messages: updatedMessages,
    status: newStatus,
    updated_at: new Date().toISOString()
  });

  // Notify other party
  const recipientUserId = req.user.role === 'customer' ? null : ticket.user_id;
  if (recipientUserId) {
    db.insert('notifications', {
      agency_id: ticket.agency_id,
      user_id: recipientUserId,
      title: `Response on ${ticket.ticket_number}`,
      message: `${req.user.name}: "${message.substring(0, 80)}..."`,
      type: 'info',
      link: '/customer/support',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  res.json(updated);
});

// Update support ticket status
app.put('/api/support/tickets/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  const ticket = db.findById('support_tickets', req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  const updated = db.update('support_tickets', ticket.id, {
    status,
    updated_at: new Date().toISOString()
  });
  res.json(updated);
});

// ==========================================
// B2B WHOLESALE PRICING ENGINE & AGENT HUB
// ==========================================

// Wholesale Tiered Pricing Engine
app.post('/api/b2b/calculate-price', authenticate, (req, res) => {
  const { package_id, travelers_count } = req.body;
  const pax = Math.max(1, parseInt(travelers_count, 10) || 1);

  const pkg = db.findById('packages', package_id);
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found.' });
  }

  const baseWholesale = pkg.agent_wholesale_price || pkg.wholesale_price || Math.round(pkg.public_price * 0.85);
  const retailPrice = pkg.public_price;

  let tierName = 'Standard B2B Tier (1-4 Pax)';
  let discountPct = 0;

  if (pax >= 20) {
    tierName = 'Mega Group Wholesale Tier (20+ Pax)';
    discountPct = 15;
  } else if (pax >= 10) {
    tierName = 'Medium Group Wholesale Tier (10-19 Pax)';
    discountPct = 10;
  } else if (pax >= 5) {
    tierName = 'Small Group Wholesale Tier (5-9 Pax)';
    discountPct = 5;
  }

  const discountAmountPerPax = Math.round(baseWholesale * (discountPct / 100));
  const finalWholesalePerPax = baseWholesale - discountAmountPerPax;
  const totalWholesaleCost = finalWholesalePerPax * pax;
  const totalRetailPrice = retailPrice * pax;
  const projectedMarginTotal = totalRetailPrice - totalWholesaleCost;
  const marginPct = Math.round((projectedMarginTotal / totalRetailPrice) * 100);

  res.json({
    package_id: pkg.id,
    package_title: pkg.title,
    travelers_count: pax,
    tier_name: tierName,
    tier_discount_pct: discountPct,
    base_wholesale_price: baseWholesale,
    discount_amount_per_pax: discountAmountPerPax,
    final_wholesale_price_per_pax: finalWholesalePerPax,
    total_wholesale_cost: totalWholesaleCost,
    suggested_retail_price: retailPrice,
    total_retail_price: totalRetailPrice,
    projected_margin_total: projectedMarginTotal,
    margin_pct: marginPct
  });
});

// B2B Documents (Invoices, White-label vouchers)
app.get('/api/b2b/documents', authenticate, (req, res) => {
  const purchases = db.findAll('agent_purchases', (p) => p.agency_id === req.user.agency_id) || [];
  const b2bDocs = purchases.map((p) => ({
    id: `inv_${p.id}`,
    purchase_id: p.id,
    package_title: p.package_title,
    client_name: p.client_name,
    amount: p.total_cost,
    invoice_number: `INV-B2B-${p.id.replace(/[^0-9]/g, '').slice(-4) || '9021'}`,
    date: p.created_at,
    status: 'Paid',
    invoice_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    voucher_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  }));
  res.json(b2bDocs);
});

// Agent End Customers
app.get('/api/b2b/customers', authenticate, (req, res) => {
  const customers = db.findAll('agent_customers', (c) => c.agency_id === req.user.agency_id) || [];
  res.json(customers);
});

app.post('/api/b2b/customers', authenticate, (req, res) => {
  const { name, email, phone, passport_number, id_proof_type, id_proof_number, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Passenger name and phone number are required.' });
  }

  const newCustomer = db.insert('agent_customers', {
    agency_id: req.user.agency_id,
    agent_id: req.user.id,
    name,
    email: email || '',
    phone,
    passport_number: passport_number || '',
    id_proof_type: id_proof_type || 'Passport',
    id_proof_number: id_proof_number || '',
    notes: notes || '',
    created_at: new Date().toISOString()
  });

  res.status(201).json(newCustomer);
});

// ==========================================
// BRANCHES MANAGEMENT
// ==========================================
app.get('/api/admin/branches', authenticate, (req, res) => {
  const branches = db.findAll('branches', (b) => b.agency_id === req.user.agency_id) || [];
  res.json(branches);
});

app.post('/api/admin/branches', authenticate, authorize(['admin']), (req, res) => {
  const { name, code, city, address, manager_name, phone, email } = req.body;
  if (!name || !code || !city) {
    return res.status(400).json({ error: 'Branch name, code, and city are required.' });
  }

  const newBranch = db.insert('branches', {
    agency_id: req.user.agency_id,
    name,
    code,
    city,
    address: address || '',
    manager_name: manager_name || '',
    phone: phone || '',
    email: email || '',
    status: 'active'
  });

  res.status(201).json(newBranch);
});

// ==========================================
// REFUNDS & FINANCIAL ADJUSTMENTS
// ==========================================
app.get('/api/admin/refunds', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const refunds = db.findAll('refunds') || [];
  res.json(refunds);
});

app.post('/api/admin/refunds', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const { booking_id, payment_id, amount, reason } = req.body;
  if (!booking_id || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Booking ID and valid refund amount are required.' });
  }

  const booking = db.findById('bookings', booking_id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const refundAmt = Number(amount);
  const newRefund = db.insert('refunds', {
    booking_id,
    payment_id: payment_id || '',
    customer_id: booking.customer_id,
    amount: refundAmt,
    reason: reason || 'Customer cancellation or itinerary amendment refund',
    status: 'APPROVED',
    requested_by: req.user.name,
    approved_by: req.user.name,
    transaction_reference: `RFND-${Date.now()}`,
    processed_at: new Date().toISOString()
  });

  // Adjust booking advance
  const updatedAdvance = Math.max(0, (booking.advance_amount || 0) - refundAmt);
  const updatedBalance = Math.max(0, (booking.total_amount || 0) - updatedAdvance);
  db.update('bookings', booking.id, {
    advance_amount: updatedAdvance,
    balance_amount: updatedBalance,
    payment_status: updatedAdvance === 0 ? 'Refunded' : 'Partial'
  });

  // Audit log
  db.insert('audit_logs', {
    user_id: req.user.id,
    action: 'REFUND_PROCESSED',
    entity_type: 'REFUND',
    entity_id: newRefund.id,
    details: `Processed ₹${refundAmt} refund for booking #${booking.booking_number}`,
    created_at: new Date().toISOString()
  });

  res.status(201).json(newRefund);
});

// ==========================================
// AUDIT LOGS & COMPLIANCE
// ==========================================
app.get('/api/admin/audit-logs', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const logs = db.findAll('audit_logs') || [];
  logs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(logs);
});

// ==========================================
// QUOTATIONS APPROVAL WORKFLOW
// ==========================================
app.put('/api/admin/quotations/:id/approve-discount', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const quote = db.findById('quotations', req.params.id);
  if (!quote) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }

  const { approved_discount, manager_notes } = req.body;
  const newDiscount = Number(approved_discount) || quote.discount || 0;
  const newFinal = Math.max(0, Number(quote.total_amount) - newDiscount);

  const updated = db.update('quotations', quote.id, {
    discount: newDiscount,
    final_amount: newFinal,
    status: 'Approved',
    manager_approval: {
      approved_by: req.user.name,
      approved_at: new Date().toISOString(),
      notes: manager_notes || 'Exceptional discount approved by Operations Manager.'
    }
  });

  // Notify sales staff
  if (quote.staff_id) {
    db.insert('notifications', {
      agency_id: req.user.agency_id,
      user_id: quote.staff_id,
      title: 'Quotation Discount Approved!',
      message: `Manager ${req.user.name} approved discount of ₹${newDiscount.toLocaleString('en-IN')} on Quotation #${quote.quotation_number}.`,
      type: 'success',
      link: '/staff/leads',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  res.json(updated);
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
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[SERVER] TripByGenie Backend Server running on port ${PORT}`);
    console.log(`[SERVER] API Health: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

module.exports = app;

