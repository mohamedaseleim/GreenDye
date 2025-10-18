const ChatService = require('../services/chatService');

// Initialize a single instance of ChatService
const chatService = new ChatService();

/**
 * @desc    Create a new chat session for the authenticated user
 * @route   POST /api/chat/sessions
 * @access  Private
 */
exports.createSession = async (req, res, next) => {
  try {
    // Assume req.user contains the authenticated user's information
    const userId = req.user && req.user.id ? req.user.id : null;
    const session = await chatService.createSession(userId);
    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Send a message in an existing chat session
 * @route   POST /api/chat/:sessionId/messages
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const userId = req.user && req.user.id ? req.user.id : null;
    const message = await chatService.sendMessage(sessionId, userId, content);
    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Retrieve messages for a chat session
 * @route   GET /api/chat/:sessionId/messages
 * @access  Private
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const messages = await chatService.getMessages(sessionId);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return next(error);
  }
};
