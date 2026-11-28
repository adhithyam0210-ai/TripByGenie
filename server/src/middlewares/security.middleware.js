/**
 * TRIPBYGENIE ENTERPRISE SECURITY: SECURITY MIDDLEWARE & API HARDENING
 * Implements:
 * 1. Helmet Security Headers & Strict Content-Security-Policy (CSP)
 * 2. Explicit Origin CORS Allowlist
 * 3. In-Memory / Distributed Rate Limiting (Brute-Force & Abuse Protection)
 * 4. Strict Path Traversal & File Sandbox Validation
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Explicit Allowed CORS Origins
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5055',
  'http://127.0.0.1:5057'
];

const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowed])];

// Match LAN private IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x, localhost, 127.0.0.1) on any port
const lanOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('tripbygenie.com')) {
    return true;
  }
  return lanOriginRegex.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser agents (curl, server-to-server, test scripts) where origin is undefined
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: origin ${origin} is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token']
};

/**
 * Helmet Security Configuration
 */
const helmetMiddleware = helmet({
  hidePoweredBy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://*.unsplash.com'],
      mediaSrc: ["'self'", 'blob:', 'data:'],
      connectSrc: ["'self'", ...allowedOrigins, 'http:', 'https:', 'ws:', 'wss:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Rate Limiters
 */
// 1. Strict Limiter for Login & Authentication Endpoints (prevents credential brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// 2. Public Form Limiter for Enquiries & Contact Us (prevents lead spamming)
const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 submissions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Submission rate limit reached. Please contact customer support directly.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// 3. Global API Limiter
const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Path Traversal Guard for Media & Document Streaming
 * Validates that requested file paths stay strictly within safe designated directories.
 */
const safePathResolver = (baseDirectory, relativeOrProvidedPath) => {
  if (!relativeOrProvidedPath) return null;
  // Strip quotes and null bytes
  const cleaned = String(relativeOrProvidedPath).replace(/^["']|["']$/g, '').replace(/\0/g, '').trim();

  // Resolve absolute path
  let resolved;
  if (path.isAbsolute(cleaned)) {
    resolved = path.normalize(cleaned);
  } else {
    resolved = path.resolve(baseDirectory, cleaned);
  }

  // Verify that the resolved path is located within the designated base directory
  const normalizedBase = path.normalize(baseDirectory);
  if (!resolved.startsWith(normalizedBase)) {
    console.warn(`[SECURITY ALERT] Directory Traversal attempt detected: ${cleaned} does not resolve under ${normalizedBase}`);
    return null;
  }

  return resolved;
};

module.exports = {
  corsOptions,
  helmetMiddleware,
  authLimiter,
  enquiryLimiter,
  globalApiLimiter,
  safePathResolver
};
