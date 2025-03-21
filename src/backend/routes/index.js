/**
 * Routes Index
 */

const express = require('express');
const router = express.Router();
const config = require('../config/app');

const authRoutes = require('./authRoutes');
const todoRoutes = require('./todoRoutes');

// Versioned API path
const apiPrefix = `${config.api.prefix}`;

// Register all routes
router.use(`${apiPrefix}/auth`, authRoutes);
router.use(`${apiPrefix}/todos`, todoRoutes);

// API status check route
router.get(`${apiPrefix}/status`, (req, res) => {
  res.json({
    status: 'online',
    time: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    env: config.server.env
  });
});

module.exports = router; 