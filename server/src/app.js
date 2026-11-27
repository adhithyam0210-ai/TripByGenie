/**
 * TripByGenie Express Application Factory
 * Configures middleware, API v1 routing, and global error handling
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const v1Routes = require('./routes/v1');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads static directory
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[STORAGE] Read-only filesystem detected, uploads directory deferred:', e.message);
}
app.use('/uploads', express.static(uploadDir));

// Mount API v1 Master Router
app.use('/api/v1', v1Routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
