import { config } from '../config/env.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const fieldErrors = {};
    Object.keys(err.errors).forEach(key => {
      fieldErrors[key] = err.errors[key].message;
    });
    
    return res.status(400).json({
      message: 'Validation failed',
      fieldErrors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      fieldErrors: {
        [field]: `This ${field} is already registered`
      }
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    message,
    // Only show stack trace in development
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
};
