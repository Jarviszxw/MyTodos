const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');

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


module.exports = {
  testChatgpt,
  testGemini,
  testDeepseek
}