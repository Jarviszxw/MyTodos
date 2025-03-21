import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Todo List Component
 * @param {Object} props - Component properties
 * @param {Object} props.user - Current user information
 * @param {Function} props.onLogout - Logout callback function
 */
const TodoList = ({ user, onLogout }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch todos when component mounts
  useEffect(() => {
    fetchTodos();
  }, []);

  // Fetch all todos
  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await api.todos.getAll();
      setTodos(result.todos);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setError('Failed to load todos. Please try again or refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new todo
  const handleAddTodo = async (e) => {
    e.preventDefault();
    
    if (!newTodo.trim()) return;
    
    try {
      const result = await api.todos.create(newTodo);
      setTodos([result.todo, ...todos]);
      setNewTodo('');
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError('Failed to add todo. Please try again.');
    }
  };

  // Update input field
  const handleInputChange = (e) => {
    setNewTodo(e.target.value);
  };

  // Mark todo as complete/incomplete
  const handleToggleComplete = async (todoId, currentStatus) => {
    try {
      const result = await api.todos.update(todoId, { completed: !currentStatus });
      
      setTodos(todos.map(todo => 
        todo.id === todoId ? result.todo : todo
      ));
    } catch (error) {
      console.error('Failed to update todo status:', error);
      setError('Failed to update todo status. Please try again.');
    }
  };

  // Delete todo
  const handleDeleteTodo = async (todoId) => {
    try {
      await api.todos.delete(todoId);
      setTodos(todos.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setError('Failed to delete todo. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    api.auth.logout();
    onLogout();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Todo List
        </h1>
        
        <div className="flex items-center">
          <span className="mr-4 text-gray-600 dark:text-gray-300">
            Welcome, {user.username}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Add Todo Form */}
      <form 
        onSubmit={handleAddTodo}
        className="mb-8 flex"
      >
        <input
          type="text"
          value={newTodo}
          onChange={handleInputChange}
          placeholder="Add a new todo..."
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-r transition duration-300"
        >
          Add
        </button>
      </form>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading todos...</p>
        </div>
      ) : (
        /* Todo List */
        <div>
          {todos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-gray-600 dark:text-gray-400">
                No todos yet. Add some tasks!
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todos.map(todo => (
                <li 
                  key={todo.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded shadow hover:shadow-md transition duration-300"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo.id, todo.completed)}
                      className="w-5 h-5 mr-3 cursor-pointer"
                    />
                    <span className={`text-lg ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                      {todo.title}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                    aria-label="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoList; 