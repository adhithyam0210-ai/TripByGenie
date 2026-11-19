/**
 * Centralized Application Error Handling Middleware
 */

const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[UNHANDLED_ERROR]', {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    return sendError(res, 400, 'FILE_UPLOAD_ERROR', err.message);
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'MALFORMED_JSON', 'The request body contains invalid JSON');
  }

  // Custom application error with status
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.message || 'An unexpected error occurred processing your request';

  return sendError(res, statusCode, errorCode, errorMessage, err.details || null);
};

module.exports = {
  errorHandler
};
