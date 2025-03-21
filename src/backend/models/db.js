/**
 * Database Connection Model
 */

const { Pool } = require('pg');
const dbConfig = require('../config/database');

// Determine current environment
const environment = process.env.NODE_ENV || 'development';
const config = dbConfig[environment];

// Create connection pool
const pool = new Pool({
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  password: config.password,
  ssl: config.ssl,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Time in milliseconds a connection can remain idle before being closed
  connectionTimeoutMillis: 2000, // Connection timeout in milliseconds
});

// Connection event listeners
pool.on('connect', () => {
  console.log('PostgreSQL connection pool created');
});

pool.on('error', (err, client) => {
  console.error('PostgreSQL connection pool error:', err);
});

/**
 * Execute SQL query
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries, those taking more than 1000ms
    if (duration > 1000) {
      console.warn('Slow query:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

/**
 * Get client connection (for transactions)
 * @returns {Promise} - Client connection
 */
const getClient = async () => {
  const client = await pool.connect();
  
  // Wrap original query method to add logging
  const query = client.query;
  const release = client.release;
  
  // Set query monitoring
  client.query = (...args) => {
    return query.apply(client, args);
  };
  
  // Ensure connection release
  client.release = () => {
    release.apply(client);
  };
  
  return client;
};

module.exports = {
  query,
  getClient,
  pool,
}; 