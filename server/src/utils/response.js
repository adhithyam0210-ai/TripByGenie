/**
 * Standardized JSON API Envelope Helper
 * All endpoints return this uniform structure:
 * Success: { success: true, data: ..., meta: ... }
 * Failure: { success: false, error: { code, message, details } }
 */

const sendSuccess = (res, data, statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    data
  };

  if (meta && typeof meta === 'object') {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (res, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', message = 'An unexpected error occurred', details = null) => {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};
