import React, { useState, useEffect, useMemo } from 'react';
import { debounce, now } from 'lodash';
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
          <option value="priority">Priority</option>
          <option value="dueDate">Due Date</option>
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
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoDueDate, setNewTodoDueDate] = useState(tomorrow);
  const [editTodoId, setEditTodoId] = useState(null);
  const [editTodoTitle, setEditTodoTitle] = useState('');
  const [editTodoPriority, setEditTodoPriority] = useState(3);
  const [editTodoDueDate, setEditTodoDueDate] = useState(tomorrow);
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
          return (a.priority || 999) - (b.priority || 999);
        case 'dueDate':
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
    const overdue = todos.filter(todo => {
      if (!todo.due_date) return false;
      const dueDate = new Date(todo.due_date);
      if (isNaN(dueDate.getTime())) return false;
      return dueDate - new Date() < 0;
    }).length;
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, active, overdue, percentComplete };
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
    
    if (!newTodoTitle.trim()) return;
    
    try {
      // 创建一个新的todo对象
      const todoData = { 
        title: newTodoTitle, 
        completed: false,
        priority: newTodoPriority
      };
      
      // 只有当用户选择了日期时才添加due_date
      if (newTodoDueDate && newTodoDueDate.trim() !== '') {
        todoData.due_date = newTodoDueDate;
      }

      const result = await api.todos.create(todoData);
      setTodos([result.todo || result, ...todos]); // 兼容不同的API返回格式
      setNewTodoTitle('');
      setNewTodoPriority(3);
      setNewTodoDueDate(tomorrow);
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError('Failed to add todo. Please try again.');
    }
  };

  // 开始编辑todo
  const handleStartEdit = (todo) => {
    setEditTodoId(todo.id);
    setEditTodoTitle(todo.title);
    setEditTodoPriority(todo.priority || 3);
    const dueDate = todo.due_date ? new Date(todo.due_date).toLocaleDateString("en-CA") : tomorrow;
    setEditTodoDueDate(dueDate);
  };

  // 保存编辑的todo
  const handleSaveEdit = async () => {
    if (!editTodoTitle.trim()) return;
    
    try {
      const updateData = {
        title: editTodoTitle,
        priority: editTodoPriority
      };
      
      if (editTodoDueDate && editTodoDueDate.trim() !== '') {
        updateData.due_date = editTodoDueDate;
      } else {
        updateData.due_date = null;
      }
      
      const result = await api.todos.update(editTodoId, updateData);
      
      setTodos(todos.map(todo => 
        todo.id === editTodoId ? (result.todo || result) : todo
      ));
      
      setEditTodoId(null);
      setEditTodoTitle('');
      setEditTodoPriority(3);
      setEditTodoDueDate(tomorrow);
    } catch (error) {
      console.error('Failed to update todo:', error);
      setError('Failed to update todo. Please try again.');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditTodoId(null);
    setEditTodoTitle('');
    setEditTodoPriority(3);
    setEditTodoDueDate(tomorrow);
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

  const getPriorityLabelAndStyle = (priority) => {
    if (!priority || priority < 1 || priority > 3) {
      return {
        label: '',
        className: 'bg-gray-200 text-gray-800'
      };
    }
    switch (priority) {
      case 1:
        return { label: 'P1', className: 'bg-red-500 text-white' };
      case 2:
        return { label: 'P2', className: 'bg-yellow-500 text-white' };
      case 3:
        return { label: 'P3', className: 'bg-green-500 text-white' };
      default:
        return { label: '', className: 'bg-gray-200 text-gray-800' };
    }
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
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-500">{todoStats.overdue}</p>
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
      
      {/* Add Todo Form - 修改表单顺序: 优先级 > 标题 > 日期 > 添加按钮 */}
      <form 
        onSubmit={handleAddTodo} 
        className="mb-8 flex flex-wrap items-center gap-2"
      >
        <select
          value={newTodoPriority}
          onChange={(e) => setNewTodoPriority(Number(e.target.value))}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Priority"
        >
          <option value={1}>P1</option>
          <option value={2}>P2</option>
          <option value={3}>P3</option>
        </select>
        
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
        
        <input
          type="date"
          value={newTodoDueDate}
          onChange={(e) => setNewTodoDueDate(e.target.value)}
          onClick={e => e.target.showPicker()}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Select due date"
        />
        
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded transition duration-300"
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
              {filteredTodos.map(todo => {
                const priorityInfo = getPriorityLabelAndStyle(todo.priority);
                
                return (
                  <li 
                    key={todo.id}
                    className="flex items-center justify-between p-4 bg-white rounded shadow hover:shadow-md transition duration-300"
                  >
                    {editTodoId === todo.id ? (
                      // 编辑模式
                      <div className="flex items-center flex-1 gap-2">
                        <select
                          value={editTodoPriority}
                          onChange={(e) => setEditTodoPriority(Number(e.target.value))}
                          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>P1</option>
                          <option value={2}>P2</option>
                          <option value={3}>P3</option>
                        </select>
                        
                        <input
                          type="text"
                          value={editTodoTitle}
                          onChange={(e) => setEditTodoTitle(e.target.value)}
                          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                        
                        <input
                          type="date"
                          value={editTodoDueDate}
                          onChange={(e) => setEditTodoDueDate(e.target.value)}
                          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
                            title="Save"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none"
                            title="Cancel"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 展示模式
                      <>
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggleComplete(todo.id, todo.completed)}
                            className="w-5 h-5 mr-3 cursor-pointer"
                          />
                          
                          {/* 优先级标签 */}
                          {todo.priority && (
                            <span className={`mr-2 px-2 py-1 text-xs rounded-full ${priorityInfo.className}`}>
                              {priorityInfo.label}
                            </span>
                          )}
                          
                          {/* 任务标题 */}
                          <span className={`text-lg ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            {todo.title}
                          </span>
                          
                          {/* 截止日期 */}
                          {todo.due_date && (
                            <span className={`ml-3 text-sm ${
                              todo.completed ? 'text-gray-500' : new Date(todo.due_date) < new Date() ? 'text-red-500' : 'text-gray-600'
                            }`}>
                              {new Date(todo.due_date).toLocaleDateString(`en-US`, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {/* 编辑按钮 */}
                          <button
                            onClick={() => handleStartEdit(todo)}
                            className="text-blue-500 hover:text-blue-700 focus:outline-none"
                            title="Edit"
                            disabled={todo.completed}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          
                          {/* 删除按钮 */}
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-500 hover:text-red-700 focus:outline-none"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoList;