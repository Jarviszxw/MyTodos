/**
 * Authentication Controller
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/app');

/**
 * User Registration
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate request data
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
        message: 'Username and password are required'
      });
    }
    
    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        error: 'Username already exists',
        message: 'Username already exists'
      });
    }
    
    // Create new user
    const user = await User.create(username, password);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Return user info and token (without password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

/**
 * User Login
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate request data
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
        message: 'Username and password are required'
      });
    }
    
    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid username or password'
      });
    }
    
    // Verify password
    const isValidPassword = await User.verifyPassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid username or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Return user info and token (without password)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get Current User Information
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getCurrentUser = async (req, res) => {
  try {
    // User info added by auth middleware
    const { user } = req;
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
}; 