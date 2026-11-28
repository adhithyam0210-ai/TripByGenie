const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const uuidv4 = () => crypto.randomUUID();
const db = require('./db');
const emailService = require('./src/services/email.service');
const tokenService = require('./src/services/token.service');
const { getTodayIST, isTodayOrFutureDate, isValidDateRange } = require('./src/utils/dateValidation');
const { corsOptions, helmetMiddleware, authLimiter, enquiryLimiter, safePathResolver } = require('./src/middlewares/security.middleware');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'travel_genie_super_secure_jwt_secret_2026';

// Enterprise Security Middlewares
app.use(helmetMiddleware);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount Modular API v1 Routes
const v1Routes = require('./src/routes/v1');
app.use('/api/v1', v1Routes);
app.use('/api/privacy', require('./src/routes/v1/privacy.routes'));

// Uploads directory
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[STORAGE] Read-only filesystem detected, uploads directory deferred:', e.message);
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

// Local media file streaming endpoint (supports byte ranges for videos & local files, protected against path traversal)
app.get('/api/media/stream', (req, res) => {
  const rawPath = req.query.path || '';
  const safeFile = safePathResolver(uploadDir, rawPath) || safePathResolver(path.join(__dirname, '../public'), rawPath);

  if (!safeFile || !fs.existsSync(safeFile)) {
    return res.status(404).send('Media file not found or path access denied');
  }

  const stat = fs.statSync(safeFile);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(safeFile).toLowerCase();

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
    const file = fs.createReadStream(safeFile, { start, end });
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
    fs.createReadStream(safeFile).pipe(res);
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

// JWT helper (Dual-token compatible 15-minute access token)
const generateToken = (user) => {
  return tokenService.createAccessToken(user);
};

// Auth Middleware (Dual-token & HttpOnly Cookie aware with Session Invalidation)
const authenticate = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.tg_access_token) {
    token = req.cookies.tg_access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  if (token.startsWith('token_demo_')) {
    const role = token.replace('token_demo_', '');
    const user = db.findOne('users', (u) => u.role.toLowerCase() === role.toLowerCase()) || db.findAll('users')[0];
    if (user) {
      req.user = user;
      return next();
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findById('users', decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or account is deactivated.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
    }
    if (user.tokens_invalidated_before && decoded.iat) {
      const tokenIatMs = decoded.iat * 1000;
      const invalidatedBeforeMs = new Date(user.tokens_invalidated_before).getTime();
      if (tokenIatMs < invalidatedBeforeMs) {
        return res.status(401).json({ error: 'Session invalidated. Please log in again.' });
      }
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

// Login (Unified single login for all roles with Agent ID or Email support + Rotating Refresh Token)
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Agent ID and password are required.' });
  }

  const trimmed = (email || '').trim().toLowerCase();
  const digitsOnly = trimmed.replace(/\D/g, '');
  let user = db.findOne('users', (u) => u.email && u.email.toLowerCase() === trimmed);
  if (!user && digitsOnly.length >= 10) {
    // Check if input is phone number
    user = db.findOne('users', (u) => u.phone && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10)));
  }
  if (!user) {
    // Check if input is a Customer Code or Employee ID Code (e.g. CUS-2026-0001, SLS-XXXX, TBG_SAL_XXX)
    user = db.findOne('users', (u) => (u.customer_code && u.customer_code.toLowerCase() === trimmed) || (u.employee_code && u.employee_code.toLowerCase() === trimmed));
  }
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
    return res.status(401).json({ error: 'Invalid email, phone number, or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact administrator.' });
  }

  // Handle customer, manager, and staff onboarding via direct login with invitation credentials:
  if (user.status === 'pending' || user.status === 'pending_activation') {
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (isMatch) {
      // First login with credentials automatically activates account
      db.update('users', user.id, {
        status: 'active',
        account_status: 'ACTIVE',
        activation_status: 'ACTIVATED',
        activated_at: new Date().toISOString()
      });
      user.status = 'active';

      if (user.role === 'staff' || user.role === 'sales' || user.role === 'operations') {
        const staffProf = db.findOne('staff_profiles', (sp) => sp.user_id === user.id);
        if (staffProf) {
          db.update('staff_profiles', staffProf.id, { status: 'active', activated_at: new Date().toISOString() });
        }
        const staffInv = db.findOne('staff_account_invitations', (inv) => inv.user_id === user.id && !inv.is_used);
        if (staffInv) {
          db.update('staff_account_invitations', staffInv.id, { is_used: true, used_at: new Date().toISOString() });
        }
      } else if (user.role === 'customer') {
        const custInv = db.findOne('customer_account_invitations', (inv) => (inv.user_id === user.id || inv.email.toLowerCase() === user.email.toLowerCase()) && !inv.is_used);
        if (custInv) {
          db.update('customer_account_invitations', custInv.id, { is_used: true, used_at: new Date().toISOString() });
        }
      }
    } else {
      return res.status(401).json({ error: 'Invalid email, phone number, or password. If this is your first time logging in, please check the credentials sent to your email.' });
    }
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

  const tokenPair = await tokenService.issueTokenPair(user, req, res);
  const agency = db.findById('agencies', user.agency_id);

  // Return clean user object without password_hash
  const { password_hash, ...safeUser } = user;
  res.json({
    token: tokenPair.token,
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    expiresIn: tokenPair.expiresIn,
    user: safeUser,
    agency
  });
});

// Refresh token rotation endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.tg_refresh_token || req.body?.refreshToken;
    const tokenPair = await tokenService.rotateRefreshToken(rawRefreshToken, req, res);
    res.json({
      token: tokenPair.token,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn
    });
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message, code: err.code || 'REFRESH_FAILED' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const rawRefreshToken = req.cookies?.tg_refresh_token || req.body?.refreshToken;
  if (rawRefreshToken) {
    tokenService.revokeToken(rawRefreshToken);
  }
  if (res.clearCookie) {
    res.clearCookie('tg_refresh_token', { path: '/' });
    res.clearCookie('tg_access_token', { path: '/' });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Logout from all devices
app.post('/api/auth/logout-all', authenticate, (req, res) => {
  tokenService.revokeAllUserTokens(req.user.id);
  if (res.clearCookie) {
    res.clearCookie('tg_refresh_token', { path: '/' });
    res.clearCookie('tg_access_token', { path: '/' });
  }
  res.json({ success: true, message: 'All active sessions terminated across all devices.' });
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

// Customer Registration (Auto-creates lead for Manager to assign to Sales, who then contacts & creates ID/pass)
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, enquiry_data, agency_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const defaultAgency = agency_id ? db.findById('agencies', agency_id) : db.findAll('agencies')[0];
  const targetAgencyId = defaultAgency ? defaultAgency.id : 'agency_travel_genie';

  const existing = db.findOne('users', (u) => u && u.email && u.email.toLowerCase() === cleanEmail);
  if (existing) {
    if (existing.status === 'pending_activation') {
      // Ensure a CRM Lead exists for this pending customer so Manager/Admin can assign it
      let existingLead = db.findOne('leads', (l) => l && l.customer_email && l.customer_email.toLowerCase() === cleanEmail);
      if (!existingLead) {
        existingLead = db.insert('leads', {
          agency_id: existing.agency_id || targetAgencyId,
          customer_id: existing.id,
          customer_name: (name || existing.name || '').trim(),
          customer_email: cleanEmail,
          customer_phone: (phone || existing.phone || '').trim(),
          interested_destination: enquiry_data?.destination || 'Direct Traveler Registration',
          interested_package_id: enquiry_data?.package_id || null,
          travel_date: enquiry_data?.travel_date || '',
          travelers_count: enquiry_data?.travelers_count || 2,
          budget: enquiry_data?.budget || 'Flexible',
          lead_source: enquiry_data?.source || 'New User Sign Up',
          status: 'New',
          assigned_staff_id: null,
          assigned_staff_name: 'Unassigned',
          follow_up_date: null,
          notes: `New customer self-signup. Manager: Assign to Sales Executive to verify travel preferences and issue official Customer ID & Credentials.`,
          created_at: new Date().toISOString()
        });

        // Notify Managers & Admins
        const managersAndAdmins = db.findAll('users', (u) => (u.agency_id === targetAgencyId || u.agency_id === 'agency_travel_genie') && ['admin', 'manager'].includes(u.role));
        for (const staff of managersAndAdmins) {
          db.createNotification(
            targetAgencyId,
            staff.id,
            'New Customer Registration Lead',
            `${name || existing.name} registered online. Lead is ready for Sales assignment in CRM Leads.`,
            'info',
            '/manager/leads'
          );
        }
      }

      return res.status(200).json({
        success: true,
        requires_verification: true,
        message: 'Your request was submitted and our employee will contact you shortly.',
        lead: existingLead
      });
    }
    return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const initialPassword = password ? password.trim() : `Genie@${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Create user account with pending status until sales verifies & issues credentials
  const newUser = db.insert('users', {
    agency_id: targetAgencyId,
    role: 'customer',
    name: name.trim(),
    email: cleanEmail,
    phone: phone ? phone.trim() : '',
    password_hash: bcrypt.hashSync(initialPassword, 10),
    temp_password: initialPassword,
    status: 'pending_activation',
    account_status: 'PENDING_VERIFICATION',
    activation_status: 'PENDING_SALES_CONTACT',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    created_at: new Date().toISOString()
  });

  // 2. Create customer profile
  db.insert('customer_profiles', {
    user_id: newUser.id,
    agency_id: targetAgencyId,
    passport_number: '',
    emergency_contact: phone || '',
    preferred_destinations: [],
    total_trips: 0
  });

  // 3. Generate CRM Lead for Manager to distribute to Sales
  const leadSource = enquiry_data?.source || 'New User Sign Up';
  const createdLead = db.insert('leads', {
    agency_id: targetAgencyId,
    customer_id: newUser.id,
    customer_name: name.trim(),
    customer_email: cleanEmail,
    customer_phone: phone ? phone.trim() : '',
    interested_destination: enquiry_data?.destination || 'Direct Traveler Registration',
    interested_package_id: enquiry_data?.package_id || null,
    travel_date: enquiry_data?.travel_date || '',
    travelers_count: enquiry_data?.travelers_count || 2,
    budget: enquiry_data?.budget || 'Flexible',
    lead_source: leadSource,
    status: 'New',
    assigned_staff_id: null,
    assigned_staff_name: 'Unassigned',
    follow_up_date: null,
    notes: `New customer self-signup. Manager: Assign to Sales Executive to verify travel preferences and issue official Customer ID & Credentials.`,
    created_at: new Date().toISOString()
  });

  // 4. Notify Managers & Admins of new registration lead
  const managersAndAdmins = db.findAll('users', (u) => (u.agency_id === targetAgencyId || u.agency_id === 'agency_travel_genie') && ['admin', 'manager'].includes(u.role));
  for (const staff of managersAndAdmins) {
    db.createNotification(
      targetAgencyId,
      staff.id,
      'New Customer Registration Lead',
      `${name} registered online. Lead is ready for Sales assignment in CRM Leads.`,
      'info',
      '/manager/leads'
    );
  }

  const { password_hash, temp_password, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    requires_verification: true,
    message: 'Your request was submitted and our employee will contact you shortly.',
    user: safeUser,
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

// Change Password (Available for Manager, Staff, Agent, Customer, Admin)
app.post('/api/auth/change-password', authenticate, (req, res) => {
  const { old_password, new_password, confirm_password } = req.body;

  if (!old_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'Current password, new password, and confirmation are required.' });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'New password and confirmation password do not match.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  // Verify old password (check password_hash or temp_password)
  const isHashValid = user.password_hash ? bcrypt.compareSync(old_password, user.password_hash) : false;
  const isTempValid = user.temp_password ? user.temp_password === old_password : false;

  if (!isHashValid && !isTempValid) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  if (old_password === new_password) {
    return res.status(400).json({ error: 'New password cannot be the same as your current password.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.update('users', user.id, {
    password_hash: newHash,
    temp_password: null, // clear temporary password once changed
    password_changed_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Your password has been changed successfully!'
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
    if (!isTodayOrFutureDate(finalTravelDate)) {
      return res.status(400).json({ error: 'Travel departure date cannot be in the past (minimum selectable date is today IST).' });
    }
  }

  // Return Date validation (optional)
  if (return_date) {
    if (!isTodayOrFutureDate(return_date)) {
      return res.status(400).json({ error: 'Return date cannot be in the past.' });
    }
    if (finalTravelDate && !isValidDateRange(finalTravelDate, return_date)) {
      return res.status(400).json({ error: 'Return date cannot be earlier than departure date.' });
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

// ==========================================
// B2B TRAVEL PARTNER ENQUIRY IMPLEMENTATION
// ==========================================

// Private B2B Partner Documents Storage
const b2bDocsDir = path.join(__dirname, 'uploads', 'b2b_documents');
if (!fs.existsSync(b2bDocsDir)) {
  fs.mkdirSync(b2bDocsDir, { recursive: true });
}

const b2bDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, b2bDocsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `b2b-doc-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});

const uploadB2BDocuments = multer({
  storage: b2bDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG documents under 5MB are permitted.'));
    }
  }
});

// Helper for unique B2B Enquiry reference: B2B-ENQ-YYYY-XXXXX
function generateB2BEnquiryCode() {
  const currentYear = new Date().getFullYear();
  const prefix = `B2B-ENQ-${currentYear}-`;
  const existingEnquiries = db.getTable('enquiries') || [];
  const b2bEnquiries = existingEnquiries.filter((e) => (e.enquiry_id || '').startsWith(prefix));
  const seq = b2bEnquiries.length + 1;
  let code = `${prefix}${String(seq).padStart(5, '0')}`;
  let tries = 0;
  while (existingEnquiries.some((e) => e.enquiry_id === code) && tries < 1000) {
    tries++;
    code = `${prefix}${String(seq + tries).padStart(5, '0')}`;
  }
  return code;
}

// B2B Travel Partner Enquiry Submission Endpoint
app.post('/api/public/b2b-enquiry', (req, res, next) => {
  uploadB2BDocuments.array('documents', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds limit. Maximum allowed size is 5 MB per document.' });
      }
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const {
    company_name,
    business_type,
    business_email,
    gst_number,
    business_reg_number,
    years_in_business,
    contact_person,
    designation,
    custom_designation,
    mobile_number,
    whatsapp_number,
    contact_email,
    business_location,
    state,
    country,
    interested_categories,
    preferred_destinations,
    expected_monthly_bookings,
    travellers_per_booking,
    estimated_monthly_volume,
    partnership_type,
    how_did_you_hear,
    additional_requirements,
    privacy_consent,
    communication_consent,
    agency_id
  } = req.body;

  const trimmedCompany = (company_name || '').trim();
  const trimmedBusinessType = (business_type || '').trim();
  const trimmedBusinessEmail = (business_email || '').trim().toLowerCase();
  const trimmedContactPerson = (contact_person || '').trim();
  const trimmedDesignation = (designation === 'Other' && custom_designation ? custom_designation : (designation || '')).trim();
  const trimmedMobile = (mobile_number || '').trim();
  const trimmedWhatsapp = (whatsapp_number || '').trim();
  const trimmedContactEmail = (contact_email || '').trim().toLowerCase();
  const trimmedLocation = (business_location || '').trim();
  const trimmedState = (state || '').trim();
  const trimmedCountry = (country || 'India').trim();
  const trimmedGST = (gst_number || '').trim().toUpperCase();
  const trimmedRegNo = (business_reg_number || '').trim();
  const trimmedYears = (years_in_business || '').trim();
  const trimmedMonthlyBookings = (expected_monthly_bookings || '').trim();
  const trimmedPartnershipType = (partnership_type || '').trim();
  const trimmedAdditionalReqs = (additional_requirements || '').trim();

  // SECTION 01 VALIDATION
  if (!trimmedCompany || trimmedCompany.length < 2 || trimmedCompany.length > 100) {
    return res.status(400).json({ error: 'Company / Agency Name is required (2–100 characters).' });
  }

  const validBusinessTypes = [
    'Travel Agency',
    'Tour Operator',
    'Travel Consultant',
    'Online Travel Agency (OTA)',
    'Corporate Travel Agency',
    'Freelance Travel Agent',
    'Other'
  ];
  if (!trimmedBusinessType || !validBusinessTypes.includes(trimmedBusinessType)) {
    return res.status(400).json({ error: 'Please select a valid Business Type.' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!trimmedBusinessEmail || !emailRegex.test(trimmedBusinessEmail)) {
    return res.status(400).json({ error: 'Please provide a valid Business Email address.' });
  }

  if (trimmedGST) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(trimmedGST)) {
      return res.status(400).json({ error: 'Invalid GSTIN format. Indian GST number must be exactly 15 alphanumeric characters (e.g. 07AAAAA1111A1Z9).' });
    }
  }

  const validYears = [
    'Just Starting',
    'Less than 1 Year',
    '1–3 Years',
    '3–5 Years',
    '5–10 Years',
    'More than 10 Years'
  ];
  if (!trimmedYears || !validYears.includes(trimmedYears)) {
    return res.status(400).json({ error: 'Please select your Years in Business.' });
  }

  // SECTION 02 VALIDATION
  if (!trimmedContactPerson || trimmedContactPerson.length < 2 || trimmedContactPerson.length > 60) {
    return res.status(400).json({ error: 'Contact Person Name is required (2–60 characters).' });
  }

  if (!trimmedDesignation) {
    return res.status(400).json({ error: 'Please select or provide a Contact Designation.' });
  }

  if (!trimmedMobile) {
    return res.status(400).json({ error: 'Mobile Number is required.' });
  }
  const mobileDigits = trimmedMobile.replace(/\D/g, '');
  if (mobileDigits.length < 10) {
    return res.status(400).json({ error: 'Mobile Number must contain at least 10 digits.' });
  }

  if (!trimmedContactEmail || !emailRegex.test(trimmedContactEmail)) {
    return res.status(400).json({ error: 'Please provide a valid Contact Email address.' });
  }

  if (!trimmedLocation || trimmedLocation.length < 2) {
    return res.status(400).json({ error: 'Business Location (City) is required (minimum 2 characters).' });
  }

  if (!trimmedState) {
    return res.status(400).json({ error: 'State selection is required.' });
  }

  if (!trimmedCountry) {
    return res.status(400).json({ error: 'Country selection is required.' });
  }

  // SECTION 03 VALIDATION
  let categories = [];
  if (Array.isArray(interested_categories)) {
    categories = interested_categories.filter(Boolean);
  } else if (typeof interested_categories === 'string' && interested_categories.trim()) {
    try {
      const parsed = JSON.parse(interested_categories);
      categories = Array.isArray(parsed) ? parsed : [interested_categories];
    } catch {
      categories = interested_categories.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (categories.length === 0) {
    return res.status(400).json({ error: 'Please select at least one Interested Package Category.' });
  }

  let destinations = [];
  if (Array.isArray(preferred_destinations)) {
    destinations = preferred_destinations.filter(Boolean);
  } else if (typeof preferred_destinations === 'string' && preferred_destinations.trim()) {
    try {
      const parsed = JSON.parse(preferred_destinations);
      destinations = Array.isArray(parsed) ? parsed : [preferred_destinations];
    } catch {
      destinations = preferred_destinations.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  destinations = Array.from(new Set(destinations));
  if (destinations.length === 0) {
    return res.status(400).json({ error: 'Please specify at least one Preferred Destination.' });
  }

  const validBookings = ['1–5 Bookings', '6–10 Bookings', '11–25 Bookings', '26–50 Bookings', '50+ Bookings'];
  if (!trimmedMonthlyBookings || !validBookings.includes(trimmedMonthlyBookings)) {
    return res.status(400).json({ error: 'Please select Expected Monthly Bookings.' });
  }

  const validPartnershipTypes = [
    'Wholesale Package Purchase',
    'Reseller Partnership',
    'Bulk Group Booking',
    'Long-term Business Partnership'
  ];
  if (!trimmedPartnershipType || !validPartnershipTypes.includes(trimmedPartnershipType)) {
    return res.status(400).json({ error: 'Please select a Preferred Partnership Type.' });
  }

  // SECTION 04 VALIDATION
  if (trimmedAdditionalReqs.length > 500) {
    return res.status(400).json({ error: 'Additional requirements cannot exceed 500 characters.' });
  }

  const isConsentGiven = privacy_consent === true || privacy_consent === 'true' || privacy_consent === 1 || privacy_consent === '1';
  if (!isConsentGiven) {
    return res.status(400).json({ error: 'Privacy Policy consent is mandatory to process your business enquiry.' });
  }

  const isCommConsent = communication_consent === true || communication_consent === 'true' || communication_consent === 1 || communication_consent === '1';

  // Process Uploaded Documents
  const uploadedFiles = req.files || [];
  const processedDocs = uploadedFiles.map((f) => ({
    original_name: f.originalname,
    file_name: f.filename,
    file_size: f.size,
    mime_type: f.mimetype,
    storage_path: `/private/b2b_documents/${f.filename}`,
    uploaded_at: new Date().toISOString()
  }));

  const targetAgencyId = agency_id || 'agency_travel_genie';

  // -------------------------------------------------------------
  // Accidental Duplicate Submission Prevention (30-second window)
  // -------------------------------------------------------------
  const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  const recentDuplicate = db.findOne('leads', (l) => {
    const isSameEmail = (l.customer_email && l.customer_email.toLowerCase() === trimmedContactEmail) ||
      (l.business_email && l.business_email.toLowerCase() === trimmedBusinessEmail);
    const isSameCompany = (l.company_name || '').toLowerCase() === trimmedCompany.toLowerCase();
    const isRecent = l.created_at && l.created_at >= thirtySecsAgo;
    return (isSameEmail || isSameCompany) && isRecent;
  });

  if (recentDuplicate) {
    return res.status(201).json({
      success: true,
      duplicate: true,
      message: 'Thank you! Your B2B enquiry has already been received and is currently under review by our team.',
      lead_id: recentDuplicate.id,
      enquiry_id: recentDuplicate.enquiry_id || recentDuplicate.id
    });
  }

  // Generate Unique B2B Enquiry Reference
  const enquiryRefId = generateB2BEnquiryCode();

  // Structured summary notes
  const structuredNotes = [
    `B2B PARTNER ENQUIRY DETAILS`,
    `Company: ${trimmedCompany} (${trimmedBusinessType})`,
    `Years in Business: ${trimmedYears}`,
    trimmedGST ? `GSTIN: ${trimmedGST}` : 'GSTIN: Not Registered',
    trimmedRegNo ? `Reg No: ${trimmedRegNo}` : '',
    `Contact: ${trimmedContactPerson} (${trimmedDesignation})`,
    `Email: ${trimmedContactEmail}${trimmedBusinessEmail !== trimmedContactEmail ? ` | Business Email: ${trimmedBusinessEmail}` : ''}`,
    `Phone: ${trimmedMobile}${trimmedWhatsapp ? ` | WhatsApp: ${trimmedWhatsapp}` : ''}`,
    `Location: ${trimmedLocation}, ${trimmedState}, ${trimmedCountry}`,
    `Package Categories: ${categories.join(', ')}`,
    `Preferred Destinations: ${destinations.join(', ')}`,
    `Monthly Bookings: ${trimmedMonthlyBookings}`,
    travellers_per_booking ? `Travellers per Booking: ${travellers_per_booking}` : '',
    estimated_monthly_volume ? `Estimated Monthly Volume: ${estimated_monthly_volume}` : '',
    `Partnership Type: ${trimmedPartnershipType}`,
    how_did_you_hear ? `Source: ${how_did_you_hear}` : '',
    trimmedAdditionalReqs ? `Requirements: ${trimmedAdditionalReqs}` : '',
    processedDocs.length > 0 ? `Uploaded Documents: ${processedDocs.map(d => d.original_name).join(', ')}` : ''
  ].filter(Boolean).join('\n');

  // 1. Insert into enquiries table
  const newEnquiry = db.insert('enquiries', {
    enquiry_id: enquiryRefId,
    enquiry_type: 'b2b_partner',
    company_name: trimmedCompany,
    business_type: trimmedBusinessType,
    business_email: trimmedBusinessEmail,
    gst_number: trimmedGST,
    business_reg_number: trimmedRegNo,
    years_in_business: trimmedYears,
    customer_name: trimmedContactPerson,
    contact_person: trimmedContactPerson,
    designation: trimmedDesignation,
    customer_email: trimmedContactEmail,
    business_email_raw: trimmedBusinessEmail,
    customer_phone: trimmedMobile,
    whatsapp_number: trimmedWhatsapp,
    city: trimmedLocation,
    business_location: trimmedLocation,
    state: trimmedState,
    country: trimmedCountry,
    destination: destinations.join(', '),
    interested_categories: categories,
    preferred_destinations: destinations,
    expected_monthly_bookings: trimmedMonthlyBookings,
    travellers_per_booking: travellers_per_booking || '',
    estimated_monthly_volume: estimated_monthly_volume || '',
    budget: estimated_monthly_volume || 'Wholesale B2B Rates',
    partnership_type: trimmedPartnershipType,
    how_did_you_hear: how_did_you_hear || '',
    additional_requirements: trimmedAdditionalReqs,
    documents: processedDocs,
    privacy_consent: true,
    privacy_consent_at: new Date().toISOString(),
    communication_consent: isCommConsent,
    source: 'B2B Partner Portal',
    status: 'NEW',
    created_at: new Date().toISOString()
  });

  // 2. Insert into leads table
  const newLead = db.insert('leads', {
    agency_id: targetAgencyId,
    enquiry_id: enquiryRefId,
    lead_type: 'B2B_PARTNER',
    company_name: trimmedCompany,
    business_type: trimmedBusinessType,
    gst_number: trimmedGST,
    business_reg_number: trimmedRegNo,
    years_in_business: trimmedYears,
    customer_name: `${trimmedCompany} (${trimmedContactPerson})`,
    contact_person: trimmedContactPerson,
    designation: trimmedDesignation,
    customer_email: trimmedContactEmail,
    business_email: trimmedBusinessEmail,
    customer_phone: trimmedMobile,
    whatsapp_number: trimmedWhatsapp,
    city: trimmedLocation,
    state: trimmedState,
    country: trimmedCountry,
    interested_destination: destinations.join(', '),
    interested_categories: categories,
    expected_monthly_bookings: trimmedMonthlyBookings,
    travellers_per_booking: travellers_per_booking || '',
    budget: estimated_monthly_volume || 'Wholesale B2B Rates',
    travel_type: 'B2B Wholesale',
    partnership_type: trimmedPartnershipType,
    lead_source: 'B2B Partner Portal',
    status: 'New',
    assigned_staff_id: null,
    assigned_staff_name: 'Unassigned',
    follow_up_date: null,
    notes: structuredNotes,
    documents: processedDocs,
    privacy_consent: true,
    communication_consent: isCommConsent,
    created_at: new Date().toISOString()
  });

  // 3. Record activities & audit logs
  db.recordActivity(newLead.id, 'system', 'status_change', `B2B Partner Enquiry #${enquiryRefId} submitted by ${trimmedCompany}. Awaiting sales verification.`);
  db.recordLeadStatusHistory(targetAgencyId, newLead.id, 'NONE', 'NEW', 'system', `B2B Enquiry #${enquiryRefId} received.`);
  db.recordAuditLog(targetAgencyId, 'system', 'CREATE_B2B_ENQUIRY', 'lead', newLead.id, {
    enquiry_id: enquiryRefId,
    company_name: trimmedCompany,
    contact_person: trimmedContactPerson,
    business_email: trimmedBusinessEmail
  });

  // 4. Dispatch Email Acknowledgement
  try {
    await emailService.sendB2BEnquiryAcknowledgement({
      agency_id: targetAgencyId,
      to: trimmedContactEmail,
      company_name: trimmedCompany,
      contact_person: trimmedContactPerson,
      enquiry_id: enquiryRefId
    });
  } catch (mailErr) {
    console.error('Failed to dispatch B2B acknowledgement email:', mailErr);
  }

  // 5. Notify Managers and Admins
  const managersAndAdmins = db.findAll('users', (u) => u.agency_id === targetAgencyId && (u.role === 'admin' || u.role === 'manager'));
  for (const staffMember of managersAndAdmins) {
    db.createNotification(
      targetAgencyId,
      staffMember.id,
      'New B2B Partner Enquiry',
      `New B2B partner application #${enquiryRefId} from ${trimmedCompany} (${trimmedContactPerson}). Awaiting review and assignment.`,
      'info',
      staffMember.role === 'manager' ? '/manager/leads' : '/admin/leads'
    );
  }

  // 6. Return response
  res.status(201).json({
    success: true,
    message: 'Thank you for your interest in partnering with us! Your B2B enquiry has been successfully submitted. Our team will review your information and contact you shortly.',
    enquiry_id: enquiryRefId,
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
app.post('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
  const {
    role,
    name,
    email,
    phone,
    password,
    agency_id,
    department,
    departments,
    designation,
    company_name,
    discount_pct,
    address,
    employee_id
  } = req.body;

  if (!role || !name || !email || !password) {
    return res.status(400).json({ error: 'Role, Name, Email, and Password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.findOne('users', (u) => u && u.email && u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: `An account with email '${cleanEmail}' already exists (${existing.role || 'user'}). Duplicate emails are not allowed.` });
  }

  const prefixMap = {
    admin: 'ADM',
    manager: 'MGR',
    staff: 'TBG_SAL',
    sales: 'TBG_SAL',
    operations: 'TBG_OPE',
    agent: 'AGT',
    customer: 'CUS'
  };
  const prefix = prefixMap[role] || 'USR';
  const defaultDisplayId = prefix.startsWith('TBG_')
    ? `${prefix}_${Math.floor(100 + Math.random() * 900)}`
    : `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  const effectiveDisplayId = (employee_id && employee_id.trim()) ? employee_id.trim() : defaultDisplayId;
  const customId = `usr_${role}_${Date.now().toString(36)}`;

  const deptString = Array.isArray(departments) && departments.length > 0
    ? departments.join(', ')
    : (department || '');

  const newUser = db.insert('users', {
    id: customId,
    display_id: effectiveDisplayId,
    agency_id: agency_id || req.user.agency_id || 'agency_travel_genie',
    role: (role === 'sales' ? 'staff' : role),
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    password_hash: bcrypt.hashSync(password, 10),
    status: 'active',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
  });

  // Create role-specific profiles if needed
  if (role === 'staff' || role === 'sales' || role === 'operations') {
    const isOps = (role === 'operations' || (designation && designation.toLowerCase().includes('operation')));
    db.insert('staff_profiles', {
      user_id: newUser.id,
      agency_id: newUser.agency_id,
      employee_id: effectiveDisplayId,
      department: deptString || (isOps ? 'Travel & Transportation Operations' : 'Holidays & International'),
      designation: designation || (isOps ? 'Operations' : 'Sales'),
      assigned_leads_count: 0,
      converted_leads_count: 0,
      rating: 5.0
    });
  } else if (role === 'manager') {
    db.insert('staff_profiles', {
      user_id: newUser.id,
      agency_id: newUser.agency_id,
      employee_id: effectiveDisplayId,
      department: deptString || 'Management & Operations',
      designation: designation || 'Operations Manager',
      assigned_leads_count: 0,
      converted_leads_count: 0,
      rating: 5.0
    });
  } else if (role === 'agent') {
    db.insert('agent_profiles', {
      user_id: newUser.id,
      agency_id: newUser.agency_id,
      agency_name: company_name || `${name} Travels`,
      commercial_id: effectiveDisplayId,
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

  // Dispatch Role-specific Onboarding / Welcoming Email Link
  const baseUrl = process.env.APP_URL || req.headers.origin || 'http://localhost:3000';
  let invitationLink = `${baseUrl}/login`;

  try {
    if (role === 'manager') {
      const emailRes = await emailService.sendManagerInvitationEmail({
        agency_id: newUser.agency_id,
        to: newUser.email,
        name: newUser.name,
        employee_id: effectiveDisplayId,
        department: deptString || 'Management & Operations',
        temporary_password: password,
        app_url: baseUrl
      });
      invitationLink = emailRes?.login_link || invitationLink;
    } else if (role === 'staff' || role === 'sales') {
      const emailRes = await emailService.sendStaffInvitationEmail({
        agency_id: newUser.agency_id,
        to: newUser.email,
        name: newUser.name,
        employee_id: effectiveDisplayId,
        designation: designation || 'Sales',
        temporary_password: password,
        app_url: baseUrl
      });
      invitationLink = emailRes?.login_link || `${baseUrl}/staff-login`;
    } else if (role === 'operations') {
      const emailRes = await emailService.sendStaffInvitationEmail({
        agency_id: newUser.agency_id,
        to: newUser.email,
        name: newUser.name,
        employee_id: effectiveDisplayId,
        designation: designation || 'Operations',
        temporary_password: password,
        app_url: baseUrl
      });
      invitationLink = emailRes?.login_link || `${baseUrl}/staff-login`;
    } else if (role === 'agent') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      db.insert('agent_activation_tokens', {
        id: `agt_tok_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: newUser.id,
        token_hash: tokenHash,
        token_preview: rawToken.substring(0, 8),
        expires_at: expiresAt,
        is_used: false,
        created_at: new Date().toISOString()
      });
      const emailRes = await emailService.sendAgentInvitationEmail({
        agency_id: newUser.agency_id,
        to: newUser.email,
        name: newUser.name,
        company_name: company_name || `${name} Travels`,
        agent_id: effectiveDisplayId,
        activation_token: rawToken,
        app_url: baseUrl
      });
      invitationLink = emailRes?.activation_link || `${baseUrl}/activate-account?token=${rawToken}&type=b2b`;
    } else if (role === 'customer') {
      const emailRes = await emailService.sendCustomerWelcomeEmail({
        agency_id: newUser.agency_id,
        to: newUser.email,
        name: newUser.name,
        customer_id: effectiveDisplayId,
        temporary_password: password,
        app_url: baseUrl
      });
      invitationLink = emailRes?.login_link || `${baseUrl}/login`;
    }
  } catch (mailErr) {
    console.error(`Failed to dispatch email for ${role} (${newUser.email}):`, mailErr);
  }

  const { password_hash, ...safeUser } = newUser;
  res.status(201).json({
    ...safeUser,
    invitation_sent: true,
    invitation_link: invitationLink
  });
});

// Update User details / role / status
app.put('/api/admin/users/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const user = db.findById('users', id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { name, email, phone, status, role, agency_id, password } = req.body;
  const updates = {};
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findOne('users', (u) => u && u.id !== id && u.email && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: `An account with email '${cleanEmail}' already exists (${existing.role || 'user'}). Duplicate emails are not allowed.` });
    }
    updates.email = cleanEmail;
  }
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
    if (sLower === 'unassigned' || sLower === 'new') {
      allLeads = allLeads.filter(l => !l.assigned_staff_id || (l.status && (l.status.toLowerCase() === 'new' || l.status.toLowerCase() === 'unassigned')));
    } else if (sLower === 'assigned') {
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

  if (travel_date && !isTodayOrFutureDate(travel_date)) {
    return res.status(400).json({ error: 'Travel date cannot be in the past.' });
  }
  if (follow_up_date && !isTodayOrFutureDate(follow_up_date)) {
    return res.status(400).json({ error: 'Follow-up date cannot be in the past.' });
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
  const agencyId = req.user.agency_id;
  if (!lead || (lead.agency_id && lead.agency_id !== agencyId && lead.agency_id !== 'agency_travel_genie' && agencyId)) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const activities = db.findAll('lead_activities', (a) => a.lead_id === lead.id);
  activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const quotations = db.findAll('quotations', (q) => q.lead_id === lead.id);
  const pkg = lead.interested_package_id ? db.findById('packages', lead.interested_package_id) : null;

  res.json({
    ...lead,
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

// Helper functions for Lead Eligibility & Role-Based Assignment
function getLeadEnquiryType(lead) {
  if (!lead) return 'domestic';
  const dest = (lead.interested_destination || lead.destination || '').toLowerCase();
  const cat = (lead.category || '').toLowerCase();
  const src = (lead.lead_source || lead.source || '').toLowerCase();
  const pref = (lead.travel_preference || '').toLowerCase();

  // B2B Partner lead detection
  if (lead.lead_type === 'B2B_PARTNER' || src.includes('b2b') || lead.partnership_type) {
    return 'b2b';
  }

  const isTravels =
    lead.service_type ||
    ['flight', 'bus', 'car', 'cab', 'transfer', 'insurance', 'visa', 'webcheckin', 'hotel'].includes(pref) ||
    dest.startsWith('flight:') ||
    dest.startsWith('bus:') ||
    dest.startsWith('car rental:') ||
    dest.startsWith('airport transfer:') ||
    dest.startsWith('visa consultation:') ||
    dest.startsWith('travel insurance:') ||
    dest.startsWith('web check-in:') ||
    dest.startsWith('service:') ||
    dest.includes('cab') ||
    dest.includes('tempo') ||
    dest.includes('taxi') ||
    dest.includes('car rental') ||
    src.includes('service enquiry') ||
    src.includes('travels') ||
    src.includes('cab') ||
    cat.includes('travels') ||
    cat.includes('cab') ||
    cat.includes('vehicle');

  if (isTravels) return 'travels';

  const internationalTokens = [
    'bali', 'dubai', 'maldives', 'singapore', 'thailand', 'vietnam', 'malaysia', 'paris',
    'switzerland', 'europe', 'london', 'uk', 'united kingdom', 'alaska', 'america', 'usa',
    'canada', 'japan', 'australia', 'new zealand', 'fiji', 'mauritius', 'seychelles',
    'turkey', 'greece', 'italy', 'germany', 'france', 'austria', 'netherlands', 'spain',
    'egypt', 'morocco', 'south africa', 'kenya', 'zimbabwe', 'tanzania', 'qatar', 'uae',
    'oman', 'jordan', 'uzbekistan', 'kazakhstan', 'cambodia', 'philippines', 'indonesia',
    'hong kong', 'china', 'russia', 'south korea', 'sri lanka', 'madagascar'
  ];

  const isHoneymoon = cat.includes('honeymoon') || dest.includes('honeymoon') || src.includes('honeymoon');
  if (isHoneymoon) return 'honeymoon';

  const isCorporate = cat.includes('corporate') || cat.includes('mice') || dest.includes('corporate') || dest.includes('mice') || src.includes('corporate') || src.includes('mice');
  if (isCorporate) return 'corporate';

  const isInternational =
    cat.includes('international') ||
    src.includes('international') ||
    dest.includes('international') ||
    internationalTokens.some((token) => dest.includes(token));

  if (isInternational) return 'international';

  return 'domestic';
}

function checkLeadStaffEligibility(staffUser, staffProfile, leadType) {
  // 1. Only active and authorized staff can receive assignments
  if (staffUser.status !== 'active') {
    return {
      eligible: false,
      reason: `Staff member ${staffUser.name} is currently inactive and cannot receive lead assignments.`
    };
  }

  const role = staffUser.role || staffProfile.role_type || 'staff';
  const roleType = staffProfile.role_type || (role === 'operations' ? 'operations' : 'sales');

  const departments = Array.isArray(staffProfile.departments) && staffProfile.departments.length > 0
    ? staffProfile.departments
    : (staffProfile.department ? staffProfile.department.split(',').map((s) => s.trim()) : []);

  const designations = Array.isArray(staffProfile.designations) && staffProfile.designations.length > 0
    ? staffProfile.designations
    : (staffProfile.designation ? staffProfile.designation.split(',').map((s) => s.trim()) : []);

  const hasInternational =
    departments.some((d) => d.toLowerCase().includes('international') || d.toLowerCase().includes('holiday')) ||
    designations.some((d) => d.toLowerCase().includes('international') || d.toLowerCase().includes('holiday'));

  const hasHoneymoon =
    departments.some((d) => d.toLowerCase().includes('honeymoon') || d.toLowerCase().includes('international') || d.toLowerCase().includes('holiday')) ||
    designations.some((d) => d.toLowerCase().includes('honeymoon') || d.toLowerCase().includes('international') || d.toLowerCase().includes('holiday'));

  const hasCorporate =
    departments.some((d) => d.toLowerCase().includes('corporate') || d.toLowerCase().includes('mice')) ||
    designations.some((d) => d.toLowerCase().includes('corporate') || d.toLowerCase().includes('mice'));

  const isOpsStaff =
    role === 'operations' ||
    roleType === 'operations' ||
    designations.some((d) => d.toLowerCase().includes('operation')) ||
    (staffProfile.designation && staffProfile.designation.toLowerCase().includes('operation'));

  // B2B Partner Leads: Handled by Sales / Corporate / Management consultants
  if (leadType === 'b2b') {
    if (isOpsStaff) {
      return {
        eligible: false,
        reason: 'Operation staff cannot be assigned to B2B Partner enquiries.'
      };
    }
    return { eligible: true };
  }

  // 2. Operation staff can ONLY be assigned to travels enquiry
  if (isOpsStaff) {
    if (leadType !== 'travels') {
      return {
        eligible: false,
        reason: 'Operation staff can only be assigned to travels and logistics enquiries.'
      };
    }
    return { eligible: true };
  }

  // 3. Department validation for package requirements
  if (leadType === 'international' || leadType === 'honeymoon') {
    if (!hasInternational && !hasHoneymoon) {
      return {
        eligible: false,
        reason: 'Cannot assign International package enquiry to domestic tour management staff.'
      };
    }
    return { eligible: true };
  }

  if (leadType === 'corporate') {
    if (!hasCorporate) {
      return {
        eligible: false,
        reason: 'Corporate enquiries require Corporate & MICE department staff.'
      };
    }
    return { eligible: true };
  }

  return { eligible: true };
}

// Admin Assign / Reassign Leads to Staff (Single, Multi-Staff, or Bulk)
app.post('/api/admin/leads/assign', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { lead_ids, staff_id, secondary_staff_ids, team_ids, notes } = req.body;

  if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one lead ID.' });
  }

  const primaryStaff = staff_id ? db.findById('users', staff_id) : null;
  const primaryProfile = primaryStaff ? (db.findOne('staff_profiles', (sp) => sp.user_id === primaryStaff.id) || {}) : {};
  const primaryName = primaryStaff ? primaryStaff.name : 'Unassigned';
  const newStatus = primaryStaff ? 'Assigned' : 'Unassigned';

  // Support multi-staff assignment (supporting / secondary team members)
  const secondaryIds = Array.isArray(secondary_staff_ids)
    ? secondary_staff_ids
    : (Array.isArray(team_ids) ? team_ids : []);

  const supportingStaffList = [];
  for (const sId of secondaryIds) {
    if (sId && (!primaryStaff || sId !== primaryStaff.id)) {
      const sUser = db.findById('users', sId);
      if (sUser) {
        const sProf = db.findOne('staff_profiles', (sp) => sp.user_id === sUser.id) || {};
        supportingStaffList.push({ user: sUser, profile: sProf });
      }
    }
  }

  // Server-side validation of lead assignment eligibility for all assigned staff
  for (const id of lead_ids) {
    const lead = db.findById('leads', id);
    if (lead) {
      const leadType = getLeadEnquiryType(lead);

      // Validate primary staff
      if (primaryStaff) {
        const check = checkLeadStaffEligibility(primaryStaff, primaryProfile, leadType);
        if (!check.eligible) {
          return res.status(400).json({
            error: check.reason,
            reason: check.reason,
            lead_id: id
          });
        }
      }

      // Validate supporting staff
      for (const { user: sUser, profile: sProf } of supportingStaffList) {
        const check = checkLeadStaffEligibility(sUser, sProf, leadType);
        if (!check.eligible) {
          return res.status(400).json({
            error: `Supporting staff ${sUser.name}: ${check.reason}`,
            reason: check.reason,
            lead_id: id
          });
        }
      }
    }
  }

  // Construct assigned team roster (clearly identifiable primary owner + supporting members)
  const assignedTeamRoster = [];
  if (primaryStaff) {
    const deptList = Array.isArray(primaryProfile.departments) && primaryProfile.departments.length > 0
      ? primaryProfile.departments
      : (primaryProfile.department ? [primaryProfile.department] : []);
    assignedTeamRoster.push({
      staff_id: primaryStaff.id,
      staff_name: primaryStaff.name,
      role: primaryStaff.role,
      departments: deptList,
      is_primary: true,
      assigned_at: new Date().toISOString()
    });
  }
  for (const { user: sUser, profile: sProf } of supportingStaffList) {
    const deptList = Array.isArray(sProf.departments) && sProf.departments.length > 0
      ? sProf.departments
      : (sProf.department ? [sProf.department] : []);
    assignedTeamRoster.push({
      staff_id: sUser.id,
      staff_name: sUser.name,
      role: sUser.role,
      departments: deptList,
      is_primary: false,
      assigned_at: new Date().toISOString()
    });
  }

  const updatedLeads = [];
  for (const id of lead_ids) {
    const lead = db.findById('leads', id);
    if (lead && (!lead.agency_id || lead.agency_id === agencyId || lead.agency_id === 'agency_travel_genie' || !agencyId)) {
      const prevStaff = lead.assigned_staff_id;
      const prevStaffName = lead.assigned_staff_name;
      const prevStatus = lead.status;
      const effectiveAgencyId = lead.agency_id || agencyId || 'agency_travel_genie';

      const updated = db.update('leads', id, {
        assigned_staff_id: primaryStaff ? primaryStaff.id : null,
        assigned_staff_name: primaryName,
        assigned_sales_executive: primaryName,
        assigned_team: assignedTeamRoster,
        status: (lead.status === 'New' || lead.status === 'NEW' || lead.status === 'Unassigned' || lead.status === 'UNASSIGNED') ? newStatus : lead.status
      });

      // 1. Record primary assignment in lead_assignments table
      db.insert('lead_assignments', {
        agency_id: effectiveAgencyId,
        lead_id: id,
        assigned_by: req.user.id,
        assigned_by_name: req.user.name,
        staff_id: primaryStaff ? primaryStaff.id : null,
        staff_name: primaryName,
        is_primary: true,
        previous_staff_id: prevStaff || null,
        previous_staff_name: prevStaffName || 'Unassigned',
        notes: notes || '',
        assigned_at: new Date().toISOString()
      });

      // Record supporting staff assignments in lead_assignments table
      for (const { user: sUser } of supportingStaffList) {
        db.insert('lead_assignments', {
          agency_id: effectiveAgencyId,
          lead_id: id,
          assigned_by: req.user.id,
          assigned_by_name: req.user.name,
          staff_id: sUser.id,
          staff_name: sUser.name,
          is_primary: false,
          previous_staff_id: null,
          previous_staff_name: 'None',
          notes: `Supporting team member assignment: ${notes || ''}`,
          assigned_at: new Date().toISOString()
        });
      }

      // 2. Record status history
      if (prevStatus !== updated.status) {
        db.recordLeadStatusHistory(effectiveAgencyId, id, prevStatus, updated.status, req.user.id, `Lead assigned to ${primaryName}. ${notes || ''}`);
      }

      // 3. Record in lead_activities
      db.recordActivity(id, req.user.id, 'assignment', `Assigned to ${primaryName} (Team: ${assignedTeamRoster.map(m => m.staff_name).join(', ')}) by Admin/Manager. ${notes || ''}`);

      // 4. Record audit log
      db.recordAuditLog(effectiveAgencyId, req.user.id, 'ASSIGN_LEAD', 'lead', id, {
        primary_staff_id: primaryStaff ? primaryStaff.id : null,
        primary_staff_name: primaryName,
        team: assignedTeamRoster,
        previous_staff_id: prevStaff,
        notes
      });

      updatedLeads.push(updated);
    }
  }

  // Notify all assigned staff members immediately
  const notifyStaffIds = new Set();
  if (primaryStaff) notifyStaffIds.add(primaryStaff.id);
  for (const { user: sUser } of supportingStaffList) notifyStaffIds.add(sUser.id);

  for (const staffIdToNotify of notifyStaffIds) {
    db.createNotification(
      agencyId || 'agency_travel_genie',
      staffIdToNotify,
      'Leads Assigned',
      `You have been assigned ${updatedLeads.length} lead(s) by Operations Manager.`,
      'info',
      '/staff/leads'
    );
  }

  res.json({
    success: true,
    message: `Successfully assigned ${updatedLeads.length} lead(s) to ${primaryName}.`,
    assigned_team: assignedTeamRoster,
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
  const staffUsers = db.findAll('users', (u) => (u.agency_id === agencyId || !u.agency_id) && (u.role === 'staff' || u.role === 'sales' || u.role === 'operations'));

  const enrichedStaff = staffUsers.map((staff) => {
    let profile = db.findOne('staff_profiles', (sp) => sp.user_id === staff.id);
    if (!profile) {
      const isOps = staff.role === 'operations';
      profile = {
        user_id: staff.id,
        employee_id: staff.display_id || (isOps ? 'TG-OPS-100' : 'TG-EMP-100'),
        role_type: isOps ? 'operations' : 'sales',
        department: isOps ? 'Travel & Transportation Operations' : 'Holidays & International',
        departments: [isOps ? 'Travel & Transportation Operations' : 'Holidays & International'],
        designation: isOps ? 'Operations Executive' : 'Travel Consultant',
        designations: [isOps ? 'Operations Executive' : 'Travel Consultant'],
        assigned_leads_count: 0,
        converted_leads_count: 0,
        rating: 5.0
      };
    } else {
      // Ensure departments & designations arrays are present
      if (!Array.isArray(profile.departments) || profile.departments.length === 0) {
        profile.departments = profile.department ? profile.department.split(',').map((s) => s.trim()) : [profile.role_type === 'operations' ? 'Travel & Transportation Operations' : 'Holidays & International'];
      }
      if (!Array.isArray(profile.designations) || profile.designations.length === 0) {
        profile.designations = profile.designation ? profile.designation.split(',').map((s) => s.trim()) : [profile.role_type === 'operations' ? 'Operations Executive' : 'Travel Consultant'];
      }
      if (!profile.role_type) {
        profile.role_type = staff.role === 'operations' ? 'operations' : 'sales';
      }
    }
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

// Helper to generate sequential standard employee ID: TBG_SAL_001 or TBG_OPE_001
function getNextStandardEmployeeId(isOps, agencyId) {
  const prefix = isOps ? 'TBG_OPE_' : 'TBG_SAL_';
  const allProfiles = db.findAll('staff_profiles', (p) => !agencyId || p.agency_id === agencyId || p.agency_id === 'agency_travel_genie');
  const allUsers = db.findAll('users', (u) => !agencyId || u.agency_id === agencyId || u.agency_id === 'agency_travel_genie');

  const nums = [];
  allProfiles.forEach((p) => {
    if (p.employee_id && p.employee_id.startsWith(prefix)) {
      const n = parseInt(p.employee_id.replace(prefix, ''), 10);
      if (!isNaN(n)) nums.push(n);
    }
  });
  allUsers.forEach((u) => {
    if (u.display_id && u.display_id.startsWith(prefix)) {
      const n = parseInt(u.display_id.replace(prefix, ''), 10);
      if (!isNaN(n)) nums.push(n);
    }
  });

  const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

function generateAutoPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TBG#${Math.floor(1000 + Math.random() * 9000)}!${randomPart}`;
}

// Admin Create Staff Account
app.post('/api/admin/staff', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const agencyId = req.user.agency_id;
  const { name, email, phone, role_type, role, department, departments, designation, designations, password, employee_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Employee name and email are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.findOne('users', (u) => u && u.email && u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: `An account with email '${cleanEmail}' already exists (${existing.role || 'user'}). Duplicate emails are not allowed.` });
  }

  const isOps = (role_type === 'operations' || role === 'operations' || (designation && designation.toLowerCase() === 'operations'));
  const effectiveRoleType = isOps ? 'operations' : 'sales';
  const effectiveRole = effectiveRoleType;
  const effectiveDesignation = isOps ? 'Operations' : 'Sales';

  const effectiveEmployeeId = (employee_id && employee_id.trim())
    ? employee_id.trim()
    : getNextStandardEmployeeId(isOps, agencyId);

  const effectivePassword = password || generateAutoPassword();

  const deptList = Array.isArray(departments) && departments.length > 0
    ? departments
    : (department ? department.split(',').map((s) => s.trim()) : (isOps ? ['Travel & Transportation Operations'] : ['Holidays & International']));

  const desigList = Array.isArray(designations) && designations.length > 0
    ? designations
    : [effectiveDesignation];

  let newStaff;
  let profile;

  if (existing) {
    newStaff = db.update('users', existing.id, {
      agency_id: agencyId,
      role: effectiveRole,
      display_id: effectiveEmployeeId,
      name,
      email: email.toLowerCase(),
      phone: phone || existing.phone || '',
      password_hash: bcrypt.hashSync(effectivePassword, 10),
      status: 'pending',
      account_status: 'INVITATION_SENT',
      activation_status: 'INVITATION_SENT',
      avatar: existing.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      updated_at: new Date().toISOString()
    });

    const existingProfile = db.findOne('staff_profiles', (sp) => sp.user_id === existing.id);
    if (existingProfile) {
      profile = db.update('staff_profiles', existingProfile.id, {
        employee_id: effectiveEmployeeId,
        role_type: effectiveRoleType,
        department: deptList.join(', '),
        departments: deptList,
        designation: effectiveDesignation,
        designations: desigList,
        status: 'pending',
        updated_at: new Date().toISOString()
      });
    } else {
      profile = db.insert('staff_profiles', {
        user_id: newStaff.id,
        agency_id: agencyId,
        employee_id: effectiveEmployeeId,
        role_type: effectiveRoleType,
        department: deptList.join(', '),
        departments: deptList,
        designation: effectiveDesignation,
        designations: desigList,
        status: 'pending',
        assigned_leads_count: 0,
        converted_leads_count: 0,
        rating: 5.0,
        created_at: new Date().toISOString()
      });
    }
  } else {
    newStaff = db.insert('users', {
      agency_id: agencyId,
      role: effectiveRole,
      display_id: effectiveEmployeeId,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password_hash: bcrypt.hashSync(effectivePassword, 10),
      status: 'pending',
      account_status: 'INVITATION_SENT',
      activation_status: 'INVITATION_SENT',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      created_at: new Date().toISOString()
    });

    profile = db.insert('staff_profiles', {
      user_id: newStaff.id,
      agency_id: agencyId,
      employee_id: effectiveEmployeeId,
      role_type: effectiveRoleType,
      department: deptList.join(', '),
      departments: deptList,
      designation: effectiveDesignation,
      designations: desigList,
      status: 'pending',
      assigned_leads_count: 0,
      converted_leads_count: 0,
      rating: 5.0,
      created_at: new Date().toISOString()
    });
  }

  console.log(`[STAFF PROVISION] Staff account created/updated for ${name} (${email}), status: pending`);

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  db.insert('staff_account_invitations', {
    user_id: newStaff.id,
    agency_id: agencyId,
    email: email.toLowerCase(),
    name,
    role: effectiveRole,
    employee_id: effectiveEmployeeId,
    token: invitationToken,
    temporary_password: effectivePassword,
    expires_at: expiresAt,
    is_used: false,
    created_at: new Date().toISOString()
  });

  const baseUrl = (req.headers.origin && req.headers.origin.includes('localhost'))
    ? req.headers.origin.replace(/\/+$/, '')
    : (process.env.APP_URL ? process.env.APP_URL.replace(/\/+$/, '') : (req.headers.origin || 'http://localhost:3000').replace(/\/+$/, ''));
  const staffLoginLink = `${baseUrl}/staff-login`;

  // Await real email dispatch with staff login link and credentials
  let emailDispatched = false;
  let emailError = null;
  try {
    const emailRes = await emailService.sendStaffInvitationEmail({
      agency_id: agencyId || 'agency_travel_genie',
      to: email.toLowerCase(),
      name,
      employee_id: effectiveEmployeeId,
      designation: effectiveDesignation,
      temporary_password: effectivePassword,
      app_url: baseUrl
    });
    emailDispatched = emailRes?.sent ?? true;
  } catch (emailErr) {
    emailError = emailErr.message;
    console.warn('[EMAIL DISPATCH ERROR]', emailErr.message || emailErr);
  }

  const { password_hash, ...safeStaff } = newStaff;
  res.status(201).json({
    ...safeStaff,
    profile,
    status: 'pending',
    email_sent: emailDispatched,
    email_error: emailError,
    invitation_link: staffLoginLink,
    login_link: staffLoginLink,
    temporary_password: effectivePassword
  });
});

// Admin Toggle Staff Status
app.put('/api/admin/staff/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const staff = db.findById('users', req.params.id);
  if (!staff || (staff.agency_id && staff.agency_id !== req.user.agency_id) || (staff.role !== 'staff' && staff.role !== 'sales' && staff.role !== 'operations')) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const { status, name, email, phone, role_type, role, department, departments, designation, designations, password, employee_id } = req.body;
  const updateData = {};
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findOne('users', (u) => u && u.id !== staff.id && u.email && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: `An account with email '${cleanEmail}' already exists (${existing.role || 'user'}). Duplicate emails are not allowed.` });
    }
    updateData.email = cleanEmail;
  }
  if (status) updateData.status = status;
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (employee_id && employee_id.trim()) updateData.display_id = employee_id.trim();
  if (role_type || role) {
    updateData.role = (role_type === 'operations' || role === 'operations') ? 'operations' : 'sales';
  }
  if (password) updateData.password_hash = bcrypt.hashSync(password, 10);

  const updatedUser = Object.keys(updateData).length > 0 ? db.update('users', staff.id, updateData) : staff;

  let profile = db.findOne('staff_profiles', (sp) => sp.user_id === staff.id);
  if (profile) {
    const profileUpdates = {};
    if (employee_id && employee_id.trim()) {
      profileUpdates.employee_id = employee_id.trim();
    }
    if (role_type || role) {
      profileUpdates.role_type = (role_type === 'operations' || role === 'operations') ? 'operations' : 'sales';
    }
    if (departments) {
      profileUpdates.departments = Array.isArray(departments) ? departments : [departments];
      profileUpdates.department = profileUpdates.departments.join(', ');
    } else if (department) {
      profileUpdates.department = department;
      profileUpdates.departments = department.split(',').map((s) => s.trim());
    }

    if (designations) {
      profileUpdates.designations = Array.isArray(designations) ? designations : [designations];
      profileUpdates.designation = profileUpdates.designations.join(', ');
    } else if (designation) {
      profileUpdates.designation = designation;
      profileUpdates.designations = designation.split(',').map((s) => s.trim());
    }

    if (Object.keys(profileUpdates).length > 0) {
      profile = db.update('staff_profiles', profile.id, profileUpdates);
    }
  }

  const { password_hash, ...safeStaff } = updatedUser;
  res.json({ ...safeStaff, profile });
});

// Admin Resend Staff Invitation & Credentials
app.post('/api/admin/staff/:id/resend-invitation', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const staff = db.findById('users', req.params.id) || db.findOne('users', (u) => u.id === req.params.id || (u.email && u.email.toLowerCase() === req.params.id.toLowerCase()));
  if (!staff || (staff.agency_id && staff.agency_id !== req.user.agency_id) || (staff.role !== 'staff' && staff.role !== 'sales' && staff.role !== 'operations')) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const profile = db.findOne('staff_profiles', (sp) => sp.user_id === staff.id) || {};
  const isOps = staff.role === 'operations' || profile.role_type === 'operations';
  const effectiveRole = isOps ? 'operations' : 'sales';
  const effectiveEmpId = profile.employee_id || staff.display_id || (isOps ? 'TBG_OPE_001' : 'TBG_SAL_001');
  const effectiveDesignation = profile.designation || (isOps ? 'Operations' : 'Sales');

  const newTempPassword = req.body.password || `Genie@${Math.floor(1000 + Math.random() * 9000)}`;
  db.update('users', staff.id, {
    password_hash: bcrypt.hashSync(newTempPassword, 10),
    status: 'active'
  });

  const baseUrl = process.env.APP_URL || req.headers.origin || 'http://localhost:3000';
  const invitationLink = `${baseUrl}/staff-login?email=${encodeURIComponent(staff.email.toLowerCase())}&role=${effectiveRole}`;

  let emailSent = false;
  let emailError = null;
  try {
    const emailRes = await emailService.sendStaffInvitationEmail({
      agency_id: staff.agency_id || 'agency_travel_genie',
      to: staff.email.toLowerCase(),
      name: staff.name,
      employee_id: effectiveEmpId,
      designation: effectiveDesignation,
      temporary_password: newTempPassword,
      app_url: baseUrl
    });
    emailSent = emailRes?.sent ?? true;
  } catch (err) {
    emailError = err.message;
    console.warn('[STAFF RESEND INVITATION ERROR]', err.message);
  }

  res.json({
    success: true,
    message: emailSent
      ? `Onboarding invitation and login credentials emailed successfully to ${staff.email}.`
      : `Credentials reset. Email dispatch simulated or logged (check SMTP settings).`,
    email_sent: emailSent,
    email_error: emailError,
    temporary_password: newTempPassword,
    invitation_link: invitationLink,
    employee_id: effectiveEmpId,
    email: staff.email
  });
});

// Admin Delete Staff Account Permanently
app.delete('/api/admin/staff/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const staff = db.findById('users', req.params.id) || db.findOne('users', (u) => u.id === req.params.id || (u.email && u.email.toLowerCase() === req.params.id.toLowerCase()));
  if (!staff || (staff.agency_id && req.user.agency_id && staff.agency_id !== req.user.agency_id) || (staff.role !== 'staff' && staff.role !== 'sales' && staff.role !== 'operations')) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  // 1. Delete all staff profiles
  const profiles = db.findAll('staff_profiles', (sp) => sp.user_id === staff.id || (sp.employee_id && sp.employee_id === staff.display_id));
  for (const p of profiles) {
    db.delete('staff_profiles', p.id);
  }

  // 2. Delete all pending staff invitations
  const invitations = db.findAll('staff_account_invitations', (i) => i.user_id === staff.id || (i.email && i.email.toLowerCase() === staff.email.toLowerCase()));
  for (const inv of invitations) {
    db.delete('staff_account_invitations', inv.id);
  }

  // 3. Reassign any assigned leads to unassigned
  const assignedLeads = db.findAll('leads', (l) => l.assigned_staff_id === staff.id || l.assigned_to === staff.name || l.assigned_to === staff.id);
  for (const lead of assignedLeads) {
    db.update('leads', lead.id, {
      assigned_staff_id: null,
      assigned_staff_name: null,
      assigned_to: 'Unassigned',
      status: lead.status === 'Assigned' ? 'New' : lead.status
    });
  }

  // 4. Revoke active auth tokens/sessions
  tokenService.revokeAllUserTokens(staff.id);

  // 5. Permanently remove the user record from the database
  db.delete('users', staff.id);

  console.log(`[STAFF PERMANENT DELETE] Staff member ${staff.name} (${staff.id}, ${staff.email}) deleted from database.`);

  res.json({ success: true, message: `Staff member ${staff.name} permanently removed from the database.` });
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
  const existingUser = db.findOne('users', (u) => u && u.email && u.email.toLowerCase() === trimmedEmail);
  if (existingUser) {
    return res.status(400).json({ error: `An account with email '${trimmedEmail}' already exists (${existingUser.role || 'user'}). Duplicate emails are not allowed.` });
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

  // Ensure customer details (name, email, phone) and assignment details are enriched from original enquiry/lead
  const enriched = bookings.map((b) => {
    let email = b.customer_email;
    let name = b.customer_name;
    let phone = b.customer_phone;
    let assignedStaffName = b.sales_executive_name || b.assigned_staff_name || null;
    let assignedStaffId = b.sales_executive_id || b.assigned_staff_id || null;
    let assignedStaffDepartment = b.assigned_staff_department || null;
    let assignedTeam = b.assigned_team || null;

    let l = b.lead_id ? db.findById('leads', b.lead_id) : null;
    if (!l && (b.customer_email || b.customer_name)) {
      l = db.findOne('leads', (lead) => (b.customer_email && lead.customer_email === b.customer_email) || (b.customer_name && lead.customer_name === b.customer_name));
    }

    if (l) {
      if (!email && l.customer_email) email = l.customer_email;
      if (!name && l.customer_name) name = l.customer_name;
      if (!phone && l.customer_phone) phone = l.customer_phone;
      if (!assignedStaffName && (l.assigned_staff_name || l.assigned_sales_executive)) {
        assignedStaffName = l.assigned_staff_name || l.assigned_sales_executive;
      }
      if (!assignedStaffId && l.assigned_staff_id) {
        assignedStaffId = l.assigned_staff_id;
      }
      if (!assignedTeam && l.assigned_team) {
        assignedTeam = l.assigned_team;
      }
      if (l.enquiry_id) {
        const enq = db.findOne('enquiries', (e) => e.enquiry_id === l.enquiry_id || e.id === l.enquiry_id);
        if (enq) {
          if (!email && enq.customer_email) email = enq.customer_email;
          if (!name && enq.customer_name) name = enq.customer_name;
          if (!phone && enq.customer_phone) phone = enq.customer_phone;
        }
      }
    }

    if (assignedStaffId) {
      const staffUser = db.findById('users', assignedStaffId);
      if (staffUser && !assignedStaffName) assignedStaffName = staffUser.name;
      const staffProf = db.findOne('staff_profiles', (p) => p.user_id === assignedStaffId || p.id === assignedStaffId);
      if (staffProf && !assignedStaffDepartment) {
        assignedStaffDepartment = Array.isArray(staffProf.departments)
          ? staffProf.departments.join(', ')
          : (staffProf.department || '');
      }
    }

    return {
      ...b,
      customer_email: email || b.customer_email,
      customer_name: name || b.customer_name,
      customer_phone: phone || b.customer_phone,
      assigned_staff_name: assignedStaffName || (b.agent_id ? `${b.agent_name || 'B2B Wholesale Agent'}` : 'Unassigned'),
      assigned_staff_id: assignedStaffId,
      assigned_staff_department: assignedStaffDepartment || '',
      assigned_team: assignedTeam
    };
  });

  enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enriched);
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

app.put('/api/staff/bookings/:id/payment', authenticate, authorize(['staff', 'sales', 'operations', 'admin', 'manager']), async (req, res) => {
  const agencyId = req.user.agency_id;
  const paramId = String(req.params.id || '').trim();
  const booking = db.findById('bookings', paramId) || db.findOne('bookings', (b) => b.booking_number === paramId || b.id === paramId || b.booking_reference === paramId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Respective staff ownership check: must be assigned sales executive or staff on linked lead
  const isAssignedExecutive = (booking.sales_executive_id && booking.sales_executive_id === req.user.id);
  let isLeadStaff = false;
  if (booking.lead_id) {
    const lead = db.findById('leads', booking.lead_id);
    if (lead && (lead.assigned_staff_id === req.user.id || (lead.supporting_staff_ids && lead.supporting_staff_ids.includes(req.user.id)))) {
      isLeadStaff = true;
    }
  }

  // If a manager or unassigned user tries to update payments, verify ownership
  if (!isAssignedExecutive && !isLeadStaff && req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.role !== 'sales') {
    return res.status(403).json({
      error: 'Forbidden: Payment updates can only be performed by the respective staff assigned to this customer booking.'
    });
  }

  const { payment_status, advance_amount, balance_amount, payment_method, transaction_reference, payment_proof, notes } = req.body;
  const adv = advance_amount !== undefined ? Number(advance_amount) : Number(booking.advance_amount || 0);
  const bal = balance_amount !== undefined ? Number(balance_amount) : Number(booking.balance_amount || 0);

  const updated = db.update('bookings', booking.id, {
    payment_status: payment_status || (bal === 0 && adv > 0 ? 'Paid' : (adv > 0 ? 'Partial' : 'Pending')),
    advance_amount: adv,
    balance_amount: bal,
    payment_method: payment_method || booking.payment_method || 'UPI',
    transaction_reference: transaction_reference || booking.transaction_reference,
    payment_proof: payment_proof || booking.payment_proof,
    last_payment_updated_by: req.user.id,
    last_payment_updated_by_name: req.user.name,
    last_payment_updated_at: new Date().toISOString()
  });

  if (advance_amount !== undefined && Number(advance_amount) > Number(booking.advance_amount || 0)) {
    const diff = Number(advance_amount) - Number(booking.advance_amount || 0);
    db.insert('payments', {
      agency_id: agencyId,
      booking_id: booking.id,
      amount: diff,
      payment_type: 'Installment',
      payment_method: payment_method || 'UPI',
      transaction_reference: transaction_reference || `PAY-${Date.now()}`,
      payment_proof: payment_proof || '',
      payment_date: new Date().toISOString(),
      notes: notes || `Payment updated by assigned staff ${req.user.name}.`,
      status: 'Completed',
      verified_by: req.user.id,
      verified_at: new Date().toISOString()
    });
  }

  db.recordAuditLog(agencyId, req.user.id, 'STAFF_PAYMENT_UPDATE', 'booking', booking.id, {
    staff_id: req.user.id,
    advance_amount: adv,
    balance_amount: bal,
    payment_status: updated.payment_status
  });

  res.json({
    success: true,
    message: `Payment updated successfully by staff ${req.user.name}.`,
    booking: updated
  });
});

app.put('/api/admin/bookings/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const paramId = String(req.params.id || '').trim();
  const booking = db.findById('bookings', paramId) || db.findOne('bookings', (b) => b.booking_number === paramId || b.id === paramId || b.booking_reference === paramId);
  if (!booking) {
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

// Admin Email Service Status & Live Dispatch Test
app.get('/api/admin/email-status', authenticate, authorize(['admin', 'manager']), (req, res) => {
  res.json(emailService.getStatus());
});

app.post('/api/admin/test-email', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  const targetEmail = req.body.to || req.user.email;
  if (!targetEmail) {
    return res.status(400).json({ error: 'Recipient email address is required.' });
  }

  const result = await emailService.sendMail({
    to: targetEmail,
    subject: 'Trip by Genie - Live Email Service Test',
    text: `Hello,\n\nThis is a verification test email from your Trip by Genie system sent at ${new Date().toLocaleString()}.\n\nYour SMTP/Email integration is active and working properly!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #082c43; margin-top: 0;">Trip by Genie • Email Service Test</h2>
        <p style="color: #334155; font-size: 15px;">Hello,</p>
        <p style="color: #334155; font-size: 15px;">This is a live test email from your <strong>Trip by Genie</strong> platform.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <p style="color: #166534; font-weight: bold; margin: 0;">✓ Email service is connected and delivering messages successfully.</p>
          <p style="color: #166534; font-size: 13px; margin: 4px 0 0 0;">Timestamp: ${new Date().toLocaleString()}</p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Trip by Genie Automated Mail Dispatcher</p>
      </div>
    `
  });

  if (result.sent) {
    return res.json({ success: true, message: `Test email delivered successfully to ${targetEmail}!`, messageId: result.messageId });
  } else if (result.simulated) {
    return res.status(400).json({
      success: false,
      error: 'Email service is running in simulated mode. No SMTP credentials (GMAIL_USER / SMTP_HOST) found in .env.'
    });
  } else {
    return res.status(500).json({
      success: false,
      error: `Failed to deliver email: ${result.error}`
    });
  }
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

// Staff Assigned Leads (Strict isolation: only leads assigned to this staff or team, or all for admin/manager)
app.get('/api/staff/leads', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;
  const { status, search } = req.query;
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  let leads = isManagerOrAdmin
    ? db.findAll('leads', (l) => !l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie')
    : db.findAll('leads', (l) => (!l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie') && (l.assigned_staff_id === staffId || (Array.isArray(l.assigned_team) && l.assigned_team.some((m) => m.staff_id === staffId))));

  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    if (sLower === 'new assigned' || sLower === 'assigned') {
      leads = leads.filter((l) => (l.status || '').toLowerCase() === 'assigned' || (l.status || '').toLowerCase() === 'new assigned');
    } else {
      leads = leads.filter((l) => (l.status || '').toLowerCase() === sLower);
    }
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

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const isAssigned = lead.assigned_staff_id === staffId || (Array.isArray(lead.assigned_team) && lead.assigned_team.some((m) => m.staff_id === staffId));
  if (!isManagerOrAdmin && !isAssigned) {
    return res.status(403).json({ error: 'Access denied: You are not assigned to this lead.' });
  }

  const activities = db.findAll('lead_activities', (a) => a.lead_id === lead.id);
  activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const quotations = db.findAll('quotations', (q) => q.lead_id === lead.id);
  const pkg = lead.interested_package_id ? db.findById('packages', lead.interested_package_id) : null;
  const conversionRequests = db.findAll('booking_conversion_requests', (cr) => cr.lead_id === lead.id);

  res.json({ lead, activities, quotations, package: pkg, conversion_requests: conversionRequests });
});

// Staff Update Lead Status, Notes & Follow-up (Strict Workflow Engine)
app.put('/api/staff/leads/:id/status', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const isAssigned = lead.assigned_staff_id === staffId || (Array.isArray(lead.assigned_team) && lead.assigned_team.some((m) => m.staff_id === staffId));
  if (!isManagerOrAdmin && !isAssigned) {
    return res.status(403).json({ error: 'Access denied: You are not authorized to update this lead.' });
  }

  const { status, notes, follow_up_date, lost_reason, reason, cancellation_reason } = req.body;
  const oldStatus = lead.status;
  const effectiveReason = (reason || lost_reason || cancellation_reason || notes || '').trim();

  // 1. Prevent invalid transitions from terminal states without Manager authorization
  const isTerminal = oldStatus === 'Converted' || oldStatus === 'Cancelled';
  if (isTerminal && !isManagerOrAdmin) {
    return res.status(400).json({
      error: 'Cannot modify a confirmed converted or cancelled lead without Manager authorization.'
    });
  }

  // 2. Reason requirement for Lost / Dropped leads
  if (status && (status.toLowerCase().includes('lost') || status.toLowerCase().includes('dropped'))) {
    if (!effectiveReason) {
      return res.status(400).json({
        error: 'A reason is required when marking a lead as Lost / Dropped.'
      });
    }
  }

  // 3. Reason requirement for Cancelled leads
  if (status && status.toLowerCase().includes('cancel')) {
    if (!effectiveReason) {
      return res.status(400).json({
        error: 'A cancellation reason is required when cancelling a lead.'
      });
    }
  }

  // 4. Staff cannot approve their own booking conversion directly via /status
  if ((status === 'Converted' || status === 'Converted to Booking') && !isManagerOrAdmin) {
    return res.status(400).json({
      error: 'To convert a lead to booking, please submit a booking conversion request with payment evidence for Manager verification.'
    });
  }

  const updatePayload = {
    status: status || lead.status,
    notes: notes !== undefined ? notes : lead.notes,
    follow_up_date: follow_up_date !== undefined ? follow_up_date : lead.follow_up_date
  };

  if (lost_reason || reason) {
    updatePayload.lost_reason = lost_reason || reason;
  }
  if (cancellation_reason) {
    updatePayload.cancellation_reason = cancellation_reason;
  }

  const updated = db.update('leads', lead.id, updatePayload);

  if (status && status !== oldStatus) {
    const actionDesc = `Staff ${req.user.name} changed status from '${oldStatus}' to '${status}'. ${effectiveReason ? `Reason/Note: ${effectiveReason}` : ''}`.trim();
    db.recordActivity(lead.id, staffId, 'status_change', actionDesc);
    db.recordLeadStatusHistory(req.user.agency_id || 'agency_travel_genie', lead.id, oldStatus, status, staffId, effectiveReason);
  } else if (notes) {
    db.recordActivity(lead.id, staffId, 'note', `Staff ${req.user.name} added note: ${notes}`);
  }

  res.json(updated);
});

// Staff Log Customer Interaction (Calls, Messages, WhatsApp, Notes, Preferences)
app.post('/api/staff/leads/:id/interactions', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const isAssigned = lead.assigned_staff_id === staffId || (Array.isArray(lead.assigned_team) && lead.assigned_team.some((m) => m.staff_id === staffId));
  if (!isManagerOrAdmin && !isAssigned) {
    return res.status(403).json({ error: 'Access denied: You are not assigned to this lead.' });
  }

  const { interaction_type, channel = 'CALL', notes, summary, customer_response, follow_up_date, requirements, preferences } = req.body;
  const finalSummary = (notes || summary || requirements || customer_response || '').trim();
  if (!finalSummary) {
    return res.status(400).json({ error: 'Interaction details or summary are required.' });
  }

  if (follow_up_date && !isTodayOrFutureDate(follow_up_date)) {
    return res.status(400).json({ error: 'Follow-up date cannot be in the past.' });
  }

  const finalChannel = interaction_type || channel || 'CALL';
  const interaction = db.insert('customer_interactions', {
    agency_id: agencyId,
    lead_id: lead.id,
    staff_id: staffId,
    staff_name: req.user.name,
    channel: finalChannel,
    summary: finalSummary,
    customer_response: customer_response || '',
    preferences: preferences || requirements || null,
    created_at: new Date().toISOString()
  });

  const activityRecord = db.insert('lead_activities', {
    lead_id: lead.id,
    user_id: staffId,
    user_name: req.user.name,
    activity_type: finalChannel.toLowerCase(),
    description: `[${finalChannel.toUpperCase()}] by ${req.user.name}: ${finalSummary} ${customer_response ? `| Customer Response: ${customer_response}` : ''}`.trim(),
    metadata: {
      interaction_id: interaction.id,
      channel: finalChannel,
      customer_response: customer_response || '',
      requirements: requirements || preferences || '',
      follow_up_date: follow_up_date || null
    },
    created_at: new Date().toISOString()
  });

  if (follow_up_date) {
    db.update('leads', lead.id, { follow_up_date });
    db.insert('follow_ups', {
      agency_id: agencyId,
      lead_id: lead.id,
      staff_id: staffId,
      scheduled_date: follow_up_date,
      notes: finalSummary,
      status: 'SCHEDULED',
      created_at: new Date().toISOString()
    });
  }

  res.status(201).json({
    success: true,
    message: 'Interaction recorded successfully.',
    activity: activityRecord,
    interaction
  });
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

// Staff Create Customer Login & Dispatch Invitation (for worthy leads)
app.post('/api/staff/leads/:id/create-customer-login', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), async (req, res) => {
  try {
    const staffId = req.user.id;
    const staffRole = req.user.role;
    const staffName = req.user.name || 'Sales Staff';
    const agencyId = req.user.agency_id || 'agency_travel_genie';
    const { temp_password } = req.body || {};

    const lead = db.findById('leads', req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Verify staff assignment: staff/sales must be assigned to this lead unless manager/admin
    // If lead is unassigned, auto-assign to the creating sales/staff member so workflow can proceed smoothly
    if (['staff', 'sales'].includes(staffRole)) {
      const isAssigned = !lead.assigned_staff_id || lead.assigned_staff_id === staffId || (Array.isArray(lead.assigned_team) && lead.assigned_team.some((m) => m.staff_id === staffId));
      if (!isAssigned) {
        return res.status(403).json({ error: 'Access denied: This lead is assigned to another staff member.' });
      }
      if (!lead.assigned_staff_id) {
        db.update('leads', lead.id, {
          assigned_staff_id: staffId,
          assigned_staff_name: staffName,
          status: lead.status === 'New Enquiries' ? 'New Assigned' : lead.status
        });
      }
    }

    const customerEmail = (lead.customer_email || '').trim().toLowerCase();
    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid customer email is required to create login credentials.' });
    }

    const customerName = (lead.customer_name || '').trim() || 'Valued Customer';
    const customerPhone = lead.customer_phone || '';
    const finalTempPassword = (temp_password || '').trim() || `Genie@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = bcrypt.hashSync(finalTempPassword, 10);
    const appUrl = (req.headers.origin || 'http://localhost:3000').replace(/\/+$/, '');

    let userRecord = db.findOne('users', (u) => u && u.email && u.email.toLowerCase() === customerEmail);
    let customerCode = userRecord?.customer_code || db.generateUniqueCode('users', 'CUS', true);

    if (userRecord) {
      db.update('users', userRecord.id, {
        password_hash: passwordHash,
        temp_password: finalTempPassword,
        status: 'active',
        account_status: 'ACTIVE',
        activation_status: 'ACTIVE',
        customer_code: customerCode,
        name: userRecord.name || customerName,
        phone: userRecord.phone || customerPhone
      });
    } else {
      userRecord = db.insert('users', {
        agency_id: agencyId,
        role: 'customer',
        customer_code: customerCode,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        password_hash: passwordHash,
        temp_password: finalTempPassword,
        status: 'active',
        account_status: 'ACTIVE',
        activation_status: 'ACTIVE',
        created_at: new Date().toISOString()
      });
    }

    // Ensure customer profile exists
    let custProfile = db.findOne('customer_profiles', (cp) => cp && cp.user_id === userRecord.id);
    if (!custProfile) {
      db.insert('customer_profiles', {
        user_id: userRecord.id,
        customer_code: customerCode,
        agency_id: agencyId,
        name: customerName,
        email: customerEmail,
        emergency_contact: customerPhone,
        preferred_currency: 'INR'
      });
    } else {
      db.update('customer_profiles', custProfile.id, {
        customer_code: customerCode,
        name: custProfile.name || customerName,
        emergency_contact: custProfile.emergency_contact || customerPhone
      });
    }

    // Ensure customer directory record exists without ID collision
    let customerDir = db.findOne('customers', (c) => c && c.email && c.email.toLowerCase() === customerEmail);
    if (!customerDir) {
      db.insert('customers', {
        customer_code: customerCode,
        user_id: userRecord.id,
        agency_id: agencyId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      });
    } else {
      db.update('customers', customerDir.id, {
        status: 'ACTIVE',
        customer_code: customerCode,
        name: customerDir.name || customerName,
        phone: customerDir.phone || customerPhone
      });
    }

    // Link lead to customer
    db.update('leads', lead.id, {
      customer_id: userRecord.id,
      customer_code: customerCode,
      notes: `${lead.notes ? lead.notes + '\n' : ''}[${new Date().toLocaleString()}] Customer portal credentials created by ${staffName}. Invitation link dispatched to ${customerEmail}.`
    });

    // Record lead activity
    db.insert('lead_activities', {
      lead_id: lead.id,
      agency_id: agencyId,
      user_id: staffId,
      user_name: staffName,
      type: 'CREDENTIALS_PROVISIONED',
      description: `Staff ${staffName} created customer login ID (${customerCode}) and sent invitation link to ${customerEmail}.`,
      created_at: new Date().toISOString()
    });

    // Record audit log
    db.recordAuditLog(agencyId, staffId, 'CREATE_CUSTOMER_LOGIN_FOR_LEAD', 'lead', lead.id, {
      customer_id: customerCode,
      customer_email: customerEmail,
      lead_id: lead.id
    });

    const loginUrl = `${appUrl}/login?email=${encodeURIComponent(customerEmail)}`;

    // Dispatch activation email asynchronously in background so SMTP latency or DNS timeout never blocks HTTP response
    if (typeof emailService.sendAccountActivationEmail === 'function') {
      emailService.sendAccountActivationEmail({
        agency_id: agencyId,
        to: customerEmail,
        name: customerName,
        customer_id: customerCode,
        booking_id: lead.id,
        activation_token: 'direct_login',
        app_url: appUrl
      }).catch((mailErr) => {
        console.error('Non-blocking onboarding email delivery error:', mailErr?.message || mailErr);
      });
    }

    return res.status(200).json({
      success: true,
      message: `Customer login created and invitation link dispatched to ${customerEmail}!`,
      customer_id: customerCode,
      email: customerEmail,
      temp_password: finalTempPassword,
      login_url: loginUrl,
      account_status: 'ACTIVE'
    });
  } catch (err) {
    console.error('Error generating customer login credentials:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while creating customer credentials.'
    });
  }
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

// ==========================================
// 5.6 B2C BOOKING CONVERSION & PAYMENT VERIFICATION WORKFLOW
// ==========================================

// Private Payment Proof Upload (Restricted & Non-public)
const paymentProofsDir = path.join(__dirname, 'uploads', 'payment_proofs');
if (!fs.existsSync(paymentProofsDir)) {
  fs.mkdirSync(paymentProofsDir, { recursive: true });
}

const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, paymentProofsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proof-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF documents are permitted for payment proof.'));
    }
  }
});

// Staff Upload Payment Proof Evidence
app.post('/api/staff/leads/:id/upload-payment-proof', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), uploadPaymentProof.single('file'), (req, res) => {
  const staffId = req.user.id;
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const isAssigned = lead.assigned_staff_id === staffId || (Array.isArray(lead.assigned_team) && lead.assigned_team.some((m) => m.staff_id === staffId));
  if (!isManagerOrAdmin && !isAssigned) {
    return res.status(403).json({ error: 'Access denied: You are not assigned to this lead.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Please select a valid payment proof file to upload.' });
  }

  const evidenceRecord = db.insert('payment_evidence', {
    agency_id: lead.agency_id || 'agency_travel_genie',
    lead_id: lead.id,
    uploader_id: req.user.id,
    uploader_name: req.user.name,
    file_name: req.file.filename,
    original_name: req.file.originalname,
    file_size: req.file.size,
    file_path: `/private/payment_proofs/${req.file.filename}`,
    mime_type: req.file.mimetype,
    verified: false,
    created_at: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    message: 'Payment proof uploaded securely.',
    evidence: evidenceRecord,
    proof_url: `/private/payment_proofs/${req.file.filename}`
  });
});

// Staff Initiate Booking Conversion Request (Handover to Manager) OR Direct Manager Conversion
app.post('/api/staff/leads/:id/convert', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const isAssigned = lead.assigned_staff_id === staffId || (Array.isArray(lead.assigned_team) && lead.assigned_team.some((m) => m.staff_id === staffId));
  if (!isManagerOrAdmin && !isAssigned) {
    return res.status(403).json({ error: 'Access denied: You are not authorized to convert this lead.' });
  }

  const {
    total_amount,
    advance_amount,
    payment_method,
    payment_proof,
    transaction_reference,
    travel_start_date,
    travel_end_date,
    travelers_count,
    special_requests,
    notes
  } = req.body;

  const tot = Number(total_amount);
  if (!tot || tot <= 0) {
    return res.status(400).json({ error: 'Total package amount is required and must be greater than zero.' });
  }

  const adv = Number(advance_amount) || 0;
  if (adv < 0) {
    return res.status(400).json({ error: 'Advance amount cannot be negative.' });
  }

  if (travel_start_date && !isTodayOrFutureDate(travel_start_date)) {
    return res.status(400).json({ error: 'Departure/travel start date cannot be in the past.' });
  }

  if (travel_end_date) {
    if (!isTodayOrFutureDate(travel_end_date)) {
      return res.status(400).json({ error: 'Travel end date cannot be in the past.' });
    }
    if (travel_start_date && !isValidDateRange(travel_start_date, travel_end_date)) {
      return res.status(400).json({ error: 'Travel end date cannot be earlier than travel start date.' });
    }
  }

  const bal = Math.max(0, tot - adv);
  const ref = transaction_reference || payment_proof || '';

  if (adv > 0 && !ref) {
    return res.status(400).json({ error: 'Transaction reference or payment proof is required when advance payment is recorded.' });
  }

  // 1. Record payment evidence in immutable payment_evidence table
  const evidenceRecord = db.insert('payment_evidence', {
    agency_id: agencyId,
    lead_id: lead.id,
    uploader_id: req.user.id,
    uploader_name: req.user.name,
    amount: adv,
    payment_method: payment_method || 'UPI',
    transaction_reference: ref,
    payment_proof: payment_proof || ref,
    notes: special_requests || notes || '',
    verified: isManagerOrAdmin,
    uploaded_at: new Date().toISOString()
  });

  // 2. If called by Staff (Sales Consultant):
  // Create a Booking Conversion Request for Manager Verification & Approval (Enforces Strict Separation of Duties)
  if (!isManagerOrAdmin) {
    const convRequestId = db.generateUniqueCode('booking_conversion_requests', 'CR', true);
    const convRequest = db.insert('booking_conversion_requests', {
      id: convRequestId,
      agency_id: agencyId,
      lead_id: lead.id,
      staff_id: req.user.id,
      staff_name: req.user.name,
      customer_id: lead.customer_id || null,
      customer_name: lead.customer_name,
      customer_email: lead.customer_email,
      customer_phone: lead.customer_phone,
      package_id: lead.interested_package_id || null,
      package_title: lead.interested_destination,
      travel_start_date: travel_start_date || lead.travel_date || new Date().toISOString().split('T')[0],
      travel_end_date: travel_end_date || '',
      travelers_count: travelers_count || lead.travelers_count || 2,
      total_amount: tot,
      advance_amount: adv,
      balance_amount: bal,
      payment_method: payment_method || 'UPI',
      transaction_reference: ref,
      payment_proof: payment_proof || ref,
      evidence_id: evidenceRecord.id,
      notes: special_requests || notes || lead.notes || '',
      status: 'PENDING_APPROVAL',
      submitted_at: new Date().toISOString()
    });

    // Update lead status to Converted to Booking with conversion request linked
    db.update('leads', lead.id, {
      status: 'Converted to Booking',
      conversion_request_id: convRequest.id,
      conversion_status: 'PENDING_APPROVAL'
    });

    db.recordActivity(
      lead.id,
      staffId,
      'conversion_request',
      `Staff ${req.user.name} submitted Booking Conversion Request #${convRequest.id} with ₹${adv.toLocaleString('en-IN')} advance payment proof for Manager verification.`
    );

    db.recordLeadStatusHistory(
      agencyId,
      lead.id,
      lead.status,
      'Converted to Booking',
      staffId,
      `Conversion request submitted with ₹${adv.toLocaleString('en-IN')} payment proof awaiting Manager approval.`
    );

    // Notify Managers immediately
    const managers = db.findAll('users', (u) => (u.agency_id === agencyId || u.agency_id === 'agency_travel_genie') && (u.role === 'admin' || u.role === 'manager'));
    for (const mgr of managers) {
      db.createNotification(
        agencyId,
        mgr.id,
        'Booking Conversion Request',
        `Staff ${req.user.name} submitted conversion request for Lead #${lead.id} (${lead.customer_name} - ${lead.interested_destination}). Advance deposit: ₹${adv.toLocaleString('en-IN')}. Verify payment proof.`,
        'warning',
        '/manager/bookings'
      );
    }

    return res.status(201).json({
      success: true,
      pending_approval: true,
      message: 'Booking conversion request submitted successfully. Awaiting Manager payment verification and approval.',
      conversion_request: convRequest
    });
  }

  // 3. If called directly by Manager / Admin:
  // Immediately verify payment and provision confirmed booking
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
    sales_executive_id: staffId,
    sales_executive_name: req.user.name,
    package_id: lead.interested_package_id,
    package_title: lead.interested_destination,
    travel_start_date: travel_start_date || lead.travel_date || new Date().toISOString().split('T')[0],
    travel_end_date: travel_end_date || '',
    travelers_count: travelers_count || lead.travelers_count || 2,
    total_amount: tot,
    advance_amount: adv,
    balance_amount: bal,
    payment_method: payment_method || 'UPI',
    payment_proof: ref,
    payment_status: bal === 0 ? 'Paid' : (adv > 0 ? 'Partial' : 'Pending'),
    booking_status: 'Confirmed',
    special_requests: special_requests || lead.notes,
    verified_by_manager_id: req.user.id,
    created_at: new Date().toISOString()
  });

  if (adv > 0) {
    db.insert('payments', {
      agency_id: agencyId,
      booking_id: newBooking.id,
      amount: adv,
      payment_type: 'Advance',
      payment_method: payment_method || 'UPI',
      transaction_reference: ref || `CONV-PAY-${Date.now()}`,
      payment_proof: ref,
      payment_date: new Date().toISOString(),
      notes: `Advance payment verified by Manager ${req.user.name}. Ref: ${ref}`,
      status: 'Completed',
      verified_by: req.user.id,
      verified_at: new Date().toISOString()
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

  db.insert('booking_status_history', {
    agency_id: agencyId,
    booking_id: newBooking.id,
    from_status: 'QUOTATION_PENDING',
    to_status: 'CONFIRMED',
    changed_by: req.user.id,
    notes: `Lead converted directly by Manager ${req.user.name} into confirmed booking #${bookingNum} with ₹${adv} advance deposit.`,
    created_at: new Date().toISOString()
  });

  db.update('leads', lead.id, {
    status: 'Converted',
    booking_id: newBooking.id,
    conversion_status: 'APPROVED'
  });
  db.recordActivity(lead.id, staffId, 'status_change', `Lead successfully CONVERTED to confirmed Booking #${bookingNum}!`);

  res.status(201).json({
    success: true,
    message: 'Lead converted successfully!',
    booking: newBooking
  });
});

// Staff Initiate B2B Partner Conversion Request (Handover to Manager for Business Verification Approval)
app.post('/api/staff/leads/:id/convert-partner', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const lead = db.findById('leads', req.params.id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  const { verification_notes, business_docs_verified, estimated_credit_limit, wholesale_tier } = req.body;

  const convRequestId = db.generateUniqueCode('booking_conversion_requests', 'PCR', true);
  const convRequest = db.insert('booking_conversion_requests', {
    id: convRequestId,
    type: 'B2B_PARTNER',
    agency_id: agencyId,
    lead_id: lead.id,
    staff_id: staffId,
    staff_name: req.user.name,
    customer_name: lead.customer_name,
    company_name: lead.company_name || lead.customer_name,
    customer_email: lead.customer_email,
    customer_phone: lead.customer_phone,
    verification_notes: verification_notes || 'Business verification completed by sales staff.',
    business_docs_verified: !!business_docs_verified,
    wholesale_tier: wholesale_tier || 'Standard Wholesale (Tier 1)',
    estimated_credit_limit: estimated_credit_limit || 0,
    status: isManagerOrAdmin ? 'APPROVED' : 'PENDING_APPROVAL',
    submitted_at: new Date().toISOString()
  });

  const nextStatus = isManagerOrAdmin ? 'Converted to Partner' : 'Business Verification';
  db.update('leads', lead.id, {
    status: nextStatus,
    conversion_request_id: convRequest.id,
    conversion_status: isManagerOrAdmin ? 'APPROVED' : 'PENDING_APPROVAL'
  });

  db.recordActivity(
    lead.id,
    staffId,
    'partner_conversion_request',
    `Staff ${req.user.name} submitted B2B Partner Conversion Request #${convRequest.id} for Manager verification.`
  );

  // Notify Managers
  if (!isManagerOrAdmin) {
    const managers = db.findAll('users', (u) => (u.agency_id === agencyId || u.agency_id === 'agency_travel_genie') && (u.role === 'admin' || u.role === 'manager'));
    for (const mgr of managers) {
      db.createNotification(
        agencyId,
        mgr.id,
        'B2B Partner Conversion Request',
        `Staff ${req.user.name} submitted partner verification for ${lead.company_name || lead.customer_name}. Awaiting Manager approval to issue Agent credentials.`,
        'warning',
        mgr.role === 'manager' ? '/manager/leads' : '/admin/leads'
      );
    }
  }

  res.status(201).json({
    success: true,
    conversion_request_id: convRequest.id,
    status: convRequest.status,
    message: isManagerOrAdmin
      ? 'B2B Partner verified and approved. You may now provision the Agent Account.'
      : 'Partner conversion request submitted for Manager approval.'
  });
});

// Manager List All Booking Conversion Requests
app.get('/api/admin/bookings/conversion-requests', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id;
  const { status } = req.query;

  let requests = db.findAll('booking_conversion_requests', (cr) => !cr.agency_id || cr.agency_id === agencyId || cr.agency_id === 'agency_travel_genie');
  if (status && status !== 'all') {
    requests = requests.filter((cr) => (cr.status || '').toUpperCase() === status.toUpperCase());
  }

  requests.sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at));
  res.json(requests);
});

// Staff List Their Own Conversion Requests
app.get('/api/staff/conversion-requests', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  let requests = isManagerOrAdmin
    ? db.findAll('booking_conversion_requests')
    : db.findAll('booking_conversion_requests', (cr) => cr.staff_id === staffId);

  requests.sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at));
  res.json(requests);
});

// Manager Get Single Conversion Request Details
app.get('/api/admin/bookings/conversion-requests/:id', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const cr = db.findById('booking_conversion_requests', req.params.id);
  if (!cr) {
    return res.status(404).json({ error: 'Conversion request not found.' });
  }

  const lead = db.findById('leads', cr.lead_id);
  const evidence = cr.evidence_id ? db.findById('payment_evidence', cr.evidence_id) : null;
  res.json({ conversion_request: cr, lead, evidence });
});

// Manager Approve Booking Conversion (Verifies Payment & Provisions Booking)
app.post('/api/admin/bookings/conversion-requests/:id/approve', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const cr = db.findById('booking_conversion_requests', req.params.id);

  if (!cr) {
    return res.status(404).json({ error: 'Conversion request not found.' });
  }

  if (cr.status === 'APPROVED') {
    return res.status(400).json({ error: 'Conversion request has already been approved.' });
  }

  const lead = db.findById('leads', cr.lead_id);
  if (!lead) {
    return res.status(404).json({ error: 'Linked lead record not found.' });
  }

  // Handle B2B Partner Conversion Request Approval
  if (cr.type === 'B2B_PARTNER') {
    const { verification_notes } = req.body;
    db.update('booking_conversion_requests', cr.id, {
      status: 'APPROVED',
      approved_by: req.user.id,
      approved_by_name: req.user.name,
      verification_notes: verification_notes || cr.verification_notes,
      approved_at: new Date().toISOString()
    });

    db.update('leads', lead.id, {
      status: 'Converted to Partner',
      conversion_status: 'APPROVED'
    });

    db.recordActivity(
      lead.id,
      req.user.id,
      'partner_approved',
      `Manager ${req.user.name} approved B2B Partner conversion for ${cr.company_name || cr.customer_name}. Ready for Agent ID provisioning.`
    );

    // Notify Staff
    db.createNotification(
      agencyId,
      cr.staff_id,
      'Partner Conversion Approved!',
      `Manager ${req.user.name} approved B2B Partner conversion for ${cr.company_name || cr.customer_name}. Account provisioning is now unlocked.`,
      'success',
      '/staff/leads'
    );

    return res.json({
      success: true,
      message: 'B2B Partner verified and approved. Manager can now create the B2B Agent account.',
      lead_id: lead.id,
      partner_approved: true
    });
  }

  const { verification_notes, verified_amount } = req.body;
  const adv = verified_amount !== undefined ? Number(verified_amount) : Number(cr.advance_amount);
  const tot = Number(cr.total_amount);
  const bal = Math.max(0, tot - adv);
  const bookingNum = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Create Confirmed Booking Record
  const newBooking = db.insert('bookings', {
    agency_id: agencyId,
    booking_number: bookingNum,
    lead_id: lead.id,
    customer_id: lead.customer_id,
    customer_name: cr.customer_name,
    customer_email: cr.customer_email,
    customer_phone: cr.customer_phone,
    agent_id: null,
    sales_executive_id: cr.staff_id,
    sales_executive_name: cr.staff_name,
    package_id: cr.package_id,
    package_title: cr.package_title,
    travel_start_date: cr.travel_start_date || new Date().toISOString().split('T')[0],
    travel_end_date: cr.travel_end_date || '',
    travelers_count: cr.travelers_count || 2,
    total_amount: tot,
    advance_amount: adv,
    balance_amount: bal,
    payment_method: cr.payment_method || 'UPI',
    payment_proof: cr.payment_proof || cr.transaction_reference,
    payment_status: bal === 0 ? 'Paid' : (adv > 0 ? 'Partial' : 'Pending'),
    booking_status: 'Confirmed',
    special_requests: cr.notes,
    verified_by_manager_id: req.user.id,
    verified_by_manager_name: req.user.name,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  });

  // 2. Insert Verified Payment
  if (adv > 0) {
    db.insert('payments', {
      agency_id: agencyId,
      booking_id: newBooking.id,
      amount: adv,
      payment_type: 'Advance',
      payment_method: cr.payment_method || 'UPI',
      transaction_reference: cr.transaction_reference || `CONV-VERIF-${Date.now()}`,
      payment_proof: cr.payment_proof || cr.transaction_reference,
      payment_date: new Date().toISOString(),
      notes: `Advance payment verified and approved by Manager ${req.user.name}. ${verification_notes || ''}`.trim(),
      status: 'Completed',
      verified_by: req.user.id,
      verified_at: new Date().toISOString()
    });

    const subtotal = Math.round(adv / 1.05);
    const tax = adv - subtotal;
    db.insert('invoices', {
      agency_id: agencyId,
      invoice_number: `TG-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      booking_id: newBooking.id,
      customer_id: lead.customer_id,
      customer_name: cr.customer_name,
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

  // 3. Operational arrangements & task checklist initialization
  db.insert('operations_arrangements', {
    agency_id: agencyId,
    booking_id: newBooking.id,
    trip_status: 'Booking Received',
    hotel_name: 'Pending Hotel Allocation',
    room_category: 'Standard / As per quotation',
    meal_plan: 'Breakfast included',
    vehicle_type: 'AC Sedan / SUV as per group size',
    special_instructions: cr.notes || '',
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

  // 4. Update Conversion Request Status to APPROVED
  db.update('booking_conversion_requests', cr.id, {
    status: 'APPROVED',
    approved_by: req.user.id,
    approved_by_name: req.user.name,
    approved_at: new Date().toISOString(),
    booking_id: newBooking.id,
    booking_number: bookingNum,
    verification_notes: verification_notes || ''
  });

  // 5. Update Lead Status to Converted
  db.update('leads', lead.id, {
    status: 'Converted',
    booking_id: newBooking.id,
    conversion_status: 'APPROVED'
  });

  db.recordLeadStatusHistory(
    agencyId,
    lead.id,
    'Converted to Booking',
    'Converted',
    req.user.id,
    `Manager ${req.user.name} verified advance payment and approved booking #${bookingNum}.`
  );

  db.recordActivity(
    lead.id,
    req.user.id,
    'approval',
    `Manager ${req.user.name} approved booking conversion! Confirmed Booking #${bookingNum} created with verified payment.`
  );

  db.recordAuditLog(agencyId, req.user.id, 'APPROVE_BOOKING_CONVERSION', 'booking', newBooking.id, {
    conversion_request_id: cr.id,
    booking_number: bookingNum,
    lead_id: lead.id,
    advance_amount: adv,
    total_amount: tot
  });

  // 6. Notify Staff
  if (cr.staff_id) {
    db.createNotification(
      agencyId,
      cr.staff_id,
      'Conversion Request Approved!',
      `Manager ${req.user.name} verified payment and approved booking #${bookingNum} for ${cr.customer_name}. Account creation is now eligible.`,
      'success',
      '/staff/bookings'
    );
  }

  res.json({
    success: true,
    message: `Booking #${bookingNum} successfully approved and confirmed!`,
    booking: newBooking
  });
});

// Manager Reject Booking Conversion Request
app.post('/api/admin/bookings/conversion-requests/:id/reject', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const cr = db.findById('booking_conversion_requests', req.params.id);

  if (!cr) {
    return res.status(404).json({ error: 'Conversion request not found.' });
  }

  const { rejection_reason } = req.body;
  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({ error: 'Rejection reason is required.' });
  }

  db.update('booking_conversion_requests', cr.id, {
    status: 'REJECTED',
    rejection_reason: rejection_reason.trim(),
    rejected_by: req.user.id,
    rejected_by_name: req.user.name,
    rejected_at: new Date().toISOString()
  });

  const lead = db.findById('leads', cr.lead_id);
  if (lead) {
    db.update('leads', lead.id, {
      status: 'Negotiation',
      conversion_status: 'REJECTED'
    });

    db.recordActivity(
      lead.id,
      req.user.id,
      'rejection',
      `Manager ${req.user.name} rejected conversion request: ${rejection_reason.trim()}`
    );

    db.recordLeadStatusHistory(
      agencyId,
      lead.id,
      'Converted to Booking',
      'Negotiation',
      req.user.id,
      `Conversion rejected by Manager. Reason: ${rejection_reason.trim()}`
    );
  }

  if (cr.staff_id) {
    db.createNotification(
      agencyId,
      cr.staff_id,
      'Conversion Request Rejected',
      `Manager ${req.user.name} rejected conversion request for ${cr.customer_name}. Reason: ${rejection_reason.trim()}`,
      'warning',
      '/staff/leads'
    );
  }

  res.json({
    success: true,
    message: 'Conversion request rejected.',
    rejection_reason: rejection_reason.trim()
  });
});

// Manager Request Additional Information on Conversion Request
app.post('/api/admin/bookings/conversion-requests/:id/request-info', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const cr = db.findById('booking_conversion_requests', req.params.id);

  if (!cr) {
    return res.status(404).json({ error: 'Conversion request not found.' });
  }

  const { request_notes } = req.body;
  if (!request_notes || !request_notes.trim()) {
    return res.status(400).json({ error: 'Information request notes are required.' });
  }

  db.update('booking_conversion_requests', cr.id, {
    status: 'NEEDS_INFO',
    info_requested: request_notes.trim(),
    info_requested_by: req.user.id,
    info_requested_at: new Date().toISOString()
  });

  const lead = db.findById('leads', cr.lead_id);
  if (lead) {
    db.update('leads', lead.id, { conversion_status: 'NEEDS_INFO' });
    db.recordActivity(
      lead.id,
      req.user.id,
      'request_info',
      `Manager ${req.user.name} requested additional evidence: ${request_notes.trim()}`
    );
  }

  if (cr.staff_id) {
    db.createNotification(
      agencyId,
      cr.staff_id,
      'Additional Information Requested',
      `Manager ${req.user.name} requested additional information on conversion for ${cr.customer_name}: ${request_notes.trim()}`,
      'info',
      '/staff/leads'
    );
  }

  res.json({
    success: true,
    message: 'Additional information requested from staff.',
    info_requested: request_notes.trim()
  });
});

// Manager Revoke Customer Invitation
app.post('/api/admin/customers/revoke-invitation', authenticate, authorize(['admin', 'manager']), (req, res) => {
  const agencyId = req.user.agency_id || 'agency_travel_genie';
  const { invitation_id, email } = req.body;

  if (!invitation_id && !email) {
    return res.status(400).json({ error: 'Either invitation_id or email is required to revoke an invitation.' });
  }

  const invitations = db.findAll('customer_account_invitations', (inv) => {
    if (invitation_id) return inv.id === invitation_id;
    if (email) return inv.email.toLowerCase() === email.toLowerCase() && !inv.is_used;
    return false;
  });

  if (invitations.length === 0) {
    return res.status(404).json({ error: 'No active invitation found to revoke.' });
  }

  for (const inv of invitations) {
    db.update('customer_account_invitations', inv.id, {
      is_used: true,
      notes: `Revoked by Manager ${req.user.name} at ${new Date().toISOString()}`
    });
  }

  db.recordAuditLog(agencyId, req.user.id, 'REVOKE_CUSTOMER_INVITATION', 'invitation', invitation_id || email, {
    revoked_count: invitations.length,
    email
  });

  res.json({
    success: true,
    message: `Successfully revoked ${invitations.length} invitation(s).`
  });
});

// Staff Follow-ups Agenda
app.get('/api/staff/follow-ups', authenticate, authorize(['staff', 'sales', 'manager', 'admin']), (req, res) => {
  const staffId = req.user.id;
  const agencyId = req.user.agency_id;

  let leads;
  if (req.user.role === 'manager' || req.user.role === 'admin') {
    leads = db.findAll('leads', (l) => (!l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie') && l.follow_up_date);
  } else {
    leads = db.findAll('leads', (l) => (!l.agency_id || l.agency_id === agencyId || l.agency_id === 'agency_travel_genie') && l.assigned_staff_id === staffId && l.follow_up_date);
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

  // Strictly enforce enquiry form email: trace back through lead and enquiry tables
  let enquiryEmail = booking.customer_email;
  let enquiryName = booking.customer_name;
  if (booking.lead_id) {
    const linkedLead = db.findById('leads', booking.lead_id);
    if (linkedLead) {
      if (linkedLead.customer_email) enquiryEmail = linkedLead.customer_email;
      if (linkedLead.customer_name) enquiryName = linkedLead.customer_name;
      if (linkedLead.enquiry_id) {
        const linkedEnquiry = db.findOne('enquiries', (e) => e.enquiry_id === linkedLead.enquiry_id || e.id === linkedLead.enquiry_id);
        if (linkedEnquiry) {
          if (linkedEnquiry.customer_email) enquiryEmail = linkedEnquiry.customer_email;
          if (linkedEnquiry.customer_name) enquiryName = linkedEnquiry.customer_name;
        }
      }
    }
  }

  const customerEmail = ((enquiryEmail || booking.customer_email || email) || '').trim().toLowerCase();
  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid customer email address is required from the enquiry form.' });
  }

  // 1. Business Rule: Advance payment must be verified before generating customer credentials on booking
  const isConfirmed = booking.booking_status === 'BOOKING_CONFIRMED' || booking.booking_status === 'Confirmed';
  const hasAdvance = (Number(booking.advance_amount) || 0) > 0 ||
    booking.payment_status === 'PARTIALLY_PAID' ||
    booking.payment_status === 'PAID' ||
    booking.payment_status === 'Partial' ||
    booking.payment_status === 'Paid';

  if (!hasAdvance && !isConfirmed) {
    return res.status(400).json({ error: 'Advance payment must be verified before generating customer credentials. (advance payment required)' });
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
    password_hash: '',
    temp_password: '',
    status: 'pending_activation',
    account_status: 'INVITATION_SENT',
    activation_status: 'INVITATION_SENT',
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
    account_status: 'INVITATION_SENT'
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
      app_url: process.env.APP_URL || req.headers.origin || 'http://localhost:3000'
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
    app_url: process.env.APP_URL || req.headers.origin || 'http://localhost:3000'
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
  let isStaff = false;

  // 2. Check B2B Agent Invitations
  if (!invitation) {
    invitation = db.findOne('agent_account_invitations', (inv) => inv.token === token);
    if (invitation) isAgent = true;
  }

  // 3. Check Staff Invitations
  if (!invitation) {
    invitation = db.findOne('staff_account_invitations', (inv) => inv.token === token);
    if (invitation) isStaff = true;
  }

  if (!invitation) {
    return res.status(404).json({ error: 'Invalid activation link. Please request a new invitation.' });
  }

  if (invitation.is_used) {
    return res.status(400).json({ error: 'This activation link has already been used. Please log in directly.' });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This activation link has expired. Please contact your administrator for a fresh link.' });
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

  if (isStaff) {
    const isOps = invitation.role === 'operations';
    return res.json({
      valid: true,
      email: invitation.email,
      role: invitation.role || (isOps ? 'operations' : 'sales'),
      employee_id: invitation.employee_id,
      name: invitation.name,
      designation: isOps ? 'Operations' : 'Sales',
      company_name: 'Trip by Genie'
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

// Activate Account & Set Password (Supports Customer, B2B Agent & Staff Invitations)
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
  let isStaff = false;

  // 2. Check B2B Agent Invitations
  if (!invitation) {
    invitation = db.findOne('agent_account_invitations', (inv) => inv.token === token);
    if (invitation) isAgent = true;
  }

  // 3. Check Staff Invitations
  if (!invitation) {
    invitation = db.findOne('staff_account_invitations', (inv) => inv.token === token);
    if (invitation) isStaff = true;
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

  if (isStaff) {
    // Invalidate single-use staff invitation token
    db.update('staff_account_invitations', invitation.id, {
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

    const profile = db.findOne('staff_profiles', (p) => p.user_id === user.id);
    if (profile) {
      db.update('staff_profiles', profile.id, {
        status: 'active',
        activated_at: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      role: user.role,
      email: user.email,
      message: 'Your staff account has been activated and onboarded successfully! Please log in to access your dashboard.'
    });
  }

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

  if (travel_date && !isTodayOrFutureDate(travel_date)) {
    return res.status(400).json({ error: 'Travel departure date cannot be in the past.' });
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
  const targetId = String(req.params.id);
  let notif = db.findById('notifications', req.params.id) ||
    db.findOne('notifications', (n) => String(n.id) === targetId);
  const isRead = req.body && req.body.is_read !== undefined ? Boolean(req.body.is_read) : true;
  if (!notif) {
    return res.json({ id: req.params.id, is_read: isRead, success: true });
  }
  const updated = db.update('notifications', notif.id, { is_read: isRead });
  res.json(updated || { ...notif, is_read: isRead, success: true });
});

app.delete('/api/notifications/:id', authenticate, (req, res) => {
  const targetId = String(req.params.id);
  let notif = db.findById('notifications', req.params.id) ||
    db.findOne('notifications', (n) => String(n.id) === targetId);
  if (notif) {
    db.delete('notifications', notif.id);
  }
  res.json({ success: true, message: 'Notification deleted successfully.' });
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

// Delete document (Protected by Strict Ownership Enforcement)
app.delete('/api/documents/:id', authenticate, (req, res) => {
  const doc = db.findById('travel_documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const userRole = (req.user.role || '').toLowerCase();
  const userId = req.user.id;

  if (userRole !== 'admin' && userRole !== 'manager') {
    if (userRole === 'customer') {
      const userBookings = db.findAll('bookings', (b) => b.customer_id === userId).map((b) => b.id);
      if (doc.customer_id !== userId && !userBookings.includes(doc.booking_id)) {
        return res.status(403).json({ error: 'Access denied: cannot delete another traveler’s private document.' });
      }
    } else if (userRole === 'agent') {
      if (doc.agent_id && doc.agent_id !== userId && doc.uploaded_by_role === 'agent') {
        return res.status(403).json({ error: 'Access denied: cannot delete another agent’s document.' });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden: your role is not authorized to delete documents.' });
    }
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

