/**
 * TRIPBYGENIE ENTERPRISE SECURITY: RBAC & DATA OWNERSHIP MIDDLEWARE
 * Enforces:
 * 1. Centralized Deny-By-Default Role-Based Access Control
 * 2. Cross-User and Cross-Tenant Data Isolation
 * 3. Insecure Direct Object Reference (IDOR) Protection
 */

const { sendError } = require('../utils/response');
const db = require('../../db');

// Role synonyms mapping for backward compatibility
const ROLE_SYNONYMS = {
  ADMIN: ['ADMIN'],
  MANAGER: ['MANAGER', 'ADMIN'],
  STAFF: ['STAFF', 'SALES_EXECUTIVE', 'SALES', 'MANAGER', 'ADMIN'],
  SALES_EXECUTIVE: ['SALES_EXECUTIVE', 'STAFF', 'SALES', 'MANAGER', 'ADMIN'],
  OPERATIONS: ['OPERATIONS', 'OPERATIONS_EXECUTIVE', 'MANAGER', 'ADMIN'],
  OPERATIONS_EXECUTIVE: ['OPERATIONS_EXECUTIVE', 'OPERATIONS', 'MANAGER', 'ADMIN'],
  AGENT: ['AGENT', 'ADMIN'],
  CUSTOMER: ['CUSTOMER', 'ADMIN']
};

/**
 * Authorize route for allowed roles
 * Usage: authorize('ADMIN', 'MANAGER') or authorize(['admin', 'manager'])
 */
const authorize = (...allowedRoles) => {
  const flattened = allowedRoles.flat().map((r) => String(r).toUpperCase().trim());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required before permission verification.');
    }

    const userRole = (req.user.role || '').toUpperCase().trim();

    // Super Admin has universal access
    if (userRole === 'ADMIN') {
      return next();
    }

    // Check if user's role is in the allowed list or has a matching synonym
    const isAuthorized = flattened.some((allowed) => {
      if (allowed === userRole) return true;
      const synonyms = ROLE_SYNONYMS[allowed] || [];
      return synonyms.includes(userRole);
    });

    if (!isAuthorized) {
      return sendError(
        res,
        403,
        'FORBIDDEN_ROLE',
        `Access denied: insufficient permissions for role '${req.user.role}'. Required: [${flattened.join(', ')}]`
      );
    }

    next();
  };
};

/**
 * Mandatory Server-Side Ownership Validator (IDOR Prevention)
 * Verifies that the authenticated user owns or is authorized to access the specific resource.
 * Never trusts client-supplied user_id, agent_id, or customer_id.
 */
const requireOwnership = (resourceType, idParam = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
    }

    const userRole = req.user.role.toLowerCase();
    const userId = req.user.id;
    const resourceId = req.params[idParam] || req.body[idParam];

    if (!resourceId) {
      return next(); // Nothing to check on collective resource
    }

    // Super Admin has universal access
    if (userRole === 'admin') {
      return next();
    }

    let record = null;
    switch (resourceType) {
      case 'travel_documents':
      case 'documents':
        record = db.findById('travel_documents', resourceId);
        if (!record) return sendError(res, 404, 'NOT_FOUND', 'Document not found.');
        
        if (userRole === 'customer') {
          const userBookings = db.findAll('bookings', (b) => b.customer_id === userId).map((b) => b.id);
          const isOwner = record.customer_id === userId || userBookings.includes(record.booking_id);
          if (!isOwner) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: cannot access or modify another traveler’s private document.');
          }
        } else if (userRole === 'agent') {
          const isOwner = record.agent_id === userId || record.uploaded_by_role === 'agent';
          if (!isOwner) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: cannot access another agent’s document.');
          }
        }
        break;

      case 'bookings':
        record = db.findById('bookings', resourceId);
        if (!record) return sendError(res, 404, 'NOT_FOUND', 'Booking record not found.');

        if (userRole === 'customer') {
          if (record.customer_id !== userId && record.customer_email !== req.user.email) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: cannot access another traveler’s booking.');
          }
        } else if (userRole === 'agent') {
          if (record.agent_id !== userId) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: cannot access another travel agent’s booking.');
          }
        } else if (userRole === 'staff' || userRole === 'sales') {
          if (record.assigned_staff_id && record.assigned_staff_id !== userId) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: booking is assigned to a different staff member.');
          }
        }
        break;

      case 'leads':
      case 'crm_leads':
        record = db.findById('leads', resourceId) || db.findById('crm_leads', resourceId);
        if (!record) return sendError(res, 404, 'NOT_FOUND', 'Lead not found.');

        if (userRole === 'staff' || userRole === 'sales') {
          if (record.assigned_staff_id && record.assigned_staff_id !== userId) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: lead is assigned to another sales executive.');
          }
        }
        break;

      case 'agent_orders':
      case 'orders':
        record = db.findById('agent_orders', resourceId);
        if (!record) return sendError(res, 404, 'NOT_FOUND', 'Order not found.');

        if (userRole === 'agent') {
          if (record.agent_id !== userId) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: order belongs to another partner agency.');
          }
        }
        break;

      case 'users':
      case 'profile':
        if (userRole !== 'admin' && userRole !== 'manager') {
          if (resourceId !== userId) {
            return sendError(res, 403, 'FORBIDDEN_OWNERSHIP', 'Access denied: cannot modify another user profile.');
          }
        }
        break;

      default:
        break;
    }

    req.targetResource = record;
    next();
  };
};

module.exports = {
  authorize,
  requireOwnership,
  ROLE_SYNONYMS
};
