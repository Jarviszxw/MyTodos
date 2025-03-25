const OpenAI = require('openai');

/**
 * Get OpenAI response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const testOpenai = async (req, res) => {
    try {
     
      // 调试：检查 API Key 是否加载
      console.log('API Key:', process.env.OPENAI_API_KEY);
  
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000, // 设置 30 秒超时
      });
  
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: "Write a one-sentence bedtime story about a unicorn."
        }],
        timeout: 30000
      });
  
      console.log('OpenAI response:', completion.choices[0].message.content);
  
      res.json({
        message: 'OpenAI response:',
        content: completion.choices[0].message.content
      });
    } catch (error) {
      console.error('Get OpenAI response error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Internal server error'
      });
    }
  }

module.exports = {
  testOpenai
}