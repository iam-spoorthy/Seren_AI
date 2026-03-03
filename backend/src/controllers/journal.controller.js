// ============================================================
// JOURNAL.CONTROLLER.JS — HTTP Handler for Journaling
// ============================================================
//
// FILE PURPOSE:
//   This controller handles ALL HTTP requests related to the
//   AI-assisted journal feature. Users write journal entries,
//   and the AI analyzes them to provide insights and sentiment.
//
// WHAT THIS FILE DOES:
//   Provides 4 endpoint handlers:
//
//   1. createEntry (POST /api/journal/create)
//      - Receives journal content text from user
//      - Validates content is not empty
//      - Calls journal service which:
//        a) Sends content to AI for empathetic insight (2-3 sentences)
//        b) Sends content to AI for sentiment analysis (pos/neg/neutral)
//        c) Saves entry with AI analysis to database
//      - Returns: { content, sentiment, aiInsight, createdAt }
//
//   2. getEntries (GET /api/journal/entries)
//      - Fetches user's journal entries (newest first)
//      - Supports ?limit=N query parameter (default 10, max 50)
//      - Also returns sentiment statistics (positive/negative/neutral counts)
//      - Used by JournalPage to show entry list and sentiment overview
//
//   3. getEntry (GET /api/journal/entry/:entryId)
//      - Fetches a single journal entry by its ID
//      - Verifies the entry belongs to the authenticated user
//      - Returns full entry with AI insight
//      - Returns 404 if entry not found
//
//   4. deleteEntry (DELETE /api/journal/entry/:entryId)
//      - Permanently deletes a journal entry
//      - Verifies ownership before deleting
//      - Returns 404 if entry not found
//
// ALL ENDPOINTS REQUIRE: JWT authentication
// ============================================================

// Import journal service
const journalService = require("../services/journal.service");

// === JOURNAL CONTROLLER ===
// Handles HTTP requests for AI-assisted journaling
// Acts as intermediary between routes and service layer

const journalController = {

  /**
   * POST /api/journal/create
   * Create a new journal entry with AI analysis
   * Requires: JWT authentication
   * Body: { content: string }
   * Returns: Saved journal entry with AI insight and sentiment
   */
  createEntry: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Extract journal content from request body
      const { content } = req.body;

      // === VALIDATE INPUT ===

      if (!content) {
        return res.status(400).json({
          success: false,
          error: "Journal content is required",
          code: "MISSING_CONTENT"
        });
      }

      // === CREATE JOURNAL ENTRY ===

      // Call journal service to create entry and generate AI insight
      const result = await journalService.createEntry(userId, content);

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
      console.error("Error in createEntry:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "CREATE_ERROR"
      });
    }
  },

  /**
   * GET /api/journal/entries
   * Get user's journal entries with sentiment statistics
   * Requires: JWT authentication
   * Query params: limit (optional, default 10, max 50)
   * Returns: Array of journal entries with stats
   */
  getEntries: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Extract limit from query parameters
      const limit = parseInt(req.query.limit) || 10;

      // === VALIDATE LIMIT ===

      if (limit > 50 || limit < 1) {
        return res.status(400).json({
          success: false,
          error: "Limit must be between 1 and 50",
          code: "INVALID_LIMIT"
        });
      }

      // === GET ENTRIES ===

      // Call journal service to fetch entries
      const result = await journalService.getEntries(userId, limit);

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
      console.error("Error in getEntries:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "FETCH_ERROR"
      });
    }
  },

  /**
   * GET /api/journal/entry/:entryId
   * Get specific journal entry details
   * Requires: JWT authentication
   * Params: entryId (ID of the journal entry)
   * Returns: Journal entry with AI insight
   */
  getEntry: async (req, res) => {
    try {
      // Extract user ID and entry ID
      const userId = req.user.userId;
      const { entryId } = req.params;

      // === VALIDATE INPUT ===

      if (!entryId) {
        return res.status(400).json({
          success: false,
          error: "Entry ID is required",
          code: "MISSING_ID"
        });
      }

      // === GET ENTRY ===

      // Call journal service to fetch specific entry
      const result = await journalService.getEntryById(userId, entryId);

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      // Entry not found
      return res.status(404).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      console.error("Error in getEntry:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "FETCH_ERROR"
      });
    }
  },

  /**
   * DELETE /api/journal/entry/:entryId
   * Delete a journal entry
   * Requires: JWT authentication
   * Params: entryId (ID of the journal entry to delete)
   * Returns: Confirmation of deletion
   */
  deleteEntry: async (req, res) => {
    try {
      // Extract user ID and entry ID
      const userId = req.user.userId;
      const { entryId } = req.params;

      // === VALIDATE INPUT ===

      if (!entryId) {
        return res.status(400).json({
          success: false,
          error: "Entry ID is required",
          code: "MISSING_ID"
        });
      }

      // === DELETE ENTRY ===

      // Call journal service to delete entry
      const result = await journalService.deleteEntry(userId, entryId);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message
        });
      }

      // Entry not found
      return res.status(404).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      console.error("Error in deleteEntry:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "DELETE_ERROR"
      });
    }
  }
};

// Export controller functions
module.exports = journalController;