// ============================================================
// MOOD.JS — Mood Entry MongoDB Model (Schema)
// ============================================================
//
// FILE PURPOSE:
//   This file defines the database schema for mood entries.
//   Users log their mood on a 1-10 scale with an optional note,
//   and this model stores each entry for tracking over time.
//
// WHAT THIS FILE DOES:
//   1. Defines the Mood schema with score and optional note
//   2. Creates the Mongoose model for database operations
//   3. Exports for use in mood service
//
// SCHEMA FIELDS:
//   userId    — Which user logged this mood (ObjectId ref)
//   moodScore — Rating from 1-10 (required)
//              1 = very sad/depressed, 5 = neutral, 10 = euphoric
//   note      — Optional text about what's influencing the mood
//              (e.g., "had a great meeting" or "argument with friend")
//   createdAt — When the mood was logged (auto via timestamps)
//   updatedAt — Auto-generated (via timestamps)
//
// WHY THIS FILE EXISTS:
//   - Enables mood tracking over days/weeks/months
//   - MoodPage uses this data to show bar charts and stats
//   - Dashboard shows weekly mood summary from this data
//   - Helps users identify emotional patterns and triggers
//
// USED BY: mood.service.js
// ============================================================

// Import mongoose
const mongoose = require("mongoose");

// Schema for mood tracking
const moodSchema = new mongoose.Schema({

  // Which user this mood belongs to
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Mood rating 1–10
  moodScore: {
    type: Number,
    required: true
  },

  // Optional note
  note: String

}, {
  timestamps: true // adds createdAt
});

const Mood = mongoose.model("Mood", moodSchema);

module.exports = Mood;