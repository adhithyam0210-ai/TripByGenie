/**
 * Authentication & Identity Routes
 * Endpoint Prefix: /api/v1/auth
 */

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// Public endpoints
router.post('/signup', (req, res, next) => authController.signUp(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Authenticated session profile
router.get('/me', authenticate, (req, res, next) => authController.getProfile(req, res, next));

module.exports = router;
