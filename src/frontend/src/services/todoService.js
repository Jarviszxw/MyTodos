/**
 * Todo Service - Services for todo CRUD operations
 */

import api from './api';

/**
 * Get all todos for the current user
 * @returns {Promise} Promise with todos
 */
export const getAll = async () => {
  try {
    const response = await api.get('/todos');
    return response.data;
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};

/**
 * Create a new todo
 * @param {Object} todoData - Todo data (title, priority, due_date, etc.)
 * @returns {Promise} Promise with created todo
 */
export const create = async (todoData) => {
  try {
    const response = await api.post('/todos', todoData);
    return response.data;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};

/**
 * Update an existing todo
 * @param {number} id - Todo ID
 * @param {Object} todoData - Updated todo data
 * @returns {Promise} Promise with updated todo
 */
export const update = async (id, todoData) => {
  try {
    const response = await api.put(`/todos/${id}`, todoData);
    return response.data;
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

/**
 * Delete a todo
 * @param {number} id - Todo ID
 * @returns {Promise} Promise with deletion result
 */
export const deleteTodo = async (id) => {
  try {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

export default {
  getAll,
  create,
  update,
  delete: deleteTodo
}; 