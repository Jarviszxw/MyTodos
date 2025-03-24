/**
 * Todo Controller
 */

const Todo = require('../models/Todo');

/**
 * Get all todos for a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllTodos = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user.id;
    
    // Query all todos for the user
    const todos = await Todo.findAll(userId);
    
    res.json({ todos });
  } catch (error) {
    console.error('Get all todos error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get a single todo by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTodoById = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(todoId)) {
      return res.status(400).json({
        error: 'Invalid todo ID',
        message: 'Invalid todo ID'
      });
    }
    
    // Query todo
    const todo = await Todo.findById(todoId, userId);
    
    // Check if found
    if (!todo) {
      return res.status(404).json({
        error: 'Todo not found',
        message: 'Todo not found'
      });
    }
    
    res.json({ todo });
  } catch (error) {
    console.error('Get todo by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

/**
 * Create a new todo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, completed, due_date, priority } = req.body;
    
    // Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Title is required',
        message: 'Title is required'
      });
    }
    
    // Create todo
    const todoData = {
      title: title.trim(),
      completed: completed === true,
      due_date: due_date,
      priority: priority
    };
    
    const todo = await Todo.create(todoData, userId);
    
    res.status(201).json({
      message: 'Todo created successfully',
      todo
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

/**
 * Update a todo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    const { title, completed , due_date, priority } = req.body;
    
    // Validate ID
    if (isNaN(todoId)) {
      return res.status(400).json({
        error: 'Invalid todo ID',
        message: 'Invalid todo ID'
      });
    }
    
    // Validate that at least one update field is provided
    if (title === undefined && completed === undefined && due_date === undefined && priority === undefined) {
      return res.status(400).json({
        error: 'No update fields provided',
        message: 'No update fields provided'
      });
    }
    
    // Validate title (if provided)
    if (title !== undefined && (title === null || title.trim().length === 0)) {
      return res.status(400).json({
        error: 'Title cannot be empty',
        message: 'Title cannot be empty'
      });
    }
    
    // Build update data
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (completed !== undefined) {
      updateData.completed = completed === true;
    }
    if (due_date !== undefined) {
      updateData.due_date = due_date;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    
    // Update todo
    const updatedTodo = await Todo.update(todoId, updateData, userId);
    
    // Check if found and updated
    if (!updatedTodo) {
      return res.status(404).json({
        error: 'Todo not found',
        message: 'Todo not found'
      });
    }
    
    res.json({
      message: 'Todo updated successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a todo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(todoId)) {
      return res.status(400).json({
        error: 'Invalid todo ID',
        message: 'Invalid todo ID'
      });
    }
    
    // Delete todo
    const isDeleted = await Todo.delete(todoId, userId);
    
    // Check if successfully deleted
    if (!isDeleted) {
      return res.status(404).json({
        error: 'Todo not found',
        message: 'Todo not found'
      });
    }
    
    res.json({
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

/**
 * Toggle todo completion status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const toggleTodoComplete = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(todoId)) {
      return res.status(400).json({
        error: 'Invalid todo ID',
        message: 'Invalid todo ID'
      });
    }
    
    // Toggle completion status
    const updatedTodo = await Todo.toggleComplete(todoId, userId);
    
    // Check if found and updated
    if (!updatedTodo) {
      return res.status(404).json({
        error: 'Todo not found',
        message: 'Todo not found'
      });
    }
    
    res.json({
      message: 'Todo status toggled successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Toggle todo complete error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoComplete
}; 