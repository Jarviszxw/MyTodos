/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// User registration - POST /api/auth/register
router.post('/register', authController.register);

// User login - POST /api/auth/login
router.post('/login', authController.login);

// Get current user - GET /api/auth/me (requires authentication)
router.get('/me', auth, authController.getCurrentUser);

module.exports = router; 