/**
 * Admin Operations & CMS Routes
 * Endpoint Prefix: /api/v1/admin
 * RBAC: Strictly restricted to ADMIN role
 */

const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { ROLES } = require('../../constants');

// Apply strict ADMIN guard to all routes in this router
router.use(authenticate, authorize(ROLES.ADMIN));

// CMS: Tour Packages (Dual Pricing)
router.get('/packages', (req, res, next) => adminController.getPackages(req, res, next));
router.post('/packages', (req, res, next) => adminController.createPackage(req, res, next));
router.put('/packages/:id', (req, res, next) => adminController.updatePackage(req, res, next));

// CMS: Hero Banners
router.get('/banners', (req, res, next) => adminController.getBanners(req, res, next));
router.post('/banners', (req, res, next) => adminController.createBanner(req, res, next));
router.put('/banners/:id', (req, res, next) => adminController.updateBanner(req, res, next));
router.delete('/banners/:id', (req, res, next) => adminController.deleteBanner(req, res, next));

// User Provisioning (STAFF & AGENT credentials creation)
router.post('/users', (req, res, next) => adminController.provisionUser(req, res, next));
router.get('/staff', (req, res, next) => adminController.getStaffList(req, res, next));
router.get('/agents', (req, res, next) => adminController.getAgentsList(req, res, next));

// CRM Lead Governance & Assignment
router.get('/leads', (req, res, next) => adminController.getLeads(req, res, next));
router.patch('/leads/:leadId/assign', (req, res, next) => adminController.assignLead(req, res, next));

// B2B Wholesale Revenue & Ledger Audit
router.get('/orders', (req, res, next) => adminController.getOrdersAudit(req, res, next));

module.exports = router;
