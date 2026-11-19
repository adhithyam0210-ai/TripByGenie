/**
 * Public Data Routes
 * Endpoint Prefix: /api/v1/public
 */

const express = require('express');
const router = express.Router();
const publicController = require('../../controllers/public.controller');

// Public landing page aggregate (strictly B2C retail prices only)
router.get('/landing-data', (req, res, next) => publicController.getLandingData(req, res, next));

module.exports = router;
