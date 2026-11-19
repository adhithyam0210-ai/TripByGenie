/**
 * Authentication & Identity Service
 * Implements atomic customer registration and CRM auto-lead generation
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const leadRepository = require('../repositories/lead.repository');
const packageRepository = require('../repositories/package.repository');
const { withTransaction } = require('../config/database');
const { generateUserCode } = require('../utils/codeGenerator');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

class AuthService {
  /**
   * Atomic Customer Sign-up with Lead Generation
   * Workflow A: Public Browsing -> Sign-Up -> Auto-Lead Generation
   */
  async signUp(payload) {
    const { full_name, email, password, phone, package_id, pax_count, travel_date, notes } = payload;

    if (!email || !password || !full_name) {
      const err = new Error('Full name, email and password are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // Check duplicate email
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('An account with this email address already exists');
      err.statusCode = 409;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const user_code = generateUserCode('CUSTOMER');

    // Execute atomic transaction for user + lead creation
    const result = await withTransaction(async (client) => {
      // 1. Create Customer User
      const user = await userRepository.create({
        user_code,
        full_name,
        email,
        phone,
        password_hash,
        role: 'CUSTOMER'
      }, client);

      let lead = null;

      // 2. If package inquiry attached, atomically generate CRM Lead
      if (package_id) {
        const pkg = await packageRepository.findById(package_id);
        lead = await leadRepository.create({
          customer_id: user.id,
          customer_name: user.full_name,
          customer_email: user.email,
          customer_phone: user.phone,
          package_id: package_id,
          package_title: pkg ? (pkg.title || pkg.name) : 'Custom Package',
          travel_date: travel_date || null,
          pax_count: pax_count ? parseInt(pax_count, 10) : 2,
          pipeline_stage: 'NEW',
          source: 'WEBSITE_SIGNUP_PACKAGE_SELECTION',
          customer_notes: notes || null
        }, client);
      }

      return { user, lead };
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: result.user.id,
        user_code: result.user.user_code,
        email: result.user.email,
        role: result.user.role,
        name: result.user.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: result.user.id,
        user_code: result.user.user_code,
        full_name: result.user.full_name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role
      },
      token,
      generated_lead: result.lead ? {
        id: result.lead.id,
        pipeline_stage: result.lead.pipeline_stage,
        package_id: result.lead.package_id
      } : null
    };
  }

  /**
   * Unified Login for all 4 roles
   */
  async login(identifier, password) {
    if (!identifier || !password) {
      const err = new Error('Email or User Code and password are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    let user = null;
    if (identifier.includes('@')) {
      user = await userRepository.findByEmail(identifier);
    } else {
      user = await userRepository.findByUserCode(identifier);
    }

    if (!user) {
      const err = new Error('Invalid login credentials');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash || user.password);
    if (!isMatch) {
      const err = new Error('Invalid login credentials');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (user.is_active === false || user.status === 'inactive') {
      const err = new Error('Your account has been deactivated. Please contact an administrator.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DEACTIVATED';
      throw err;
    }

    const token = jwt.sign(
      {
        id: user.id,
        user_code: user.user_code || user.staff_id || user.agent_code,
        email: user.email,
        role: (user.role || 'CUSTOMER').toUpperCase(),
        name: user.full_name || user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        user_code: user.user_code || user.staff_id || user.agent_code,
        full_name: user.full_name || user.name,
        email: user.email,
        phone: user.phone,
        role: (user.role || 'CUSTOMER').toUpperCase()
      },
      token
    };
  }
}

module.exports = new AuthService();
