// ============================================================
// ASSESSMENT.ROUTES.JS — URL Routing for Assessment Endpoints
// ============================================================
//
// FILE PURPOSE:
//   This file defines the URL routes (endpoints) for the mental
//   health assessment feature. It maps HTTP methods + URLs to
//   controller functions and applies authentication middleware.
//
// WHAT THIS FILE DOES:
//   1. Creates an Express Router instance
//   2. Defines 4 routes, ALL protected by JWT auth middleware:
//
//      POST /api/assessment/submit
//        → assessmentController.submitAssessment
//        → Submit answers to the 7-question assessment
//        → Body: { answers: { q1:1-5, q2:1-5, ..., q7:1-5 } }
//
//      GET /api/assessment/latest
//        → assessmentController.getLatestAssessment
//        → Get user's most recent assessment results
//
//      GET /api/assessment/history
//        → assessmentController.getAssessmentHistory
//        → Get all past assessments for trend tracking
//        → Query: ?limit=10
//
//      GET /api/assessment/recommendations
//        → assessmentController.getRecommendations
//        → Get personalized therapy advice based on scores
//
// HOW ROUTES WORK IN EXPRESS:
//   1. app.js mounts this router at "/api/assessment"
//   2. Routes defined here are RELATIVE to that base path
//   3. So "/submit" here becomes "/api/assessment/submit" in full
//   4. authMiddleware runs FIRST on each request (checks JWT)
//   5. If auth passes, the controller function handles the request
//
// ARCHITECTURE FLOW:
//   Client → Route (this file) → Middleware → Controller → Service → DB
//
// USED BY: app.js (mounted at /api/assessment)
// ============================================================

// Import Express router
const express = require("express");

// Import assessment controller with route handlers
const assessmentController = require("../controllers/assessment.controller");

// Import auth middleware to protect routes
// Only authenticated users can access assessment endpoints
const authMiddleware = require("../middleware/auth.middleware");

// Create router instance
const router = express.Router();

// === ASSESSMENT ROUTES ===
// All routes require JWT authentication (authMiddleware)
// These routes handle mental health assessment operations

/**
 * POST /api/assessment/submit
 * Submit user's responses to initial mental health assessment
 * Requires: JWT token in Authorization header
 * Body: { answers: { q1: number, q2: number, ..., q7: number } }
 * Returns: { assessment: Object with calculated scores and recommendations }
 */
router.post(
  "/submit",
  authMiddleware,                    // Verify user is authenticated
  assessmentController.submitAssessment
);

/**
 * GET /api/assessment/latest
 * Get user's most recent assessment results
 * Requires: JWT token in Authorization header
 * Returns: { assessment: Object with latest scores }
 */
router.get(
  "/latest",
  authMiddleware,                    // Verify user is authenticated
  assessmentController.getLatestAssessment
);

/**
 * GET /api/assessment/history
 * Get user's assessment history (all past assessments)
 * Shows mental health trends over time
 * Requires: JWT token in Authorization header
 * Query params: limit (default 10, max 100)
 * Returns: { assessments: Array of assessment objects }
 */
router.get(
  "/history",
  authMiddleware,                    // Verify user is authenticated
  assessmentController.getAssessmentHistory
);

/**
 * GET /api/assessment/recommendations
 * Get personalized therapy recommendations based on latest assessment
 * Recommendations adapt based on stress/anxiety levels
 * Requires: JWT token in Authorization header
 * Returns: { recommendations: Array with therapy tips and resources }
 */
router.get(
  "/recommendations",
  authMiddleware,                    // Verify user is authenticated
  assessmentController.getRecommendations
);

// Export router for use in app.js
module.exports = router;
