// ============================================================
// CHAT.ROUTES.JS — URL Routing for AI Chat Endpoints
// ============================================================
//
// FILE PURPOSE:
//   This file defines the URL routes for the AI therapist chat
//   feature. All routes are protected — users must be logged in
//   to chat with the AI.
//
// WHAT THIS FILE DOES:
//   Defines 3 routes, ALL protected by JWT auth middleware:
//
//   POST /api/chat/send
//     → chatController.sendMessage
//     → Send a message to AI therapist, get response back
//     → Body: { message: "user's text" }
//     → Returns: { aiResponse, userMessage, therapyStyle }
//
//   GET /api/chat/history
//     → chatController.getHistory
//     → Get past conversation messages
//     → Query: ?limit=20 (default 20, max 100)
//
//   DELETE /api/chat/history
//     → chatController.clearHistory
//     → Delete ALL conversation history (irreversible!)
//     → Returns: { deletedCount }
//
// NOTE: GET and DELETE both use "/history" path but different
//       HTTP methods — this is RESTful design at work.
//
// USED BY: app.js (mounted at /api/chat)
// ============================================================

// Import Express router
const express = require("express");

// Import chat controller with route handlers
const chatController = require("../controllers/chat.controller");

// Import auth middleware to protect routes
const authMiddleware = require("../middleware/auth.middleware");

// Create router instance
const router = express.Router();

// === CHAT ROUTES ===
// All routes require JWT authentication (authMiddleware)
// These routes handle AI-powered therapeutic conversations

/**
 * POST /api/chat/send
 * Send a message to AI therapist and get response
 * Requires: JWT token in Authorization header
 * Body: { message: string }
 * Returns: { aiResponse: string, userMessage: string }
 */
router.post(
  "/send",
  authMiddleware,           // Verify user is authenticated
  chatController.sendMessage
);

/**
 * GET /api/chat/history
 * Get user's conversation history with the AI
 * Shows all past messages in chronological order
 * Requires: JWT token in Authorization header
 * Query params: limit (optional, default 20)
 * Returns: Array of messages with user and assistant messages
 */
router.get(
  "/history",
  authMiddleware,           // Verify user is authenticated
  chatController.getHistory
);

/**
 * DELETE /api/chat/history
 * Delete user's entire conversation history
 * WARNING: This action cannot be undone
 * Requires: JWT token in Authorization header
 * Returns: Confirmation with deleted message count
 */
router.delete(
  "/history",
  authMiddleware,           // Verify user is authenticated
  chatController.clearHistory
);

// Export router for use in app.js
module.exports = router;