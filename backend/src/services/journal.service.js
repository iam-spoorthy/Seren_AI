// ============================================================
// JOURNAL.SERVICE.JS — AI-Assisted Journaling Business Logic
// ============================================================
//
// FILE PURPOSE:
//   This service handles the AI-assisted journaling feature.
//   When a user writes a journal entry, this service sends it
//   to the AI TWICE: once for an empathetic insight, and once
//   for sentiment analysis. Both results are saved with the entry.
//
// WHAT THIS FILE DOES:
//   Provides 4 methods:
//
//   1. createEntry(userId, content)
//      THE MAIN FLOW (step by step):
//      a) Validates content is not empty and not too long (max 5000 chars)
//      b) FIRST AI CALL: Sends content to AI for empathetic insight
//         - AI acts as therapist analyzing the journal entry
//         - Returns 2-3 sentence supportive reflection
//      c) SECOND AI CALL: Sends content for sentiment analysis
//         - AI responds with one word: positive/negative/neutral
//         - Validates the response is one of the three valid values
//      d) Saves journal entry with content + aiInsight + sentiment
//      e) Returns the complete saved entry
//
//   2. getEntries(userId, limit)
//      - Fetches journal entries (newest first)
//      - Calculates sentiment statistics:
//        { positive: 5, negative: 2, neutral: 3 }
//      - Determines overall mood trend (improving vs. declining)
//      - Returns entries + stats for the JournalPage
//
//   3. getEntryById(userId, entryId)
//      - Fetches a single entry by its MongoDB ID
//      - Verifies the entry belongs to the requesting user
//      - Returns full entry including AI insight
//
//   4. deleteEntry(userId, entryId)
//      - Permanently deletes an entry
//      - Verifies ownership (user can only delete their own entries)
//      - Returns 404 if entry not found
//
// AI MODEL: Same Groq/LLaMA setup as chat.service.js
//   - Insight generation: max 150 tokens (short reflection)
//   - Sentiment analysis: max 10 tokens (single word response)
//
// WHY TWO AI CALLS?
//   - Different prompts for different tasks produce better results
//   - Insight prompt: "Be an empathetic therapist..."
//   - Sentiment prompt: "Respond with one word: positive/negative/neutral"
//   - Single-task prompts are more reliable than multi-task ones
//
// USED BY: journal.controller.js
// ============================================================

// Import Journal model
const Journal = require("../models/Journal");

// Import OpenAI-compatible library (Groq uses the same API format)
const { OpenAI } = require("openai");

// Initialize Groq client using OpenAI-compatible SDK
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// === JOURNAL SERVICE ===
// Handles AI-assisted journaling
// Users write journal entries and get AI insights and sentiment analysis

const journalService = {

  /**
   * Create a new journal entry
   * @param {string} userId - ID of user
   * @param {string} content - Journal entry content
   * @returns {Object} Saved journal entry with AI insight
   */
  createEntry: async (userId, content) => {
    try {
      // === VALIDATE INPUT ===

      if (!content || content.trim().length === 0) {
        return {
          success: false,
          error: "Journal content cannot be empty",
          code: "EMPTY_CONTENT"
        };
      }

      if (content.length > 5000) {
        return {
          success: false,
          error: "Journal entry is too long (max 5000 characters)",
          code: "CONTENT_TOO_LONG"
        };
      }

      // === GENERATE AI INSIGHT ===

      // Call OpenAI to analyze the journal entry and generate insight
      // This helps the user reflect on their thoughts and feelings
      const insightResponse = await openai.chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an empathetic therapist analyzing a journal entry. Provide a brief (2-3 sentences), insightful response that helps the user reflect on their feelings and thoughts. Be warm and supportive.`
          },
          {
            role: "user",
            content: `Please analyze this journal entry and provide an insight: "${content}"`
          }
        ],
        max_tokens: 150
      });

      const aiInsight = insightResponse.choices[0].message.content;

      // === ANALYZE SENTIMENT ===

      // Determine sentiment from the entry
      // This helps track emotional trends
      const sentimentResponse = await openai.chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of this text and respond with only one word: positive, negative, or neutral"
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 10
      });

      const sentiment = sentimentResponse.choices[0].message.content.trim().toLowerCase();
      const validSentiments = ["positive", "negative", "neutral"];
      const finalSentiment = validSentiments.includes(sentiment) ? sentiment : "neutral";

      // === SAVE JOURNAL ENTRY ===

      // Create and save journal entry with AI analysis
      const journalEntry = new Journal({
        userId,
        content,
        sentiment: finalSentiment,
        aiInsight
      });

      await journalEntry.save();

      return {
        success: true,
        data: journalEntry,
        message: "Journal entry created successfully"
      };

    } catch (error) {
      console.error("Journal creation error:", error);
      return {
        success: false,
        error: error.message,
        code: "CREATE_ERROR"
      };
    }
  },

  /**
   * Get user's journal entries
   * @param {string} userId - ID of user
   * @param {number} limit - Number of entries to return (default 10)
   * @returns {Object} Array of journal entries
   */
  getEntries: async (userId, limit = 10) => {
    try {
      // === VALIDATE LIMIT ===

      if (limit > 50 || limit < 1) {
        return {
          success: false,
          error: "Limit must be between 1 and 50",
          code: "INVALID_LIMIT"
        };
      }

      // === FETCH ENTRIES ===

      // Get user's journal entries sorted by most recent first
      const entries = await Journal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      // === CALCULATE SENTIMENT STATS ===

      const sentimentCounts = {
        positive: 0,
        negative: 0,
        neutral: 0
      };

      entries.forEach(entry => {
        if (sentimentCounts.hasOwnProperty(entry.sentiment)) {
          sentimentCounts[entry.sentiment]++;
        }
      });

      return {
        success: true,
        data: {
          entries,
          stats: {
            totalEntries: entries.length,
            sentiments: sentimentCounts,
            mood: entries.length > 0 
              ? (sentimentCounts.positive > sentimentCounts.negative ? "improving" : "declining")
              : "neutral"
          }
        },
        message: `Retrieved ${entries.length} journal entries`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "FETCH_ERROR"
      };
    }
  },

  /**
   * Get specific journal entry
   * @param {string} userId - ID of user
   * @param {string} entryId - ID of journal entry
   * @returns {Object} Journal entry details
   */
  getEntryById: async (userId, entryId) => {
    try {
      // Find entry and verify it belongs to this user
      const entry = await Journal.findOne({
        _id: entryId,
        userId
      });

      if (!entry) {
        return {
          success: false,
          error: "Journal entry not found",
          code: "NOT_FOUND"
        };
      }

      return {
        success: true,
        data: entry,
        message: "Journal entry retrieved"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "FETCH_ERROR"
      };
    }
  },

  /**
   * Delete a journal entry
   * @param {string} userId - ID of user
   * @param {string} entryId - ID of journal entry to delete
   * @returns {Object} Confirmation of deletion
   */
  deleteEntry: async (userId, entryId) => {
    try {
      // Delete entry and verify it belonged to this user
      const result = await Journal.deleteOne({
        _id: entryId,
        userId
      });

      if (result.deletedCount === 0) {
        return {
          success: false,
          error: "Journal entry not found",
          code: "NOT_FOUND"
        };
      }

      return {
        success: true,
        message: "Journal entry deleted successfully"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "DELETE_ERROR"
      };
    }
  }
};

// Export journal service
module.exports = journalService;