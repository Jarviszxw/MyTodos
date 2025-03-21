/**
 * Authentication Middleware
 * 身份验证中间件
 */

const jwt = require('jsonwebtoken');
const config = require('../config/app');
const User = require('../models/User');

/**
 * 身份验证中间件
 * 验证请求头中的JWT令牌，并将用户信息添加到请求对象
 */
const auth = async (req, res, next) => {
  try {
    // 获取请求头中的Authorization
    const authHeader = req.headers.authorization;
    
    // 检查请求头是否存在
    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization token provided',
        message: '未提供授权令牌'
      });
    }
    
    // 解析Bearer令牌
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: '无效的令牌格式'
      });
    }
    
    // 验证JWT令牌
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: '用户不存在'
        });
      }
      
      // 将用户信息添加到请求对象
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        error: 'Token verification failed',
        message: '令牌验证失败'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: '服务器内部错误'
    });
  }
};

/**
 * 可选的身份验证中间件
 * 验证令牌但不强制要求登录
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // 没有令牌，继续但不设置用户
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);
      
      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // 令牌无效，但继续执行
      console.warn('Optional auth token invalid:', error);
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    return next();
  }
};

module.exports = {
  auth,
  optionalAuth
}; 