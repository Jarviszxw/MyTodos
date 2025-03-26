/**
 * AI History Model
 */

const db = require('./db');

class AiHistory {
  /**
   * Get conversation history for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of conversation history items
   */
  static async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM ai_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    
    // 解析todos为数组
    const rows = result.rows.map(row => {
      if (row.todos && typeof row.todos === 'string') {
        try {
          row.todos = JSON.parse(row.todos);
        } catch (err) {
          console.error('Error parsing todos JSON:', err);
        }
      }
      return row;
    });
    
    return rows;
  }
  
  /**
   * Get a conversation by ID
   * @param {number} id - Conversation ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>} - Conversation item or null
   */
  static async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM ai_history WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    const conversation = result.rows[0];
    
    // 解析todos为数组
    if (conversation && conversation.todos && typeof conversation.todos === 'string') {
      try {
        conversation.todos = JSON.parse(conversation.todos);
      } catch (err) {
        console.error('Error parsing todos JSON:', err);
      }
    }
    
    return conversation || null;
  }
  
  /**
   * 获取某个对话的完整对话历史（包括父对话和所有子对话）
   * @param {number} id - 对话ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} - 完整对话历史
   */
  static async getConversationThread(id, userId) {
    // 先查找根对话（最顶级的父对话）
    let rootId = id;
    let rootConversation = await this.findById(id, userId);
    
    if (!rootConversation) {
      return [];
    }
    
    // 如果有父对话，找到最顶级的父对话
    while (rootConversation.parent_id) {
      rootId = rootConversation.parent_id;
      rootConversation = await this.findById(rootId, userId);
      if (!rootConversation) break;
    }
    
    // 获取所有相关的对话
    const result = await db.query(
      `SELECT * FROM ai_history 
       WHERE id = $1 OR parent_id = $1 OR id IN (
         SELECT id FROM ai_history WHERE parent_id IN (
           SELECT id FROM ai_history WHERE parent_id = $1
         )
       )
       AND user_id = $2
       ORDER BY created_at ASC`,
      [rootId, userId]
    );
    
    // 解析todos为数组
    const thread = result.rows.map(row => {
      if (row.todos && typeof row.todos === 'string') {
        try {
          row.todos = JSON.parse(row.todos);
        } catch (err) {
          console.error('Error parsing todos JSON:', err);
        }
      }
      return row;
    });
    
    return thread;
  }
  
  /**
   * Create a new conversation
   * @param {Object} data - Conversation data
   * @returns {Promise<Object>} - Newly created conversation
   */
  static async create(data) {
    const { user_id, query, todos, response, model = 'deepseek-chat', parent_id = null, conversation_count = 1 } = data;
    
    // Convert todos array to JSON string
    const todosJson = JSON.stringify(todos);
    
    const result = await db.query(
      `INSERT INTO ai_history (user_id, query, todos, response, model, parent_id, conversation_count, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING *`,
      [user_id, query, todosJson, response, model, parent_id, conversation_count]
    );
    
    // Parse todos back to array
    const conversation = result.rows[0];
    if (conversation && conversation.todos) {
      try {
        conversation.todos = JSON.parse(conversation.todos);
      } catch (err) {
        console.error('Error parsing todos JSON:', err);
      }
    }
    
    return conversation;
  }
  
  /**
   * Delete a conversation
   * @param {number} id - Conversation ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>} - Returns true if deletion successful, otherwise false
   */
  static async delete(id, userId) {
    // Check if conversation exists and belongs to user
    const conversation = await this.findById(id, userId);
    if (!conversation) {
      return false;
    }
    
    // 删除此对话及其所有子对话
    await db.query(
      `DELETE FROM ai_history 
       WHERE (id = $1 OR parent_id = $1) AND user_id = $2`,
      [id, userId]
    );
    
    return true;
  }
  
  /**
   * 删除用户的所有对话历史
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} - 返回删除是否成功
   */
  static async deleteAllByUserId(userId) {
    try {
      await db.query('DELETE FROM ai_history WHERE user_id = $1', [userId]);
      return true;
    } catch (error) {
      console.error('Error deleting all conversations:', error);
      return false;
    }
  }
}

module.exports = AiHistory; 