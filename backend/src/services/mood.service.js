// ============================================================
// MOOD.SERVICE.JS — Mood Tracking Business Logic
// ============================================================
//
// FILE PURPOSE:
//   This service handles mood logging and historical analysis.
//   Users log their emotional state (1-10 scale) with optional
//   notes, and this service stores entries and calculates
//   statistics for trend visualization.
//
// WHAT THIS FILE DOES:
//   Provides 2 methods:
//
//   1. logMood(userId, moodScore, note)
//      - Validates mood score is a number between 1-10
//      - Creates a new Mood document in database
//      - Stores the score, optional note, and timestamp
//      - Returns the saved mood entry
//
//   2. getMoodHistory(userId, days)
//      - Calculates date range (last N days from now)
//      - Queries all mood entries within that range
//      - Calculates statistics:
//        a) count: total number of entries
//        b) average: mean mood score (rounded to 1 decimal)
//        c) highest: best mood score in the period
//        d) lowest: worst mood score in the period
//        e) trend: difference between newest and oldest score
//           (positive = improving, negative = declining)
//      - Returns entries + stats for MoodPage visualization
//
// MOOD SCALE:
//   1-2: Very sad/depressed  |  3-4: Unhappy/stressed
//   5:   Neutral             |  6-7: Happy/content
//   8-9: Very happy          |  10:  Euphoric/amazing
//
// HOW TREND IS CALCULATED:
//   trend = most_recent_score - oldest_score
//   Example: If oldest entry is 4 and newest is 7 -> trend = +3 (improving)
//   Example: If oldest entry is 8 and newest is 5 -> trend = -3 (declining)
//
// USED BY: mood.controller.js
//   Also used by DashboardPage (via moodAPI.getHistory(7))
//   for the weekly mood summary cards
// ============================================================

// Import Mood model
const Mood = require("../models/Mood");

// === MOOD SERVICE ===
// Handles mood tracking and trending for users
// Allows users to log daily moods and view trends over time

const moodService = {

  /**
   * Log a mood entry
   * @param {string} userId - ID of user
   * @param {number} moodScore - Mood rating from 1-10 (1 very sad, 10 very happy)
   * @param {string} note - Optional note about the mood or events
   * @returns {Object} Saved mood entry
   */
  logMood: async (userId, moodScore, note = "") => {
    try {
      // === VALIDATE INPUT ===

      // Check if mood score is provided
      if (moodScore === undefined || moodScore === null) {
        return {
          success: false,
          error: "Mood score is required",
          code: "MISSING_SCORE"
        };
      }

      // Validate mood score is between 1-10
      if (typeof moodScore !== "number" || moodScore < 1 || moodScore > 10) {
        return {
          success: false,
          error: "Mood score must be a number between 1-10",
          code: "INVALID_SCORE"
        };
      }

      // === CREATE MOOD ENTRY ===

      // Create new mood document with score and optional note
      const moodEntry = new Mood({
        userId,
        moodScore,
        note: note || undefined // Don't store empty notes
      });

      // Save to database
      await moodEntry.save();

      return {
        success: true,
        data: moodEntry,
        message: "Mood logged successfully"
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "LOG_ERROR"
      };
    }
  },

  /**
   * Get user's mood history
   * @param {string} userId - ID of user
   * @param {number} days - Number of days to fetch (default 30)
   * @returns {Object} Array of mood entries with statistics
   */
  getMoodHistory: async (userId, days = 30) => {
    try {
      // === CALCULATE DATE RANGE ===

      // Calculate start date (days ago from now)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // === QUERY MOOD DATA ===

      // Fetch all mood entries for this user in the specified date range
      const moodEntries = await Mood.find({
        userId,
        // Only get moods from the past N days
        createdAt: { $gte: startDate }
      })
        .sort({ createdAt: -1 }) // Most recent first
        .exec();

      // === CALCULATE STATISTICS ===

      if (moodEntries.length === 0) {
        return {
          success: true,
          data: {
            entries: [],
            stats: {
              count: 0,
              average: 0,
              highest: 0,
              lowest: 0
            }
          },
          message: "No mood entries found for this period"
        };
      }

      // Calculate average mood score
      const totalScore = moodEntries.reduce((sum, entry) => sum + entry.moodScore, 0);
      const averageMood = (totalScore / moodEntries.length).toFixed(1);

      // Find highest and lowest mood scores
      const scores = moodEntries.map(entry => entry.moodScore);
      const highestMood = Math.max(...scores);
      const lowestMood = Math.min(...scores);

      return {
        success: true,
        data: {
          entries: moodEntries,
          stats: {
            count: moodEntries.length,
            average: parseFloat(averageMood),
            highest: highestMood,
            lowest: lowestMood,
            trend: moodEntries.length > 1 
              ? (moodEntries[0].moodScore - moodEntries[moodEntries.length - 1].moodScore) 
              : 0 // Positive = improving, negative = declining
          }
        },
        message: `Retrieved ${moodEntries.length} mood entries`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "HISTORY_ERROR"
      };
    }
  }
};

// Export mood service
module.exports = moodService;