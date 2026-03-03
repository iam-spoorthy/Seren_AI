// ============================================================
// APP.JS — Express Application Setup & Configuration
// ============================================================
//
// FILE PURPOSE:
//   This is the MAIN Express application file. It configures
//   the entire backend server: middleware, routes, and error
//   handling. Think of it as the "brain" that wires everything
//   together. server.js imports this file and starts listening.
//
// WHAT THIS FILE DOES (step by step):
//   1. Creates an Express app instance
//   2. Sets up middleware (JSON parsing, CORS for frontend access)
//   3. Defines a health check endpoint ("/") for Docker/monitoring
//   4. Mounts ALL API route files under /api/* paths
//   5. Adds global error handling (catches unhandled errors)
//   6. Adds a 404 handler for unknown routes
//   7. Exports the configured app for server.js to use
//
// WHY THIS FILE EXISTS:
//   Separating app configuration from server startup (server.js)
//   follows best practices. It allows testing the app without
//   starting an actual HTTP server, and keeps concerns separated.
//
// ROUTE MAP (all mounted here):
//   /api/auth        → auth.routes.js       (login, signup, profile)
//   /api/assessment  → assessment.routes.js  (mental health test)
//   /api/chat        → chat.routes.js        (AI therapist convo)
//   /api/mood        → mood.routes.js        (mood tracking)
//   /api/journal     → journal.routes.js     (AI journaling)
//
// MIDDLEWARE PIPELINE (order matters!):
//   Request → JSON parser → URL parser → CORS → Route → Error handler
//
// DEPENDENCIES:
//   express  — Web framework for Node.js (handles HTTP)
//   cors     — Allows frontend (different port/domain) to call backend
//   dotenv   — Loads .env file variables into process.env
// ============================================================

// Import required dependencies
const express = require("express");
// Import CORS middleware to enable cross-origin requests from frontend
const cors = require("cors");
// Import environment variables from .env file
require("dotenv").config();

// Initialize Express application
const app = express();

// === MIDDLEWARE SETUP ===
// Parse incoming JSON request bodies
app.use(express.json());

// Parse incoming URL-encoded data (form submissions)
app.use(express.urlencoded({ extended: true }));

// Enable CORS to allow requests from frontend applications
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  // Allow requests from frontend URL specified in environment variables
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  // Allow credentials (cookies, authorization headers) in CORS requests
  credentials: true
}));

// === HEALTH CHECK ===
// Simple endpoint for Docker health checks
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is running" });
});

// Docker HEALTHCHECK endpoint (must match Dockerfile)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// === ROUTES SETUP ===
// Mount authentication routes at /api/auth
// Handles: login, signup, logout, token refresh
app.use("/api/auth", require("./routes/auth.routes"));

// Mount assessment routes at /api/assessment
// Handles: initial mental health assessment test creation and submission
app.use("/api/assessment", require("./routes/assessment.routes"));

// Mount chat routes at /api/chat
// Handles: AI-powered conversation with therapist-like responses
app.use("/api/chat", require("./routes/chat.routes"));

// Mount mood tracking routes at /api/mood
// Handles: mood tracking and historical mood data
app.use("/api/mood", require("./routes/mood.routes"));

// Mount journal routes at /api/journal
// Handles: AI-assisted journaling and journaling history
app.use("/api/journal", require("./routes/journal.routes"));

// === ERROR HANDLING ===
// Catch-all error handler for unhandled errors
app.use((err, req, res, next) => {
  // Log error to console for debugging
  console.error("Error:", err.message);

  // Return error response to client
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    // Include stack trace only in development environment
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// === 404 HANDLER ===
// Handle requests to non-existent routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

// Export app for use in server.js
module.exports = app;
