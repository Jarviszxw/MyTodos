/**
 * Todo Model
 */

const db = require('./db');

class Todo {
  /**
   * Get all todos for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of todo items
   */
  static async findAll(userId) {
    const result = await db.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows;
  }
  
  /**
   * Get a todo by ID
   * @param {number} id - Todo ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>} - Todo item or null
   */
  static async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Create a new todo
   * @param {Object} data - Todo data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Newly created todo
   */
  static async create(data, userId) {
    const { title, completed = false } = data;
    
    const result = await db.query(
      'INSERT INTO todos (title, completed, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, completed, userId]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update a todo
   * @param {number} id - Todo ID
   * @param {Object} data - Update data
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>} - Updated todo or null
   */
  static async update(id, data, userId) {
    // Check if todo exists
    const todo = await this.findById(id, userId);
    if (!todo) {
      return null;
    }
    
    // Build update query
    const fields = [];
    const values = [];
    let paramCounter = 1;
    
    // Handle updatable fields
    if (data.title !== undefined) {
      fields.push(`title = $${paramCounter++}`);
      values.push(data.title);
    }
    
    if (data.completed !== undefined) {
      fields.push(`completed = $${paramCounter++}`);
      values.push(data.completed);
    }
    
    // If no fields to update, return original todo
    if (fields.length === 0) {
      return todo;
    }
    
    // Add last update timestamp
    fields.push(`updated_at = NOW()`);
    
    // Add ID and user ID as query condition parameters
    values.push(id);
    values.push(userId);
    
    const result = await db.query(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = $${paramCounter++} AND user_id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }
  
  /**
   * Delete a todo
   * @param {number} id - Todo ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>} - Returns true if deletion successful, otherwise false
   */
  static async delete(id, userId) {
    // Check if todo exists
    const todo = await this.findById(id, userId);
    if (!todo) {
      return false;
    }
    
    await db.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return true;
  }
  
  /**
   * Toggle the completion status of a todo
   * @param {number} id - Todo ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>} - Updated todo or null
   */
  static async toggleComplete(id, userId) {
    const todo = await this.findById(id, userId);
    if (!todo) {
      return null;
    }
    
    const result = await db.query(
      'UPDATE todos SET completed = NOT completed, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    return result.rows[0];
  }
}

module.exports = Todo; 