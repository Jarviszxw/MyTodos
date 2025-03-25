/**
 * OpenAI Routes
 */

const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openaiController');
// const { auth } = require('../middleware/auth');
// All todo routes require authentication
// router.use(auth);

// openai - GET /api/openai
router.get('/test', openaiController.testOpenai);


module.exports = router;