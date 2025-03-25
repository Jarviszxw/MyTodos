/**
 * OpenAI Routes
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
// const { auth } = require('../middleware/auth');

// All todo routes require authentication
// router.use(auth);

// ai - GET /api/ai
router.get('/chatgpt', aiController.testChatgpt);
router.get('/gemini', aiController.testGemini);
router.get('/deepseek', aiController.testDeepseek);

module.exports = router;