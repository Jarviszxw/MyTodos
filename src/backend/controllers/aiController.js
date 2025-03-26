const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');
const AiHistory = require('../models/AiHistory');

/**
 * Get Chatgpt response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const testChatgpt = async (req, res) => {
    try {
     
      // 调试：检查 API Key 是否加载
      console.log('API Key:', process.env.OPENAI_API_KEY);
  
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000, // 设置 30 秒超时
      });
  
      const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: "Write a one-sentence bedtime story about a unicorn."
        }],
        timeout: 30000
      });
  
      console.log('Chatgpt response:', completion.choices[0].message.content);
  
      res.json({
        message: 'Chatgpt response:',
        content: completion.choices[0].message.content
      });
    } catch (error) {
      console.error('Get Chatgpt response error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Internal server error'
      });
    }
  }


/**
 * Get Gemini response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const testGemini = async (req, res) => {
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Explain how AI works in a few words",
    });
    console.log(response.text);
    res.json({ message: 'Gemini response:', content: response.text });
  } catch (error) {
      console.error('Get Gemini response error:', error);
      res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
}

/**
 * Get Deepseek response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const testDeepseek = async (req, res) => {
  try {
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY
    });

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful assistant." }],
      model: "deepseek-chat",
    });
  
    console.log('Deepseek response:', completion.choices[0].message.content);
    res.json({ message: 'Deepseek response:', content: completion.choices[0].message.content });
  } catch (error) { 
    console.error('Get Deepseek response error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error'
    });
  }
} 

/**
 * Get AI assistance for todos
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAssistance = async (req, res) => {
  try {
    const { user_input, todos, parent_id, conversation_count = 1 } = req.body;
    
    if (!user_input || !todos || !Array.isArray(todos) || todos.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid input. Please provide user_input and todos array.'
      });
    }
    
    // 限制对话最大次数为10次
    if (conversation_count > 10) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Maximum conversation count (10) exceeded. Please start a new conversation.'
      });
    }
    
    // 如果有父对话ID，验证其存在性和所有权
    let previousConversation = null;
    if (parent_id) {
      previousConversation = await AiHistory.findById(parent_id, req.user.id);
      if (!previousConversation) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Previous conversation not found or not authorized to access.'
        });
      }
    }
    
    // 构建提示信息
    let systemPrompt = `你是一个AI助手，专门帮助用户管理和完成他们的待办事项。
你的任务是根据用户的问题，提供关于他们选定的待办事项的具体建议和指导。
你的建议应该是实用的、有针对性的，并且考虑到每个任务的优先级和截止日期。`;

    // 如果是连续对话，包含对话历史进行上下文理解
    let conversationHistory = '';
    if (parent_id && previousConversation) {
      try {
        // 获取完整对话历史
        const thread = await AiHistory.getConversationThread(parent_id, req.user.id);
        if (thread && thread.length > 0) {
          conversationHistory = '\n\n以下是之前的对话历史：\n';
          thread.forEach((item, index) => {
            conversationHistory += `用户: ${item.query}\n`;
            conversationHistory += `助手: ${item.response}\n\n`;
          });
          
          // 加强系统提示，提醒AI这是连续对话
          systemPrompt += `\n\n这是一个连续对话，这是第 ${conversation_count} 轮对话。请考虑之前的对话内容，给出连贯的回复。`;
        }
      } catch (error) {
        console.error('Error getting conversation thread:', error);
        // 继续处理，即使获取对话历史失败
      }
    }

    // 构建用户输入的提示
    const userPrompt = `我有以下待办事项，请帮我: ${user_input}
    
待办事项:
${todos.map((todo, index) => {
  const status = todo.completed ? '已完成' : '未完成';
  const priority = todo.priority === 1 ? '高优先级' : todo.priority === 2 ? '中优先级' : '低优先级';
  const dueDate = todo.due_date ? `截止日期: ${new Date(todo.due_date).toLocaleDateString()}` : '无截止日期';
  return `${index + 1}. ${todo.title} (${status}, ${priority}, ${dueDate})`;
}).join('\n')}

${conversationHistory}`;

    let responseContent = '';
    
    try {
      // 使用当前最佳模型 (这里示例用 Deepseek)
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY
      });
      
      // 调用模型
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 1000
      });
      
      responseContent = completion.choices[0].message.content;
    } catch (error) {
      console.error('AI model call failed, using fallback response:', error);
      // 使用备用响应
      responseContent = `我分析了你的待办事项，这里是一些建议：\n\n${
        todos.map(todo => {
          const tips = [
            "考虑将这个任务分解为更小的步骤，逐个攻克。",
            "为这个任务设定一个明确的截止日期，以确保它能按时完成。",
            "这个任务看起来很重要，建议优先处理。",
            "可以考虑为此任务分配2小时的专注时间。",
            "在开始此任务前，可能需要做一些准备工作或研究。",
            "尝试使用番茄工作法来提高效率：25分钟专注工作，然后短暂休息。"
          ];
          return `- **${todo.title}**: ${tips[Math.floor(Math.random() * tips.length)]}`;
        }).join('\n\n')
      }\n\n希望这些建议对你有所帮助！如果需要更具体的指导，请告诉我。`;
    }
    
    // 保存对话历史
    const history = await AiHistory.create({
      user_id: req.user.id,
      query: user_input,
      todos: todos,
      response: responseContent,
      model: "deepseek-chat",
      parent_id: parent_id,
      conversation_count: conversation_count
    });
    
    // 返回响应
    res.json({
      id: history.id,
      timestamp: history.created_at,
      content: responseContent,
      parent_id: parent_id,
      conversation_count: conversation_count
    });
  } catch (error) {
    console.error('Get AI assistance error:', error);
    
    // 返回备用响应
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get AI assistance. Please try again later.'
    });
  }
};

/**
 * Get AI conversation history
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getHistory = async (req, res) => {
  try {
    const history = await AiHistory.findByUserId(req.user.id);
    
    // 处理数据，添加是否为根对话的标志
    const historyWithRootFlag = history.map(item => ({
      id: item.id,
      timestamp: item.created_at,
      query: item.query,
      todos: item.todos,
      response: item.response,
      model: item.model,
      parent_id: item.parent_id,
      conversation_count: item.conversation_count,
      is_root: !item.parent_id
    }));
    
    res.json({
      history: historyWithRootFlag
    });
  } catch (error) {
    console.error('Get AI history error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get conversation history.'
    });
  }
};

/**
 * Get complete conversation thread
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getConversationThread = async (req, res) => {
  try {
    const { id } = req.params;
    
    const thread = await AiHistory.getConversationThread(id, req.user.id);
    
    if (!thread || thread.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found or not authorized to access.'
      });
    }
    
    res.json({
      thread: thread.map(item => ({
        id: item.id,
        timestamp: item.created_at,
        query: item.query,
        todos: item.todos,
        response: item.response,
        parent_id: item.parent_id,
        conversation_count: item.conversation_count
      }))
    });
  } catch (error) {
    console.error('Get conversation thread error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get conversation thread.'
    });
  }
};

/**
 * Delete AI conversation
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 删除对话并检查结果
    const success = await AiHistory.delete(id, req.user.id);
    
    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found or not authorized to delete.'
      });
    }
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully.'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete conversation.'
    });
  }
};

/**
 * Delete all AI conversations for current user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteAllConversations = async (req, res) => {
  try {
    const success = await AiHistory.deleteAllByUserId(req.user.id);
    
    if (!success) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete all conversations.'
      });
    }
    
    res.json({
      success: true,
      message: 'All conversations deleted successfully.'
    });
  } catch (error) {
    console.error('Delete all conversations error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete all conversations.'
    });
  }
};

module.exports = {
  testChatgpt,
  testGemini,
  testDeepseek,
  getAssistance,
  getHistory,
  getConversationThread,
  deleteConversation,
  deleteAllConversations
};