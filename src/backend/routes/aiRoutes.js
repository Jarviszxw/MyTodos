/**
 * AI Routes
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

// All AI routes require authentication
router.use(auth);

// 测试路由
router.get('/test/chatgpt', aiController.testChatgpt);
router.get('/test/gemini', aiController.testGemini);
router.get('/test/deepseek', aiController.testDeepseek);

// AI 助手路由
router.post('/assistance', aiController.getAssistance);
router.get('/history', aiController.getHistory);
router.get('/thread/:id', aiController.getConversationThread);
router.delete('/history/:id', aiController.deleteConversation);
router.delete('/history', aiController.deleteAllConversations);

module.exports = router;