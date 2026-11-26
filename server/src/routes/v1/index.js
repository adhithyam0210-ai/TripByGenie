/**
 * API v1 Master Router Assembler
 * Mounts all sub-routers under /api/v1/...
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const publicRoutes = require('./public.routes');
const adminRoutes = require('./admin.routes');
const staffRoutes = require('./staff.routes');
const agentRoutes = require('./agent.routes');
const privacyRoutes = require('./privacy.routes');

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/staff', staffRoutes);
router.use('/agent', agentRoutes);
router.use('/privacy', privacyRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    version: '1.0.0',
    service: 'tripbygenie-backend-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
