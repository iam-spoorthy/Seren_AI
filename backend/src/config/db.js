// ============================================================
// DB.JS — MongoDB Database Connection
// ============================================================
//
// FILE PURPOSE:
//   This file handles connecting to MongoDB using Mongoose.
//   It exports a single function `connectDB()` that server.js
//   calls during startup. If the database connection fails,
//   the entire application exits (no point running without DB).
//
// WHAT THIS FILE DOES:
//   1. Imports Mongoose (MongoDB object modeling library)
//   2. Defines an async function that connects to MongoDB
//   3. Uses MONGO_URL from .env for the connection string
//   4. Logs success/failure messages to console
//   5. Exits the process if connection fails (process.exit(1))
//
// WHY THIS FILE EXISTS:
//   - Centralizes database connection logic in one place
//   - server.js can simply call connectDB() without knowing
//     the details of how the connection works
//   - Makes it easy to add connection options, retry logic,
//     or event listeners in the future
//
// ENVIRONMENT VARIABLES REQUIRED:
//   MONGO_URL — Full MongoDB connection string
//               Example: mongodb+srv://user:pass@cluster.mongodb.net/serenai
//
// USED BY: server.js (called once on startup)
// ============================================================

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("✅ MongoDB Connected Successfully");

  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Exit app if DB fails
  }
};

module.exports = connectDB;