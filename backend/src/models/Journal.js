// ============================================================
// JOURNAL.JS — Journal Entry MongoDB Model (Schema)
// ============================================================
//
// FILE PURPOSE:
//   This file defines the database schema for journal entries.
//   Each journal entry stores the user's written text along with
//   AI-generated sentiment analysis and therapeutic insight.
//
// WHAT THIS FILE DOES:
//   1. Defines the Journal schema with content and AI fields
//   2. Creates the Mongoose model for database operations
//   3. Exports for use in journal service
//
// SCHEMA FIELDS:
//   userId    — Which user wrote this entry (ObjectId ref)
//   content   — The user's journal text (what they wrote)
//   sentiment — AI-determined sentiment: "positive" | "negative" | "neutral"
//              (set by calling AI with the content for analysis)
//   aiInsight — AI-generated empathetic reflection (2-3 sentences)
//              (provides therapeutic insight about the entry)
//   createdAt — When the entry was written (auto via timestamps)
//   updatedAt — Auto-generated (via timestamps)
//
// WHY THIS FILE EXISTS:
//   - Stores journal entries for users to revisit
//   - AI analysis (sentiment + insight) adds therapeutic value
//   - Sentiment tracking over time shows emotional trends
//   - The JournalPage displays sentiment statistics from this data
//
// USED BY: journal.service.js
// ============================================================

const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  content: String,

  sentiment: String,

  aiInsight: String

}, { timestamps: true });

const Journal = mongoose.model("Journal", journalSchema);

module.exports = Journal;