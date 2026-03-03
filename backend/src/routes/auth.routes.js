// ============================================================
// AUTH.ROUTES.JS — URL Routing for Authentication Endpoints
// ============================================================
//
// FILE PURPOSE:
//   This file defines the URL routes for user authentication.
//   It maps signup, login, profile, and token verification
//   endpoints to their controller handlers.
//
// WHAT THIS FILE DOES:
//   Defines 4 routes:
//
//   POST /api/auth/signup (PUBLIC — no auth required)
//     → authController.signup
//     → Create a new account (email+password or anonymous)
//     → Body: { email, password } or { isAnonymous: true }
//
//   POST /api/auth/login (PUBLIC — no auth required)
//     → authController.login
//     → Login and receive JWT token
//     → Body: { email, password }
//
//   GET /api/auth/profile (PROTECTED — auth required)
//     → authMiddleware → authController.getProfile
//     → Get current user's profile data
//
//   POST /api/auth/verify-token (PUBLIC — no auth required)
//     → authController.verifyToken
//     → Check if a JWT token is still valid
//     → Body: { token: "jwt_string" }
//
// NOTE: signup and login are PUBLIC (no auth middleware)
//       because users need these to GET a token in the first place.
//       profile is PROTECTED because it returns user-specific data.
//       verify-token is PUBLIC but takes the token in the body.
//
// USED BY: app.js (mounted at /api/auth)
// ============================================================

// Import Express router
const express = require("express");

// Import auth controller with route handlers
const authController = require("../controllers/auth.controller");

// Import auth middleware for protected routes
const authMiddleware = require("../middleware/auth.middleware");

// Create router instance
const router = express.Router();

// === AUTH ROUTES ===
// These routes handle user authentication

/**
 * POST /api/auth/signup
 * Register a new user account
 * Body: { email: string, password: string } or { isAnonymous: true }
 * Returns: { user: Object, token: string }
 */
router.post("/signup", authController.signup);

/**
 * POST /api/auth/login
 * Login user and receive JWT token
 * Body: { email: string, password: string }
 * Returns: { user: Object, token: string }
 */
router.post("/login", authController.login);

/**
 * GET /api/auth/profile
 * Get current user's profile information
 * Requires: JWT token in Authorization header
 * Returns: { user: Object }
 */
router.get("/profile", authMiddleware, authController.getProfile);

/**
 * POST /api/auth/verify-token
 * Verify if a given JWT token is valid
 * Body: { token: string }
 * Returns: { data: Object } if valid, error if invalid
 */
router.post("/verify-token", authController.verifyToken);

// Export router for use in app.js
module.exports = router;
