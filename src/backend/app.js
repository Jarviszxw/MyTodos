/**
 * Main Application
 * 执行时机：1. 在服务器启动时按顺序执行一次  2.each HTTP requests server，Express 会按照中间件的注册顺序依次调用这些中间件。
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/app');
const initAllTables = require('./scripts/db-init');

// Create Express application
const app = express();

// 初始化数据库表
initAllTables()
  .then(success => {
    if (success) {
      console.log('Database ready for use');
    } else {
      console.warn('Database initialization had issues, but app will continue');
    }
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://mytodos-udxk.onrender.com", process.env.CORS_ORIGIN || "*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));

// Request body parsers
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// Request logging
if (config.server.env !== 'test') {
  app.use(morgan(config.server.env === 'development' ? 'dev' : 'combined'));
}

// Static file service
app.use(express.static(path.join(__dirname, '../../src/frontend/build')));

// Register API routes
app.use(routes);

// Frontend route support
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/frontend/build/index.html'));
});

// 404 error handler
app.use(errorHandler.notFoundHandler);

// Validation error handler
app.use(errorHandler.validationErrorHandler);

// Global error handler
app.use(errorHandler.errorHandler);

module.exports = app; 