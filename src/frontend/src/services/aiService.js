/**
 * AI Service - Services for AI interaction
 */

import api from './api';

/**
 * Get AI assistance for selected todos
 * @param {Object} data - Request data containing user_input, todos, parent_id, and conversation_count
 * @returns {Promise} - Promise with AI response
 */
export const getAssistance = async (data) => {
  try {
    return await api.ai.getAssistance(data);
  } catch (error) {
    console.error('Error getting AI assistance:', error);
    throw error;
  }
};

/**
 * Get user's AI history
 * @returns {Promise} - Promise with AI history
 */
export const getHistory = async () => {
  try {
    return await api.ai.getHistory();
  } catch (error) {
    console.error('Error getting AI history:', error);
    throw error;
  }
};

/**
 * 获取对话线程详情
 * @param {number} conversationId - 对话ID
 * @returns {Promise<Array>} 对话线程数据
 */
const getConversationThread = async (conversationId) => {
  try {
    console.log('Calling API to get conversation thread for ID:', conversationId);
    const response = await api.ai.getConversationThread(conversationId);
    console.log('API response raw:', response);
    
    // 确保返回的是数组
    let threadData = response;
    
    // 如果结果是对象且有thread属性，则使用thread
    if (response && response.thread) {
      threadData = response.thread;
    } 
    // 如果是单个对象且不是数组，转换为数组
    else if (response && !Array.isArray(response)) {
      threadData = [response];
    }
    // 如果是空值，返回空数组
    else if (!response) {
      threadData = [];
    }
    
    // 确保每个项目都有必要的字段
    const processedThread = Array.isArray(threadData) ? threadData.map(item => ({
      id: item.id,
      query: item.query || '',
      content: item.content || item.response || '',
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      conversation_count: parseInt(item.conversation_count) || 1,
      parent_id: item.parent_id || null,
      is_root: item.is_root || (!item.parent_id),
      todos: item.todos || []
    })) : [];
    
    console.log('Processed thread data:', processedThread);
    return processedThread;
  } catch (error) {
    console.error('Error in getConversationThread:', error);
    throw error;
  }
};

/**
 * Delete a specific conversation
 * @param {string} conversationId - ID of the conversation to delete
 * @returns {Promise} - Promise with deletion result
 */
export const deleteConversation = async (conversationId) => {
  try {
    return await api.ai.deleteConversation(conversationId);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Delete all conversations for current user
 * @returns {Promise} - Promise with deletion result
 */
export const deleteAllConversations = async () => {
  try {
    return await api.ai.deleteAllConversations();
  } catch (error) {
    console.error('Error deleting all conversations:', error);
    throw error;
  }
};

export default {
  getAssistance,
  getHistory,
  getConversationThread,
  deleteConversation,
  deleteAllConversations
}; 