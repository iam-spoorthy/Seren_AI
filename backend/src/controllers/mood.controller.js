// ============================================================
// MOOD.CONTROLLER.JS — HTTP Handler for Mood Tracking
// ============================================================
//
// FILE PURPOSE:
//   This controller handles ALL HTTP requests related to the
//   mood tracking feature. Users can log their mood (1-10 scale)
//   and view historical mood data with statistics.
//
// WHAT THIS FILE DOES:
//   Provides 2 endpoint handlers:
//
//   1. logMood (POST /api/mood/log)
//      - Receives mood score (1-10) and optional note from user
//      - Validates: score is provided (validation of range
//        happens in the service layer)
//      - Calls mood service to save the entry to database
//      - Returns: saved mood entry with timestamp
//
//   2. getHistory (GET /api/mood/history)
//      - Fetches user's mood entries for a given time period
//      - Supports ?days=N query parameter (default 30, max 365)
//      - Returns entries + statistics:
//        • average mood score
//        • highest and lowest scores
//        • trend (improving/declining/stable)
//        • total entry count
//      - Used by MoodPage for bar chart and stat cards
//      - Also used by DashboardPage for weekly mood summary
//
// WHY MOOD TRACKING MATTERS:
//   - Helps users become aware of emotional patterns
//   - Data is used on the dashboard to show weekly summaries
//   - Trends show if the user is improving or declining
//   - Can identify triggers when combined with notes
//
// ALL ENDPOINTS REQUIRE: JWT authentication
// ============================================================

// Import mood service
const moodService = require("../services/mood.service");

// === MOOD CONTROLLER ===
// Handles HTTP requests for mood tracking
// Acts as intermediary between routes and service layer

const moodController = {

  /**
   * POST /api/mood/log
   * Log a new mood entry
   * Requires: JWT authentication
   * Body: { moodScore: number (1-10), note: optional string }
   * Returns: Saved mood entry
   */
  logMood: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Extract mood data from request body
      const { moodScore, note } = req.body;

      // === VALIDATE INPUT ===

      if (moodScore === undefined) {
        return res.status(400).json({
          success: false,
          error: "Mood score is required",
          code: "MISSING_SCORE"
        });
      }

      // === LOG MOOD ===

      // Call mood service to save mood entry
      const result = await moodService.logMood(userId, moodScore, note);

      // If successful
      if (result.success) {
        return res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      // If validation failed
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      console.error("Error in logMood:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "LOG_ERROR"
      });
    }
  },

  /**
   * GET /api/mood/history
   * Get user's mood history with trends and statistics
   * Requires: JWT authentication
   * Query params: days (optional, default 30)
   * Returns: Array of mood entries with stats
   */
  getHistory: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Extract days parameter from query (default 30 days)
      const days = parseInt(req.query.days) || 30;

      // === VALIDATE DAYS PARAMETER ===

      if (days > 365 || days < 1) {
        return res.status(400).json({
          success: false,
          error: "Days must be between 1 and 365",
          code: "INVALID_DAYS"
        });
      }

      // === GET MOOD HISTORY ===

      // Call mood service to fetch history and statistics
      const result = await moodService.getMoodHistory(userId, days);

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      return res.status(500).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      console.error("Error in getHistory:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "HISTORY_ERROR"
      });
    }
  }
};

// Export controller functions
module.exports = moodController;
