/**
 * Application Configuration
 */

require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // API version configuration
  api: {
    prefix: '/api',
    version: 'v1',
  },
  
  // JWT authentication configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}; 