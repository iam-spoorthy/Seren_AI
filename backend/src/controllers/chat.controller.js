// ============================================================
// CHAT.CONTROLLER.JS — HTTP Handler for AI Chat
// ============================================================
//
// FILE PURPOSE:
//   This controller handles ALL HTTP requests related to the
//   AI therapist chat feature. It receives user messages,
//   validates them, passes them to the chat service (which
//   calls the AI), and returns the AI's response.
//
// WHAT THIS FILE DOES:
//   Provides 3 endpoint handlers:
//
//   1. sendMessage (POST /api/chat/send)
//      - Receives user's message text in request body
//      - Validates: not empty, is a string, max 2000 chars
//      - Calls chat service which:
//        a) Fetches user's therapy style from assessment
//        b) Builds a system prompt for the AI
//        c) Fetches last 5 messages for conversation context
//        d) Calls Groq/OpenAI API for AI response
//        e) Saves both messages to database
//      - Returns: { aiResponse, userMessage, therapyStyle }
//
//   2. getHistory (GET /api/chat/history)
//      - Fetches user's conversation history with the AI
//      - Supports ?limit=N query parameter (default 20, max 100)
//      - Returns messages in chronological order
//      - Used by ChatPage to display past conversations on load
//
//   3. clearHistory (DELETE /api/chat/history)
//      - Deletes ALL messages for the authenticated user
//      - WARNING: This action cannot be undone
//      - Returns count of deleted messages
//
// WHY THIS FILE EXISTS:
//   Separates HTTP validation (message length, type checking)
//   from AI logic (prompt building, API calls) which lives in
//   chat.service.js.
//
// ALL ENDPOINTS REQUIRE: JWT authentication
// ============================================================

// Import chat service with business logic
const chatService = require("../services/chat.service");

// === CHAT CONTROLLER ===
// Handles HTTP requests for AI-powered chat conversations
// Acts as intermediary between routes and service layer

const chatController = {

  /**
   * POST /api/chat/send
   * Send a message to the AI therapist and get response
   * Requires: JWT authentication
   * Body: { message: string } - User's message
   * Returns: { aiResponse: string, userMessage: string }
   */
  sendMessage: async (req, res) => {
    try {
      // Extract user ID from authenticated request (set by auth middleware)
      const userId = req.user.userId;

      // Extract message from request body
      const { message } = req.body;

      // === VALIDATE INPUT ===

      if (!message) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
          code: "MISSING_MESSAGE"
        });
      }

      if (typeof message !== "string") {
        return res.status(400).json({
          success: false,
          error: "Message must be a string",
          code: "INVALID_MESSAGE_TYPE"
        });
      }

      if (message.length > 2000) {
        return res.status(400).json({
          success: false,
          error: "Message is too long (max 2000 characters)",
          code: "MESSAGE_TOO_LONG"
        });
      }

      // === SEND MESSAGE TO CHAT SERVICE ===

      // Call chat service to process message and get AI response
      // This handles: conversation history, AI model call, message saving
      const result = await chatService.sendMessage(userId, message);

      // If successful, return the response
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      // If chat failed due to empty message etc.
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      // Catch any unexpected errors (e.g., OpenAI API timeout, database error)
      console.error("Error in sendMessage:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to process chat message",
        code: "CHAT_ERROR"
      });
    }
  },

  /**
   * GET /api/chat/history
   * Get user's conversation history with the AI
   * Requires: JWT authentication
   * Query params: limit (optional, default 20, max 100)
   * Returns: Array of previous messages
   */
  getHistory: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Extract limit from query parameters (default 20)
      const limit = parseInt(req.query.limit) || 20;

      // === VALIDATE LIMIT ===

      if (limit > 100 || limit < 1) {
        return res.status(400).json({
          success: false,
          error: "Limit must be between 1 and 100",
          code: "INVALID_LIMIT"
        });
      }

      // === FETCH CONVERSATION HISTORY ===

      // Call chat service to get conversation history
      const result = await chatService.getConversationHistory(userId, limit);

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          count: result.count,
          message: result.message
        });
      }

      return res.status(500).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in getHistory:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch conversation history",
        code: "HISTORY_ERROR"
      });
    }
  },

  /**
   * DELETE /api/chat/history
   * Delete user's entire conversation history
   * WARNING: This action cannot be undone
   * Requires: JWT authentication
   * Returns: Confirmation of deletion
   */
  clearHistory: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // === CLEAR CONVERSATION HISTORY ===

      // Call chat service to delete all messages for this user
      const result = await chatService.clearConversationHistory(userId);

      if (result.success) {
        return res.status(200).json({
          success: true,
          deletedCount: result.deletedCount,
          message: result.message
        });
      }

      return res.status(500).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in clearHistory:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to clear conversation history",
        code: "CLEAR_ERROR"
      });
    }
  }
};

// Export controller functions for use in routes
module.exports = chatController;