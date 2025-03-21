/**
 * User Model
 * 用户模型
 */

const db = require('./db');
const bcrypt = require('bcryptjs');

class User {
  /**
   * 创建新用户
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} - 新创建的用户
   */
  static async create(username, password) {
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );
    
    return result.rows[0];
  }
  
  /**
   * 通过用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} - 查找到的用户或null
   */
  static async findByUsername(username) {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * 通过ID查找用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} - 查找到的用户或null
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT id, username, created_at FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * 验证用户密码
   * @param {Object} user - 用户对象
   * @param {string} password - 待验证的密码
   * @returns {Promise<boolean>} - 验证结果
   */
  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }
  
  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} - 更新后的用户
   */
  static async update(id, data) {
    // 构建更新查询
    const fields = [];
    const values = [];
    let paramCounter = 1;
    
    // 处理可更新字段
    if (data.username) {
      fields.push(`username = $${paramCounter++}`);
      values.push(data.username);
    }
    
    // 处理密码更新
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);
      fields.push(`password_hash = $${paramCounter++}`);
      values.push(passwordHash);
    }
    
    // 如果没有要更新的字段，返回null
    if (fields.length === 0) {
      return null;
    }
    
    // 添加用户ID作为最后一个参数
    values.push(id);
    
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCounter} RETURNING id, username, created_at`,
      values
    );
    
    return result.rows[0];
  }
}

module.exports = User; 