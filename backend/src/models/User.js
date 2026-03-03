// ============================================================
// USER.JS — User Account MongoDB Model (Schema)
// ============================================================
//
// FILE PURPOSE:
//   This file defines the database schema for user accounts.
//   Every person who signs up (or uses the app anonymously)
//   gets a User document in MongoDB. This is the foundation
//   that all other data (assessments, chats, moods, journals)
//   references via userId.
//
// WHAT THIS FILE DOES:
//   1. Defines the User schema with email, password, isAnonymous
//   2. Creates the Mongoose model for database operations
//   3. Exports for use in auth service
//
// SCHEMA FIELDS:
//   email       — User's email address (unique, required)
//                For anonymous users: auto-generated like
//                "anonymous_1234_abc@serenai.local"
//   password    — Bcrypt-hashed password (required)
//                NEVER stored in plain text for security
//                For anonymous users: random hashed string
//   isAnonymous — Boolean flag (default: false)
//                True if user chose "Continue Anonymously"
//                Anonymous users don't provide real email/password
//   createdAt   — Account creation timestamp (auto via timestamps)
//   updatedAt   — Auto-generated (via timestamps)
//
// WHY THIS FILE EXISTS:
//   - Every feature needs to know WHO is using it
//   - userId from this model is referenced by Assessment,
//     ChatMessage, Journal, and Mood models
//   - Auth service uses this to create accounts, verify logins,
//     and fetch profiles
//
// SECURITY NOTES:
//   - Password is hashed with bcrypt (10 salt rounds) before storage
//   - API responses NEVER include the password field
//   - email has unique constraint to prevent duplicate accounts
//
// USED BY: auth.service.js
// ============================================================

// Import mongoose to define database schema
const mongoose = require("mongoose");

// Create schema for user
const userSchema = new mongoose.Schema({

  // Email of user
  email: {
    type: String,
    required: true,
    unique: true
  },

  // Hashed password
  password: {
    type: String,
    required: true
  },

  // Anonymous user option
  isAnonymous: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

// Create and export the model
const User = mongoose.model("User", userSchema);

// Export model
module.exports = User;