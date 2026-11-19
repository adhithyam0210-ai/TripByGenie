/**
 * JWT Authentication Middleware
 * Validates Bearer token, decodes user credentials, and verifies account active status.
 */

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const userRepository = require('../repositories/user.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'travel_genie_super_secure_jwt_secret_2026';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid Bearer format');
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'TOKEN_EXPIRED', 'Your authentication session has expired. Please log in again.');
      }
      return sendError(res, 401, 'INVALID_TOKEN', 'Malformed or signature-invalid authentication token');
    }

    // Hydrate user from repository
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return sendError(res, 401, 'USER_NOT_FOUND', 'User matching this authentication token does not exist');
    }

    if (user.is_active === false || user.status === 'inactive') {
      return sendError(res, 403, 'ACCOUNT_DEACTIVATED', 'This user account has been deactivated. Please contact administration.');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE_ERROR]', error);
    return sendError(res, 500, 'AUTH_INTERNAL_ERROR', 'Internal error verifying authentication credentials');
  }
};

module.exports = {
  authenticate,
  JWT_SECRET
};
