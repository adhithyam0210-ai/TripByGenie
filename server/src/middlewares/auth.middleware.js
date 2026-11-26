/**
 * TRIPBYGENIE ENTERPRISE SECURITY: ZERO-TRUST AUTHENTICATION MIDDLEWARE
 * Supports dual credential resolution:
 * 1. Authorization: Bearer <token> (API Clients, Mobile, Automated Test Suites)
 * 2. HttpOnly Cookie: tg_access_token (Web Browser SPAs)
 * Enforces account state verification and immediate session revocation.
 */

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const db = require('../../db');

const JWT_SECRET = process.env.JWT_SECRET || 'travel_genie_super_secure_jwt_secret_2026';

/**
 * Mandatory Authentication Guard
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Resolve token from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to HttpOnly Cookie if not in header
    if (!token && req.cookies && req.cookies.tg_access_token) {
      token = req.cookies.tg_access_token;
    }

    if (!token) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required. No token provided.');
    }

    // 3. Verify JWT Signature and Expiration
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'TOKEN_EXPIRED', 'Your authentication session has expired. Please refresh your session or log in again.');
      }
      return sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired token.');
    }

    // 4. Hydrate user from database
    const user = db.findById('users', decoded.id) || db.findOne('users', (u) => u.email.toLowerCase() === (decoded.email || '').toLowerCase());
    if (!user) {
      return sendError(res, 401, 'USER_NOT_FOUND', 'User not found or account is deactivated.');
    }

    // 5. Account active and suspension checks
    if (user.status === 'suspended') {
      return sendError(res, 403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Please contact administrator.');
    }
    if (user.is_active === false || user.status === 'inactive' || user.status === 'pending_activation') {
      return sendError(res, 403, 'ACCOUNT_DEACTIVATED', 'Your account is pending activation or has been deactivated. Please contact administrator.');
    }

    // 6. Global session invalidation check
    if (user.tokens_invalidated_before && decoded.iat) {
      const tokenIatMs = decoded.iat * 1000;
      const invalidatedBeforeMs = new Date(user.tokens_invalidated_before).getTime();
      if (tokenIatMs < invalidatedBeforeMs) {
        return sendError(res, 401, 'SESSION_INVALIDATED', 'Your session has been terminated due to a password change or security update. Please log in again.');
      }
    }

    // Attach verified user to request
    req.user = {
      ...user,
      id: user.id,
      email: user.email,
      role: (user.role || 'customer').toLowerCase(),
      userRole: (user.role || 'customer').toUpperCase(),
      agency_id: user.agency_id || 'agency_travel_genie',
      name: user.name || user.full_name || 'User'
    };

    next();
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE_ERROR]', error);
    return sendError(res, 500, 'AUTH_INTERNAL_ERROR', 'Internal security verification error.');
  }
};

/**
 * Optional Authentication (Attaches user if valid token present, otherwise proceeds anonymously)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.tg_access_token) {
    token = req.cookies.tg_access_token;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findById('users', decoded.id);
    if (user && user.status === 'active') {
      req.user = {
        ...user,
        role: (user.role || 'customer').toLowerCase(),
        userRole: (user.role || 'customer').toUpperCase()
      };
    }
  } catch (e) {
    // Ignore invalid optional tokens
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  JWT_SECRET
};
