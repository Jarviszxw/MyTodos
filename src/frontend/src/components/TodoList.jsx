import React, { useState, useEffect, useMemo, useRef } from 'react';
import { debounce, now } from 'lodash';
import api from '../services/api';
import { FiPlus, FiCalendar, FiTrash2, FiEdit, FiCheck, FiX, FiFilter, FiSearch, FiMessageSquare } from 'react-icons/fi';
import todoService from '../services/todoService';
import aiService from '../services/aiService';

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
  
  // AI 相关状态
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAISelectPanel, setShowAISelectPanel] = useState(false);
  const [showAIHistoryPanel, setShowAIHistoryPanel] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState({ content: "", isLoading: false });
  const [aiHistory, setAiHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [viewingConversation, setViewingConversation] = useState(null);
  const [conversationCount, setConversationCount] = useState(1);
  
  const aiInputRef = useRef(null);

  // Fetch todos when component mounts
  useEffect(() => {
    fetchTodos();
    fetchAiHistory();
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

  // 获取AI对话历史
  const fetchAiHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await aiService.getHistory();
      
      // 确保我们有正确的数据格式
      const historyData = history.history || history || [];
      
      // 创建一个新的映射，用于按照root conversation来分组
      const rootConversations = [];
      const childConversationsByRoot = {};
      
      // 首先识别所有root conversations和child conversations
      historyData.forEach(item => {
        if (item.is_root || !item.parent_id) {
          rootConversations.push(item);
        } else {
          const rootId = item.parent_id;
          if (!childConversationsByRoot[rootId]) {
            childConversationsByRoot[rootId] = [];
          }
          childConversationsByRoot[rootId].push(item);
        }
      });
      
      // 根对话按照时间倒序排序
      rootConversations.sort((a, b) => 
        new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at)
      );
      
      // 只显示根对话在历史列表中，子对话通过点击查看详情显示
      setAiHistory(rootConversations);
      console.log("Processed history:", rootConversations);
    } catch (error) {
      console.error('Error fetching AI history:', error);
    } finally {
      setHistoryLoading(false);
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

  // 处理Todo选择
  const handleTodoSelect = (todoId) => {
    if (selectedTodos.includes(todoId)) {
      setSelectedTodos(selectedTodos.filter(id => id !== todoId));
    } else {
      setSelectedTodos([...selectedTodos, todoId]);
    }
  };
  
  // 清除所有选择
  const clearSelection = () => {
    setSelectedTodos([]);
  };
  
  // 处理AI助手提交
  const handleAISubmit = async (e) => {
    e.preventDefault();
    
    if (!aiInput.trim()) return;
    
    // 检查是否达到最大对话次数上限
    if (currentConversationId && conversationCount >= 10) {
      setAiResponse({
        content: "You've reached the maximum of 10 exchanges in this conversation. Please start a new conversation.",
        error: true
      });
      return;
    }
    
    try {
      setAiLoading(true);
      setAiResponse({ content: "", isLoading: true });
      
      const data = {
        user_input: aiInput,
        todos: selectedTodos.map(todo => ({ 
          id: todo.id, 
          title: todo.title,
          description: todo.description,
          completed: todo.completed,
          priority: todo.priority,
          due_date: todo.due_date
        })),
        parent_id: currentConversationId,
        conversation_count: conversationCount + 1
      };
      
      const response = await aiService.getAssistance(data);
      console.log("AI Response:", response);
      
      if (response && response.id) {
        setAiResponse({
          id: response.id,
          content: response.content,
          timestamp: response.timestamp || new Date().toISOString(),
          isLoading: false
        });
        
        // 设置当前对话ID（新对话或继续对话）
        if (!currentConversationId) {
          setCurrentConversationId(response.id);
        }
        
        // 增加对话计数
        setConversationCount(prev => prev + 1);
        setAiInput("");
        
        // 更新历史记录
        fetchAiHistory();
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("AI assistant error:", error);
      setAiResponse({
        content: "Sorry, there was an error processing your request. Please try again.",
        error: true,
        isLoading: false
      });
    } finally {
      setAiLoading(false);
    }
  };
  
  // 继续对话
  const continueConversation = (historyItem) => {
    const rootId = historyItem.parent_id || historyItem.id;
    setCurrentConversationId(rootId);
    setConversationCount(historyItem.conversation_count || 1);
    // Keep showing the history panel instead of switching to AI panel
    setShowAIPanel(false);
    setShowAIHistoryPanel(true);
    
    // 确保获取完整的对话线程
    fetchConversationThread(rootId);
  };
  
  // 开始新对话
  const startNewConversation = () => {
    setAiResponse({ content: "", isLoading: false });
    setCurrentConversationId(null);
    setConversationCount(0);
    setAiInput("");
  };

  // 删除特定对话
  const deleteConversation = async (id) => {
    try {
      await aiService.deleteConversation(id);
      // 如果删除的是当前对话，重置状态
      if (id === currentConversationId) {
        startNewConversation();
      }
      // 刷新历史
      fetchAiHistory();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  
  // 删除所有对话历史
  const deleteAllConversations = async () => {
    if (window.confirm('Are you sure you want to delete all conversation history? This action cannot be undone.')) {
      try {
        await aiService.deleteAllConversations();
        startNewConversation();
        setAiHistory([]);
      } catch (error) {
        console.error('Error deleting all conversations:', error);
      }
    }
  };
  
  // 渲染当前对话历史
  const renderCurrentConversation = () => {
    if (!currentConversationId || viewingConversation?.length === 0) return null;
    
    // 使用已经获取到的viewingConversation来显示完整的对话线程
    const conversationThread = viewingConversation || [];
    
    if (conversationThread.length === 0) return null;
    
    return (
      <div className="mb-6 mt-4">
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Conversation Thread:</h4>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          {conversationThread.map((item, index) => (
            <div key={item.id} className="p-3 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
              <div className="flex justify-between mb-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Question {index + 1} ({new Date(item.timestamp || item.created_at || new Date()).toLocaleString()})
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Round {item.conversation_count || index + 1} of 10
                </div>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 font-medium">{item.query || "No query recorded"}</p>
              <div className="pl-3 border-l-2 border-blue-400 dark:border-blue-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Response:
                </div>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  {item.response || item.content || "No response recorded"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 获取特定对话线程
  const fetchConversationThread = async (conversationId) => {
    try {
      setHistoryLoading(true);
      console.log("Fetching conversation thread for ID:", conversationId);
      
      // 先清空现有数据，避免显示旧数据
      setViewingConversation(null);
      
      const thread = await aiService.getConversationThread(conversationId);
      console.log("API response for conversation thread:", thread);
      
      // 强制转换确保线程数据是数组格式
      let threadData = thread;
      if (!Array.isArray(threadData)) {
        // 如果返回的是单个对话或包装在对象中
        if (thread && thread.thread) {
          threadData = thread.thread;
        } else if (thread && typeof thread === 'object') {
          threadData = [thread];
        } else {
          threadData = [];
        }
      }
      
      if (threadData.length > 0) {
        // 按对话顺序排序
        const sortedThread = threadData.sort((a, b) => {
          const aCount = parseInt(a.conversation_count) || 1;
          const bCount = parseInt(b.conversation_count) || 1;
          return aCount - bCount;
        });
        
        console.log("Sorted conversation thread:", sortedThread);
        // 确保状态更新
        setViewingConversation(sortedThread);
      } else {
        console.log("Empty thread data:", threadData);
        setViewingConversation([]);
      }
    } catch (error) {
      console.error('Error fetching conversation thread:', error);
      setViewingConversation([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 渲染对话线程详情
  const renderConversationThread = () => {
    console.log("Rendering conversation thread:", viewingConversation);
    
    if (historyLoading) {
      return (
        <div className="text-center py-4">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        </div>
      );
    }
    
    if (!viewingConversation || !Array.isArray(viewingConversation) || viewingConversation.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">No conversation data found. Try selecting another conversation.</p>
        </div>
      );
    }
    
    // 确保有内容才渲染
    return (
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        {viewingConversation.map((item, index) => (
          <div key={item.id || index} className="p-3 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
            <div className="flex justify-between mb-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Question {index + 1} ({new Date(item.timestamp || item.created_at || new Date()).toLocaleString()})
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Round {item.conversation_count || index + 1} of 10
              </div>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 font-medium">{item.query || "No query recorded"}</p>
            <div className="pl-3 border-l-2 border-blue-400 dark:border-blue-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Response:
              </div>
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                {item.response || item.content || "No response recorded"}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染待办事项列表条目
  const renderTodoItem = (todo) => {
    const priorityInfo = getPriorityLabelAndStyle(todo.priority);
    const isSelected = selectedTodos.includes(todo.id);
    const dueDate = todo.due_date ? new Date(todo.due_date) : null;
    const isPastDue = dueDate && dueDate < new Date() && !todo.completed;
    
    // 组合优先级和标题，以及截止日期（如果有）
    const displayTitle = (
      <span className="flex items-center gap-2">
        {/* 优先级标签 */}
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${priorityInfo.className}`}>
          {priorityInfo.label}
        </span>
        
        {/* 任务标题 */}
        <span className={todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
          {todo.title}
        </span>
        
        {/* 截止日期 */}
        {dueDate && (
          <span className={`ml-1 text-sm ${
            todo.completed ? 'text-gray-500' : isPastDue ? 'text-red-500 font-bold' : 'text-gray-600'
          }`}>
            {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </span>
    );
    
    return (
      <li 
        key={todo.id}
        className={`flex items-center justify-between p-4 bg-white rounded shadow hover:shadow-md transition duration-300 ${isSelected ? 'border-2 border-purple-500' : ''}`}
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
              <div className="flex items-center gap-2 mr-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(todo.id, todo.completed)}
                  className="w-5 h-5 cursor-pointer"
                />
                
                {/* 只在AI选择面板中显示第二个勾选框 */}
                {showAISelectPanel && !todo.completed && (
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleTodoSelect(todo.id)}
                    className="w-5 h-5 cursor-pointer accent-purple-600"
                    title="Select for AI assistance"
                  />
                )}
              </div>
              
              {displayTitle}
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

      {/* AI Actions Section */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => {
              // 重置对话状态
              startNewConversation();
              // 先设置要显示的任务列表（未完成的任务）
              // 确保AI选择面板显示
              setSelectedTodos([]);
              setShowAISelectPanel(true);
              setShowAIHistoryPanel(false);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition duration-300"
          >
            Ask AI Assistant
          </button>
          
          <button
            onClick={() => {
              // 获取历史记录并显示
              fetchAiHistory();
              setShowAIHistoryPanel(true);
              setViewingConversation(null);
              setShowAIPanel(false);
              setShowAISelectPanel(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
          >
            AI History {aiHistory.length > 0 && `(${aiHistory.length})`}
          </button>
        </div>
        
        <div className="text-gray-500 text-sm">
          Select todos and ask AI for help
        </div>
      </div>
      
      {/* AI History Panel */}
      {showAIHistoryPanel && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">AI Conversation History</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // 关闭历史面板
                  setShowAIHistoryPanel(false);
                  setViewingConversation(null);
                }}
                className="flex items-center px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-700"
                aria-label="Close history panel"
              >
                <FiX className="mr-1" /> Close
              </button>
              {aiHistory.length > 0 && (
                <button
                  onClick={deleteAllConversations}
                  className="flex items-center px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-700"
                  aria-label="Clear all history"
                >
                  Clear All History
                </button>
              )}
            </div>
          </div>
          
          {/* 查看特定对话 */}
          {viewingConversation ? (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversation Details</h4>
                <button 
                  onClick={() => setViewingConversation(null)}
                  className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to All Conversations
                </button>
              </div>
              {renderConversationThread()}
            </div>
          ) : (
            /* 显示所有历史对话 */
            <>
              {historyLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                </div>
              ) : aiHistory.length > 0 ? (
                <div className="max-h-[70vh] overflow-y-auto">
                  {aiHistory.map(historyItem => {
                    const isRoot = historyItem.is_root || !historyItem.parent_id;
                    const timestamp = historyItem.timestamp || historyItem.created_at || new Date().toISOString();
                    const date = new Date(timestamp).toLocaleString();
                    const query = historyItem.query || 'No query recorded';
                    const shortQuery = query.length > 30 
                      ? `${query.substring(0, 30)}...` 
                      : query;
                    
                    // 找到和这个对话相关的所有任务
                    const todoTitles = historyItem.todos && Array.isArray(historyItem.todos) 
                      ? historyItem.todos.map(t => t.title).join(", ")
                      : "";
                    
                    return (
                      <div 
                        key={historyItem.id} 
                        className={`p-3 my-2 rounded border ${isRoot ? 'border-blue-500 bg-blue-50 dark:bg-gray-800' : 'border-gray-300 bg-gray-50 dark:bg-gray-900'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{shortQuery}</p>
                            <p className="text-xs text-gray-500">{date}</p>
                            {isRoot && todoTitles && (
                              <p className="text-xs text-green-600 mt-1">
                                <span className="font-medium">Conversation about selected todos:</span> {todoTitles}
                              </p>
                            )}
                            {!isRoot && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded">
                                Round {historyItem.conversation_count || '1'} of 10
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // 确定对话ID（当前ID或父ID）
                                const rootId = historyItem.parent_id || historyItem.id;
                                console.log("Viewing conversation with ID:", rootId);
                                
                                // 先设置状态，显示详情面板
                                setViewingConversation([]); // 先设置为空数组，等待加载
                                
                                // 然后获取对话内容
                                fetchConversationThread(rootId);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                              aria-label="View conversation"
                              title="View conversation"
                            >
                              <FiMessageSquare />
                            </button>
                            <button
                              onClick={() => deleteConversation(historyItem.id)}
                              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                              aria-label="Delete conversation"
                              title="Delete conversation"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-2">No conversation history yet</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="mb-2">When you chat with the AI assistant:</p>
                    <ul className="list-disc pl-5 text-left">
                      <li>Select todos you want help with</li>
                      <li>Ask questions about your todos</li>
                      <li>Get suggestions for todos prioritization</li>
                      <li>Learn strategies for better todo management</li>
                    </ul>
                    <p className="mt-3">Your conversations will appear here for future reference.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* AI任务选择面板 */}
      {showAISelectPanel && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Todos for AI Assistant</h3>
              <button
                onClick={() => setShowAISelectPanel(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Close selection panel"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Select todos that you want the AI to help you with:
            </p>
            
            {/* 任务选择列表 - 只显示未完成的任务 */}
            <div className="max-h-60 overflow-y-auto mb-4">
              {todos.filter(todo => !todo.completed).map(todo => (
                <div
                  key={todo.id}
                  className="flex items-center p-3 mb-2 border rounded hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    id={`select-todo-${todo.id}`}
                    checked={selectedTodos.some(selected => selected.id === todo.id)}
                    onChange={() => {
                      setSelectedTodos(prev => {
                        if (prev.some(selected => selected.id === todo.id)) {
                          return prev.filter(selected => selected.id !== todo.id);
                        } else {
                          return [...prev, todo];
                        }
                      });
                    }}
                    className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
                  />
                  <label
                    htmlFor={`select-todo-${todo.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {todo.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Priority: {todo.priority === 1 ? 'High' : todo.priority === 2 ? 'Medium' : 'Low'}
                      {todo.due_date && ` · Due: ${new Date(todo.due_date).toLocaleDateString()}`}
                    </div>
                  </label>
                </div>
              ))}
              
              {todos.filter(todo => !todo.completed).length === 0 && (
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No active todos available. Add some todos first!
                </p>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setSelectedTodos([])}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                disabled={selectedTodos.length === 0}
              >
                Clear Selection
              </button>
              <button
                onClick={() => {
                  if (selectedTodos.length > 0) {
                    setShowAISelectPanel(false);
                    setShowAIPanel(true);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                disabled={selectedTodos.length === 0}
              >
                Continue with {selectedTodos.length} selected
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI对话面板 */}
      {showAIPanel && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAIPanel(false);
                  startNewConversation();
                }}
                className="flex items-center px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-700"
                aria-label="Close AI panel"
              >
                <FiX className="mr-1" /> Close
              </button>
              <button
                onClick={() => {
                  startNewConversation();
                  // 确保新对话状态清空
                  setAiResponse({ content: "", isLoading: false });
                  setSelectedTodos([]);
                  setShowAISelectPanel(true);
                  setShowAIPanel(false);
                }}
                className="flex items-center px-2 py-1 text-sm text-green-600 hover:bg-green-50 rounded dark:text-green-400 dark:hover:bg-gray-700"
                aria-label="Start new conversation"
              >
                <FiPlus className="mr-1" /> New
              </button>
            </div>
          </div>
          
          {/* 显示选中的待办事项 */}
          {selectedTodos.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Selected Todos:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTodos.map(todo => {
                  const priorityClass = todo.priority === 1 
                    ? "bg-red-100 text-red-800 border-red-200" 
                    : todo.priority === 2 
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200" 
                      : "bg-green-100 text-green-800 border-green-200";
                  
                  return (
                    <div 
                      key={todo.id} 
                      className={`flex items-center px-3 py-1.5 ${priorityClass} text-xs rounded-full border`}
                    >
                      <span className="font-medium mr-1">P{todo.priority}:</span> {todo.title}
                      {todo.due_date && (
                        <span className="ml-1 text-gray-500">
                          (Due: {new Date(todo.due_date).toLocaleDateString()})
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedTodos(prev => prev.filter(t => t.id !== todo.id))}
                        className="ml-1 hover:text-red-600"
                        aria-label="Remove selection"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setSelectedTodos([])}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-700"
                  aria-label="Clear all selections"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
          
          {/* AI loading 和 response 状态 */}
          {aiLoading ? (
            <div className="mt-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 flex justify-center items-center">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-blue-700 dark:text-blue-300 font-medium">AI is thinking...</p>
              </div>
            </div>
          ) : aiResponse.content ? (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {currentConversationId 
                  ? `Conversation in progress (${conversationCount}/10 exchanges maximum)` 
                  : "New conversation"}
              </p>
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                {aiResponse.content}
              </div>
            </div>
          ) : null}
          
          {/* 对话历史记录 */}
          {currentConversationId && (
            <div className="mb-6 mt-4">
              {renderCurrentConversation()}
            </div>
          )}
          
          {/* AI输入表单 */}
          <form onSubmit={handleAISubmit} className="mt-4">
            <div className="flex items-center">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={selectedTodos.length > 0 
                  ? "Ask anything about your selected todos..." 
                  : "Select todos first to get assistance..."}
                disabled={selectedTodos.length === 0 || aiLoading || conversationCount > 10}
                className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                type="submit"
                disabled={!aiInput.trim() || selectedTodos.length === 0 || aiLoading || conversationCount > 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600"
              >
                Ask AI
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Search Bar */}
      <div className="mb-8 mt-8">
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
                  ? "No todos yet. Add some todos!" 
                  : "No todos match your current filters."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTodos.map(todo => renderTodoItem(todo))}
            </ul>
          )}
        </div>
      )}
      
      {/* 显示AI面板按钮 */}
      {!showAIPanel && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => {
              if (selectedTodos.length === 0) {
                setShowAISelectPanel(true);
              } else {
                setShowAIPanel(true);
              }
            }}
            className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800"
            aria-label="Ask AI Assistant"
          >
            <FiMessageSquare size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoList;