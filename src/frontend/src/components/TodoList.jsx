import React, { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import api from '../services/api';

/**
 * Todo Filters Component
 * @param {Object} props - Component properties
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onSortChange - Sort change handler
 * @param {String} props.activeFilter - Current active filter
 * @param {String} props.activeSort - Current active sort
 */
const TodoFilters = ({ onFilterChange, onSortChange, activeFilter, activeSort }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="w-full md:w-1/2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter
        </label>
        <div className="flex gap-2">
          <button 
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-md text-sm ${
              activeFilter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => onFilterChange('active')}
            className={`px-4 py-2 rounded-md text-sm ${
              activeFilter === 'active' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => onFilterChange('completed')}
            className={`px-4 py-2 rounded-md text-sm ${
              activeFilter === 'completed' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Completed
          </button>
        </div>
      </div>
      
      <div className="w-full md:w-1/2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          value={activeSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="alphabetical">Alphabetical</option>
          {/* 添加注释的选项作为未来功能的提示 */}
          <option value="priority" disabled>Priority (Coming Soon)</option>
          <option value="dueDate" disabled>Due Date (Coming Soon)</option>
        </select>
      </div>
    </div>
  );
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch todos when component mounts
  useEffect(() => {
    fetchTodos();
  }, []);

  // Filter and sort todos
  const filteredTodos = useMemo(() => {
    // First filter by search query
    let result = todos.filter(todo => 
      todo.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Then filter by completion status
    if (filter === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      result = result.filter(todo => todo.completed);
    }
    
    // Then sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'priority':
          // 为未来的优先级排序做准备
          return (b.priority || 0) - (a.priority || 0);
        case 'dueDate':
          // 为未来的截止日期排序做准备
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  }, [todos, searchQuery, filter, sortBy]);

  // 计算任务统计
  const todoStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const active = total - completed;
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, active, percentComplete };
  }, [todos]);

  const debouncedSetSearchQuery = useMemo(() => 
    debounce((value) => {
      setSearchQuery(value);
    }, 100)
  , []);

  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel(); 
    };
  }, [debouncedSetSearchQuery]);
  
  const handleSearchChange = (e) => {
    setInputValue(e.target.value);
    debouncedSetSearchQuery(e.target.value);
  };
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };
  
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
        <h1 className="text-3xl font-bold text-gray-800">
          Todo List
        </h1>
        
        <div className="flex items-center">
          <span className="mr-4 text-gray-600">
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
      
      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{todoStats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-500">{todoStats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-500">{todoStats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Progress</p>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${todoStats.percentComplete}%` }}></div>
            </div>
            <span className="text-sm font-medium">{todoStats.percentComplete}%</span>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search todos..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          value={inputValue}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Filters */}
      <TodoFilters 
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        activeFilter={filter}
        activeSort={sortBy}
      />
      
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
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:border-blue-500"
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
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading todos...</p>
        </div>
      ) : (
        /* Todo List */
        <div>
          {filteredTodos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">
              <p className="text-gray-600">
                {todos.length === 0 
                  ? "No todos yet. Add some tasks!" 
                  : "No todos match your current filters."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTodos.map(todo => (
                <li 
                  key={todo.id}
                  className="flex items-center justify-between p-4 bg-white rounded shadow hover:shadow-md transition duration-300"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo.id, todo.completed)}
                      className="w-5 h-5 mr-3 cursor-pointer"
                    />
                    <span className={`text-lg ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {todo.title}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
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