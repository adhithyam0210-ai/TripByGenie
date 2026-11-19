/**
 * B2B Agent Reseller Routes
 * Endpoint Prefix: /api/v1/agent
 * RBAC: Restricted to AGENT and ADMIN roles (except payment gateway webhooks)
 */

const express = require('express');
const router = express.Router();
const agentController = require('../../controllers/agent.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { ROLES } = require('../../constants');

// Public Payment Webhook (unauthenticated / signature-verified)
router.post('/orders/webhook', (req, res, next) => agentController.handlePaymentWebhook(req, res, next));

// All subsequent routes require AGENT or ADMIN authentication
router.use(authenticate, authorize(ROLES.AGENT, ROLES.ADMIN));

// B2B Wholesale Catalog with Wholesale Discount & Profit Margin Data
router.get('/catalog', (req, res, next) => agentController.getCatalog(req, res, next));

// Place Wholesale Resale Order (with Idempotency key guard)
router.post('/orders', (req, res, next) => agentController.createOrder(req, res, next));

// Agent Order History & Status
router.get('/orders', (req, res, next) => agentController.getMyOrders(req, res, next));
router.get('/orders/:orderId', (req, res, next) => agentController.getOrderById(req, res, next));

// Download White-Labeled Voucher for End Client
router.get('/orders/:orderId/voucher', (req, res, next) => agentController.getVoucher(req, res, next));

module.exports = router;
