// ============================================================
// SERVER.JS — Application Entry Point (Starts the Server)
// ============================================================
//
// FILE PURPOSE:
//   This is the file that actually STARTS the backend server.
//   It connects to MongoDB first, then starts Express listening
//   on a port. This is the file you run: `node src/server.js`
//
// WHAT THIS FILE DOES (step by step):
//   1. Loads environment variables from .env file
//   2. Imports the configured Express app from app.js
//   3. Imports the database connection function from config/db.js
//   4. Reads the PORT from environment (defaults to 5000)
//   5. Connects to MongoDB (waits for success before proceeding)
//   6. Starts the Express HTTP server on the specified port
//   7. If DB connection fails → exits the process (no point running)
//
// WHY THIS FILE EXISTS:
//   Separating server startup from app configuration (app.js)
//   is a best practice. It lets us:
//   - Test the app without starting a real server
//   - Ensure DB is connected before accepting HTTP requests
//   - Cleanly handle startup failures
//
// HOW TO RUN:
//   Development: npm run dev   (uses nodemon for auto-restart)
//   Production:  npm start     (uses node directly)
//
// ENVIRONMENT VARIABLES REQUIRED:
//   PORT       — Port number to listen on (default: 5000)
//   MONGO_URL  — MongoDB connection string
//   NODE_ENV   — "development" or "production"
// ============================================================

// Load environment variables
require("dotenv").config();

// Import Express app
const app = require("./app");

// Import DB connection
const connectDB = require("./config/db");

// Import Redis connection (optional caching)
const { connectRedis } = require("./config/redis");

// Port
const PORT = process.env.PORT || 5000;

// === START SERVER ===
// Wrap in async IIFE to properly await database connection
(async () => {
  try {
    // Connect to MongoDB and wait for successful connection
    await connectDB();

    // Connect to Redis (optional — app works without it)
    await connectRedis();

    // Start server ONLY after DB is connected
    app.listen(PORT, () => {
      console.log(`SerenAI Backend running on port ${PORT}`);
      console.log(`📍 Database: Connected`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
})();