// ============================================================
// ASSESSMENT.JS — Assessment MongoDB Model (Schema)
// ============================================================
//
// FILE PURPOSE:
//   This file defines the database schema (structure) for
//   mental health assessment results. Every time a user
//   submits the 7-question assessment, a new Assessment
//   document is created and stored in MongoDB.
//
// WHAT THIS FILE DOES:
//   1. Defines the shape of an Assessment document
//   2. Creates a Mongoose model (Assessment) for DB operations
//   3. Exports the model for use in services
//
// SCHEMA FIELDS:
//   userId          — Links this assessment to a specific user
//                    (MongoDB ObjectId reference to User collection)
//   stressScore     — Sum of stress questions (q1+q2+q3, max 15)
//   anxietyScore    — Sum of anxiety questions (q4+q5, max 10)
//   sleepScore      — Sleep quality rating (q6, range 1-5)
//   selfEsteemScore — Confidence rating (q7, range 1-5)
//   therapyStyle    — AI therapy approach: "supportive" | "calm_grounding" | "reflective"
//   riskLevel       — Crisis risk: "low" | "moderate" | "high"
//   createdAt       — Auto-generated timestamp (via { timestamps: true })
//   updatedAt       — Auto-generated timestamp (via { timestamps: true })
//
// WHY THIS FILE EXISTS:
//   - Mongoose models define the contract for database documents
//   - Without this, DB operations would have no structure validation
//   - The schema ensures all assessments have consistent fields
//
// USED BY: assessment.service.js, chat.service.js (to get therapyStyle)
// ============================================================

const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  stressScore: Number,
  anxietyScore: Number,
  sleepScore: Number,
  selfEsteemScore: Number,

  therapyStyle: String,
  riskLevel: String

}, { timestamps: true });

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;