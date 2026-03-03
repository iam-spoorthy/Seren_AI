// ============================================================
// ASSESSMENT.CONTROLLER.JS — HTTP Handler for Assessments
// ============================================================
//
// FILE PURPOSE:
//   This controller handles ALL HTTP requests related to the
//   mental health assessment feature. It sits between the
//   routes (which define URLs) and the service (which has
//   business logic). Controllers validate input and format output.
//
// WHAT THIS FILE DOES:
//   Provides 4 endpoint handlers:
//
//   1. submitAssessment (POST /api/assessment/submit)
//      - Receives user's answers to 7 assessment questions
//      - Validates all answers are present and within range (1-5)
//      - Calls assessment service to calculate scores
//      - Returns: stress, anxiety, sleep, self-esteem scores +
//        therapy style + risk level
//
//   2. getLatestAssessment (GET /api/assessment/latest)
//      - Fetches the user's most recent assessment results
//      - Used by dashboard to show current mental health summary
//      - Returns 404 if no assessment exists yet
//
//   3. getAssessmentHistory (GET /api/assessment/history)
//      - Fetches all past assessments for tracking trends
//      - Supports ?limit=N query parameter (default 10, max 100)
//      - Used to see how mental health changes over time
//
//   4. getRecommendations (GET /api/assessment/recommendations)
//      - Generates personalized therapy recommendations
//      - Based on latest assessment scores
//      - Includes crisis resources if risk level is elevated
//
// WHY THIS FILE EXISTS:
//   Controllers separate HTTP concerns (req/res, status codes,
//   validation) from business logic (calculating scores, DB queries).
//   This makes code easier to test and maintain.
//
// ARCHITECTURE PATTERN:
//   Route → Controller (this file) → Service → Model → Database
//   Route defines the URL, Controller handles HTTP, Service has logic
//
// ALL ENDPOINTS REQUIRE: JWT authentication (via auth middleware)
// ============================================================

// Import assessment service with all business logic
const { assessmentService } = require("../services/assessment.service");

// === ASSESSMENT CONTROLLER ===
// Controllers handle HTTP requests and responses
// They use services to perform business logic
// They validate input and format output

const assessmentController = {

  /**
   * POST /api/assessment/submit
   * Endpoint for user to submit their assessment answers
   * Requires: JWT authentication, assessment answers in request body
   * Returns: Calculated scores and personalization settings
   */
  submitAssessment: async (req, res) => {
    try {
      // Extract user ID from authenticated request (set by auth middleware)
      const userId = req.user.userId;

      // Extract assessment answers from request body
      // Expects: { q1: number, q2: number, ..., q7: number }
      const { answers } = req.body;

      // === VALIDATE INPUT ===
      // Check if answers were provided
      if (!answers) {
        return res.status(400).json({
          success: false,
          error: "Assessment answers are required",
          code: "MISSING_ANSWERS"
        });
      }

      // Check if all required questions are answered (q1-q7)
      const requiredQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];
      const missingQuestions = requiredQuestions.filter(q => answers[q] === undefined);

      if (missingQuestions.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing answers for questions: ${missingQuestions.join(', ')}`,
          code: "INCOMPLETE_ANSWERS"
        });
      }

      // Check if all answers are valid numbers within range (typically 1-5)
      const validAnswers = Object.values(answers).every(
        val => typeof val === 'number' && val >= 1 && val <= 5
      );

      if (!validAnswers) {
        return res.status(400).json({
          success: false,
          error: "All answers must be numbers between 1-5",
          code: "INVALID_ANSWERS"
        });
      }

      // === SUBMIT ASSESSMENT ===
      // Call service to calculate scores and save to database
      const result = await assessmentService.submitAssessment(userId, answers);

      // If submission successful, return 201 Created
      if (result.success) {
        return res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      // If submission failed, return 500 error
      return res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in submitAssessment:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to submit assessment"
      });
    }
  },

  /**
   * GET /api/assessment/latest
   * Get user's most recent assessment
   * Requires: JWT authentication
   * Returns: Latest assessment data with all scores
   */
  getLatestAssessment: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Call service to fetch user's latest assessment
      const result = await assessmentService.getLatestAssessment(userId);

      // If assessment found, return 200 OK
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      // If no assessment found, return 404 (but this is not an error, just no data)
      return res.status(404).json({
        success: false,
        message: result.message
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in getLatestAssessment:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to fetch assessment"
      });
    }
  },

  /**
   * GET /api/assessment/history
   * Get user's assessment history (all past assessments)
   * Requires: JWT authentication
   * Query params: limit (optional, default 10)
   * Returns: Array of assessments sorted by date (newest first)
   */
  getAssessmentHistory: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Extract limit from query parameters (default 10)
      const limit = parseInt(req.query.limit) || 10;

      // Validate limit is reasonable (prevent abusive queries)
      if (limit > 100 || limit < 1) {
        return res.status(400).json({
          success: false,
          error: "Limit must be between 1 and 100",
          code: "INVALID_LIMIT"
        });
      }

      // Call service to fetch user's assessment history
      const result = await assessmentService.getAssessmentHistory(userId, limit);

      // If successful, return 200 OK with history
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          count: result.count,
          message: result.message
        });
      }

      // If failed, return 500 error
      return res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in getAssessmentHistory:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to fetch assessment history"
      });
    }
  },

  /**
   * GET /api/assessment/recommendations
   * Get personalized therapy recommendations based on latest assessment
   * Requires: JWT authentication
   * Returns: Therapy recommendations, resources, and crisis support if needed
   */
  getRecommendations: async (req, res) => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Call service to generate recommendations based on assessment
      const result = await assessmentService.getTherapyRecommendations(userId);

      // If successful, return 200 OK with recommendations
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      // If no assessment data available, return 404
      return res.status(404).json({
        success: false,
        message: result.message
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in getRecommendations:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to get recommendations"
      });
    }
  }
};

// Export controller functions for use in routes
module.exports = assessmentController;
