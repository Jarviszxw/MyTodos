/**
 * Error Handler Middleware
 */

const config = require('../config/app');

/**
 * 404 Error Handler Middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set default status code
  const statusCode = err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    error: true,
    message: err.message || 'Internal Server Error',
    stack: undefined
  };
  
  // Add stack trace in development environment
  if (config.server.env === 'development') {
    console.error(`[Error] ${err.message}`);
    console.error(err.stack);
    errorResponse.stack = err.stack;
  }
  
  // Log error (all environments)
  console.error(`Error ${statusCode}: ${err.message}`);
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Validation Error Handler Middleware
 */
const validationErrorHandler = (err, req, res, next) => {
  // Check if validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: true,
      message: 'Validation Error',
      details: err.details || err.message
    });
  }
  
  // Not a validation error, pass to next error handler
  next(err);
};

module.exports = {
  notFoundHandler,
  errorHandler,
  validationErrorHandler
}; 