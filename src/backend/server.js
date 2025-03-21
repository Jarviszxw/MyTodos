/**
 * Server Startup
 */

// Load environment variables
require('dotenv').config();

const app = require('./app');
const config = require('./config/app');
const db = require('./models/db');

// Define server port
const PORT = config.server.port;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.server.env} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}${config.api.prefix}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Log error and shut down safely
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  // Log error but don't shut down immediately, let the program continue
});

// Handle termination signals, gracefully shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, gracefully shutting down...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, gracefully shutting down...');
  gracefulShutdown();
});

/**
 * Graceful shutdown function
 */
function gracefulShutdown() {
  console.log('Gracefully shutting down services...');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      // Close database connection
      await db.pool.end();
      console.log('Database connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database connection:', err);
      process.exit(1);
    }
  });
  
  // Force exit if unable to close within 10 seconds
  setTimeout(() => {
    console.error('Could not gracefully shut down within the specified time, forcing exit');
    process.exit(1);
  }, 10000);
} 