/**
 * Domain Enums and System Constants
 * Synchronized with PostgreSQL DDL Types
 */

const ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  AGENT: 'AGENT'
});

const PIPELINE_STAGES = Object.freeze({
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  CONTACTED: 'CONTACTED',
  QUOTE_SENT: 'QUOTE_SENT',
  NEGOTIATING: 'NEGOTIATING',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST'
});

// Allowed stage progression map to enforce state machine rules
const STAGE_TRANSITIONS = Object.freeze({
  NEW: ['ASSIGNED', 'CONTACTED', 'LOST'],
  ASSIGNED: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUOTE_SENT', 'LOST'],
  QUOTE_SENT: ['NEGOTIATING', 'CONVERTED', 'LOST'],
  NEGOTIATING: ['QUOTE_SENT', 'CONVERTED', 'LOST'],
  CONVERTED: [], // Terminal state
  LOST: ['NEW']  // Can only be reopened back to NEW
});

const INTERACTION_CHANNELS = Object.freeze({
  CALL: 'CALL',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  NOTE: 'NOTE'
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
});

module.exports = {
  ROLES,
  PIPELINE_STAGES,
  STAGE_TRANSITIONS,
  INTERACTION_CHANNELS,
  PAYMENT_STATUS
};
