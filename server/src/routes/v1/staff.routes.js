/**
 * Staff CRM Pipeline Routes
 * Endpoint Prefix: /api/v1/staff
 * RBAC: Restricted to STAFF and ADMIN roles
 */

const express = require('express');
const router = express.Router();
const staffController = require('../../controllers/staff.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { ROLES } = require('../../constants');

// Apply STAFF/ADMIN guard to all routes
router.use(authenticate, authorize(ROLES.STAFF, ROLES.ADMIN));

// Personal Assigned Queue
router.get('/leads/my-queue', (req, res, next) => staffController.getMyQueue(req, res, next));

// Interaction Logging (Calls, WhatsApp, Emails, Notes)
router.get('/leads/:leadId/interactions', (req, res, next) => staffController.getInteractions(req, res, next));
router.post('/leads/:leadId/interactions', (req, res, next) => staffController.logInteraction(req, res, next));

// CRM Pipeline Stage Progression
router.patch('/leads/:leadId/stage', (req, res, next) => staffController.updateStage(req, res, next));

// Travel Voucher Generation (when stage = CONVERTED)
router.post('/leads/:leadId/voucher', (req, res, next) => staffController.triggerVoucher(req, res, next));

module.exports = router;
