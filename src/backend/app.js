/**
 * Main Application
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/app');

// Create Express application
const app = express();

// Security middleware
app.use(helmet()); // Set secure HTTP headers

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
// app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use(express.static(path.join(__dirname, '../../src/frontend/build')));

// Register API routes
app.use(routes);

// Frontend route support
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
// });

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