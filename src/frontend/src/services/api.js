/**
 * API Service
 */

// Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// General request handler
const handleRequest = async (url, options = {}) => {
  try {
    // Get stored authentication token
    const token = localStorage.getItem('token');
    
    // Default request options
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    
    // Merge options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    // Send request
    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);
    
    // Parse response JSON
    const data = await response.json();
    
    // Check if request was successful
    if (!response.ok) {
      // Handle 401 unauthorized error
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      throw {
        status: response.status,
        ...data
      };
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Authentication related API
 */
const auth = {
  /**
   * User registration
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} - Response data
   */
  register: async (username, password) => {
    const response = await handleRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    // Save authentication info
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },
  
  /**
   * User login
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} - Response data
   */
  login: async (username, password) => {
    const response = await handleRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    // Save authentication info
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },
  
  /**
   * Get current user information
   * @returns {Promise<Object>} - Response data
   */
  getCurrentUser: async () => {
    return await handleRequest('/auth/me');
  },
  
  /**
   * Logout
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Todo item related API
 */
const todos = {
  /**
   * Get all todo items
   * @returns {Promise<Object>} - Todo list
   */
  getAll: async () => {
    return await handleRequest('/todos');
  },
  
  /**
   * Get a single todo item
   * @param {number} id - Todo ID
   * @returns {Promise<Object>} - Todo item
   */
  getById: async (id) => {
    return await handleRequest(`/todos/${id}`);
  },
  
  /**
   * Create todo item
   * @param {string} title - Todo title
   * @param {boolean} completed - Completion status
   * @returns {Promise<Object>} - Created todo
   */
  create: async (title, completed = false) => {
    return await handleRequest('/todos', {
      method: 'POST',
      body: JSON.stringify({ title, completed })
    });
  },
  
  /**
   * Update todo item
   * @param {number} id - Todo ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated todo
   */
  update: async (id, data) => {
    return await handleRequest(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * Delete todo item
   * @param {number} id - Todo ID
   * @returns {Promise<Object>} - Response data
   */
  delete: async (id) => {
    return await handleRequest(`/todos/${id}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Toggle todo completion status
   * @param {number} id - Todo ID
   * @returns {Promise<Object>} - Updated todo
   */
  toggleComplete: async (id) => {
    return await handleRequest(`/todos/${id}/toggle`, {
      method: 'PATCH'
    });
  }
};

// Export API service
export default {
  auth,
  todos
}; 