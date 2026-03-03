// ============================================================
// MOOD.ROUTES.JS — URL Routing for Mood Tracking Endpoints
// ============================================================
//
// FILE PURPOSE:
//   This file defines the URL routes for the mood tracking
//   feature. Users can log their mood and view historical data.
//   All routes require JWT authentication.
//
// WHAT THIS FILE DOES:
//   Defines 2 routes, ALL protected by JWT auth middleware:
//
//   POST /api/mood/log
//     → moodController.logMood
//     → Log a new mood entry with score (1-10) and optional note
//     → Body: { moodScore: 7, note: "feeling good today" }
//
//   GET /api/mood/history
//     → moodController.getHistory
//     → Get mood entries + statistics for a time period
//     → Query: ?days=30 (default 30, max 365)
//     → Returns: { entries, stats: {count, average, highest, lowest, trend} }
//
// USED BY: app.js (mounted at /api/mood)
// ============================================================

// Import Express router
const express = require("express");

// Import mood controller
const moodController = require("../controllers/mood.controller");

// Import auth middleware
const authMiddleware = require("../middleware/auth.middleware");

// Create router instance
const router = express.Router();

// === MOOD ROUTES ===
// All routes require JWT authentication
// These routes handle mood tracking and trending

/**
 * POST /api/mood/log
 * Log a new mood entry
 * Requires: JWT token in Authorization header
 * Body: { moodScore: number (1-10), note: optional string }
 * Returns: { moodEntry with timestamp }
 */
router.post(
  "/log",
  authMiddleware,
  moodController.logMood
);

/**
 * GET /api/mood/history
 * Get user's mood history with statistics and trends
 * Requires: JWT token in Authorization header
 * Query params: days (optional, default 30)
 * Returns: { entries: Array, stats: { average, highest, lowest, trend } }
 */
router.get(
  "/history",
  authMiddleware,
  moodController.getHistory
);

// Export router
module.exports = router;
