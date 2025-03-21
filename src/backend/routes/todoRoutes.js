/**
 * Todo Routes
 */

const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { auth } = require('../middleware/auth');

// All todo routes require authentication
router.use(auth);

// Get all todos - GET /api/todos
router.get('/', todoController.getAllTodos);

// Get a single todo - GET /api/todos/:id
router.get('/:id', todoController.getTodoById);

// Create todo - POST /api/todos
router.post('/', todoController.createTodo);

// Update todo - PUT /api/todos/:id
router.put('/:id', todoController.updateTodo);

// Delete todo - DELETE /api/todos/:id
router.delete('/:id', todoController.deleteTodo);

// Toggle todo completion status - PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', todoController.toggleTodoComplete);

module.exports = router; 