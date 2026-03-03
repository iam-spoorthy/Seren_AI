// ============================================================
// JOURNAL.ROUTES.JS — URL Routing for Journal Endpoints
// ============================================================
//
// FILE PURPOSE:
//   This file defines the URL routes for the AI-assisted
//   journaling feature. All routes require JWT authentication.
//
// WHAT THIS FILE DOES:
//   Defines 4 routes, ALL protected by JWT auth middleware:
//
//   POST /api/journal/create
//     → journalController.createEntry
//     → Create a new journal entry (AI analyzes it)
//     → Body: { content: "journal text" }
//     → Returns: { content, sentiment, aiInsight }
//
//   GET /api/journal/entries
//     → journalController.getEntries
//     → List journal entries with sentiment stats
//     → Query: ?limit=10 (default 10, max 50)
//
//   GET /api/journal/entry/:entryId
//     → journalController.getEntry
//     → Get a single entry by its MongoDB ID
//     → Params: entryId (in URL path)
//
//   DELETE /api/journal/entry/:entryId
//     → journalController.deleteEntry
//     → Permanently delete a journal entry
//     → Params: entryId (in URL path)
//
// USED BY: app.js (mounted at /api/journal)
// ============================================================

// Import Express router
const express = require("express");

// Import journal controller
const journalController = require("../controllers/journal.controller");

// Import auth middleware
const authMiddleware = require("../middleware/auth.middleware");

// Create router instance
const router = express.Router();

// === JOURNAL ROUTES ===
// All routes require JWT authentication
// These routes handle AI-assisted journaling

/**
 * POST /api/journal/create
 * Create a new journal entry with AI analysis
 * Requires: JWT token in Authorization header
 * Body: { content: string }
 * Returns: { journalEntry with sentiment and AI insight }
 */
router.post(
  "/create",
  authMiddleware,
  journalController.createEntry
);

/**
 * GET /api/journal/entries
 * Get user's journal entries with sentiment trends
 * Requires: JWT token in Authorization header
 * Query params: limit (optional, default 10)
 * Returns: { entries: Array, stats: { sentiments, mood } }
 */
router.get(
  "/entries",
  authMiddleware,
  journalController.getEntries
);

/**
 * GET /api/journal/entry/:entryId
 * Get specific journal entry details
 * Requires: JWT token in Authorization header
 * Params: entryId - ID of the journal entry
 * Returns: { journalEntry with AI insight }
 */
router.get(
  "/entry/:entryId",
  authMiddleware,
  journalController.getEntry
);

/**
 * DELETE /api/journal/entry/:entryId
 * Delete a journal entry
 * Requires: JWT token in Authorization header
 * Params: entryId - ID of the journal entry to delete
 * Returns: { success confirmation }
 */
router.delete(
  "/entry/:entryId",
  authMiddleware,
  journalController.deleteEntry
);

// Export router
module.exports = router;
