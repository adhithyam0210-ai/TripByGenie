/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role restrictions at the controller/route level.
 * Prevents unauthorized privilege escalation.
 */

const { sendError } = require('../utils/response');

/**
 * Enforce one or more permitted roles for the route
 * @param  {...string} allowedRoles (e.g. 'ADMIN', 'STAFF')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(
        res,
        401,
        'UNAUTHENTICATED',
        'Authentication required before role verification'
      );
    }

    const userRole = req.user.role.toUpperCase();
    const formattedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (!formattedAllowed.includes(userRole)) {
      return sendError(
        res,
        403,
        'FORBIDDEN_ROLE',
        `Access denied: insufficient permissions for role '${userRole}'. Required: [${formattedAllowed.join(', ')}]`
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
