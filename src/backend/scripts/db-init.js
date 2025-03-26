/**
 * Database Initialization Script
 * 用于初始化所有数据库表
 */

const db = require('../models/db');

/**
 * 初始化用户表
 */
async function initUsersTable() {
  try {
    console.log('Creating users table if not exists...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // 创建用户名索引，用于快速查找
    await db.query(`
      CREATE INDEX IF NOT EXISTS users_username_idx 
      ON users(username)
    `);
    
    console.log('Users table initialized successfully');
  } catch (err) {
    console.error('Error initializing users table:', err);
    throw err;
  }
}

/**
 * 初始化待办事项表
 */
async function initTodosTable() {
  try {
    console.log('Creating todos table if not exists...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        priority INTEGER,
        due_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // 为用户ID创建索引，以便快速查找用户的待办事项
    await db.query(`
      CREATE INDEX IF NOT EXISTS todos_user_id_idx 
      ON todos(user_id)
    `);
    
    // 为创建时间和截止日期创建索引，以支持排序
    await db.query(`
      CREATE INDEX IF NOT EXISTS todos_created_at_idx 
      ON todos(created_at DESC)
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS todos_due_date_idx 
      ON todos(due_date ASC)
    `);
    
    console.log('Todos table initialized successfully');
  } catch (err) {
    console.error('Error initializing todos table:', err);
    throw err;
  }
}

/**
 * 初始化AI历史记录表
 */
async function initAiHistoryTable() {
  try {
    console.log('Creating AI history table if not exists...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        todos JSONB NOT NULL,
        response TEXT NOT NULL,
        model VARCHAR(100) NOT NULL DEFAULT 'deepseek-chat',
        parent_id INTEGER REFERENCES ai_history(id) ON DELETE SET NULL,
        conversation_count INTEGER DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // 创建用户ID和创建时间的联合索引，以便快速获取用户的对话历史
    await db.query(`
      CREATE INDEX IF NOT EXISTS ai_history_user_id_created_at_idx 
      ON ai_history(user_id, created_at DESC)
    `);
    
    // 创建父对话ID索引，以支持连续对话查询
    await db.query(`
      CREATE INDEX IF NOT EXISTS ai_history_parent_id_idx 
      ON ai_history(parent_id)
    `);
    
    console.log('AI history table initialized successfully');
  } catch (err) {
    console.error('Error initializing AI history table:', err);
    throw err;
  }
}

/**
 * 初始化所有数据库表
 */
async function initAllTables() {
  try {
    console.log('Starting database initialization...');
    
    // 按照依赖顺序初始化表
    await initUsersTable();
    await initTodosTable();
    await initAiHistoryTable();
    
    console.log('All database tables initialized successfully');
    return true;
  } catch (err) {
    console.error('Database initialization failed:', err);
    return false;
  }
}

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  initAllTables()
    .then(success => {
      if (success) {
        console.log('Database initialization completed');
        process.exit(0);
      } else {
        console.error('Database initialization failed');
        process.exit(1);
      }
    });
}

module.exports = initAllTables; 