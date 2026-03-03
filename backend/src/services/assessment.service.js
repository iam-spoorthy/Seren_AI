// ============================================================
// ASSESSMENT.SERVICE.JS — Assessment Business Logic
// ============================================================
//
// FILE PURPOSE:
//   This is the CORE business logic for the mental health assessment.
//   It takes raw user answers (q1-q7), calculates mental health
//   scores, determines the AI therapy style, and assesses crisis
//   risk level. This is the "brain" behind the assessment feature.
//
// WHAT THIS FILE DOES:
//   1. calculateAssessment(answers) — Pure function that computes:
//      - stressScore (q1+q2+q3, max 15)
//      - anxietyScore (q4+q5, max 10)
//      - sleepScore (q6, range 1-5)
//      - selfEsteemScore (q7, range 1-5)
//      - therapyStyle: how the AI should respond
//      - riskLevel: whether user needs crisis resources
//
//   2. assessmentService object with 4 methods:
//      a) submitAssessment(userId, answers)
//         — Calculates scores and saves to database
//      b) getLatestAssessment(userId)
//         — Fetches user's most recent assessment
//      c) getAssessmentHistory(userId, limit)
//         — Fetches all past assessments for trend tracking
//      d) getTherapyRecommendations(userId)
//         — Generates personalized recommendations based on scores
//
// SCORING LOGIC:
//   Stress (q1+q2+q3):  max 15  |  >= 10 = high stress
//   Anxiety (q4+q5):    max 10  |  >= 7  = high anxiety
//   Sleep (q6):         1-5     |  <= 2  = poor sleep
//   Self-Esteem (q7):   1-5     |  <= 2  = low confidence
//
// THERAPY STYLES (determines AI personality):
//   "supportive"      — Default balanced approach
//   "calm_grounding"  — For high stress: breathing, grounding techniques
//   "reflective"      — For high anxiety: self-exploration, pattern recognition
//
// RISK LEVELS:
//   "low"      — User is generally well
//   "moderate" — Significant symptoms, show crisis resources
//   "high"     — Severe symptoms, immediate crisis resources needed
//
// USED BY: assessment.controller.js
// ============================================================

// Import Assessment model to interact with database
const Assessment = require("../models/Assessment");

// === ASSESSMENT SCORING LOGIC ===
// This function takes user answers from the mental health assessment test
// and calculates mental health metrics (scores) and personalization settings

/**
 * Calculate assessment scores from user answers
 * @param {Object} answers - Object containing user's answer values from assessment questions
 * @returns {Object} Object with calculated scores, therapy style, and risk level
 *
 * SCORING BREAKDOWN:
 * - Stress Score: Sum of questions about work/life pressure (max ~25)
 * - Anxiety Score: Sum of questions about worry and panic (max ~15)
 * - Sleep Score: Single question about sleep quality (1-5 scale)
 * - Self-Esteem Score: Single question about confidence (1-5 scale)
 *
 * THERAPY STYLE: Determines how the AI should respond
 * - "supportive": General supportive tone for baseline stress
 * - "calm_grounding": Techniques to calm and ground user in present moment
 * - "reflective": Encouraging self-reflection and deeper introspection
 *
 * RISK LEVEL: Flags users who may need crisis resources
 * - "low": User is generally well mentally
 * - "moderate": User shows signs of significant stress/anxiety, provide crisis resources
 * - "high": User may be in crisis, immediate resources needed
 */

const calculateAssessment = (answers) => {
  // === CALCULATE INDIVIDUAL SCORES ===
  
  // STRESS SCORE: Questions about general stress and life pressure
  // Questions typically: workload stress, financial stress, life pressure
  // Higher values indicate more stress
  const stressScore = answers.q1 + answers.q2 + answers.q3;

  // ANXIETY SCORE: Questions about anxiety and worry
  // Questions typically: general anxiety, panic feelings, social anxiety
  // Higher values indicate more anxiety symptoms
  const anxietyScore = answers.q4 + answers.q5;

  // SLEEP SCORE: Question about sleep quality
  // Single question typically: "How is your sleep quality?" (1-5 scale)
  // Related to physical vs mental health - poor sleep worsens mental health
  const sleepScore = answers.q6;

  // SELF-ESTEEM SCORE: Question about self-worth and confidence
  // Single question typically: "How confident are you?" (1-5 scale)
  // Used to tailor supportive language and encouragement level
  const selfEsteemScore = answers.q7;

  // === DETERMINE THERAPY STYLE ===
  // Therapy style adapts how the AI should respond to this specific user
  let therapyStyle = "supportive"; // Default - general supportive tone

  // If stress is high (>= 10 out of 15), use grounding techniques
  // These help users feel calmer and more centered in the present moment
  // Techniques include: breathing exercises, 5 senses grounding, etc.
  if (stressScore >= 10) {
    therapyStyle = "calm_grounding";
  }

  // If anxiety is high (>= 7 out of 10), use reflective listening
  // This encourages user to explore and understand their anxiety
  // More introspective, less prescriptive approach
  if (anxietyScore >= 7) {
    therapyStyle = "reflective";
  }

  // === DETERMINE RISK LEVEL ===
  // Risk level indicates if user may need crisis support or additional resources
  let riskLevel = "low"; // Default - user is okay

  // CORRECTED THRESHOLDS (based on actual max scores):
  // - Stress: max 15 (3 questions × 5)
  // - Anxiety: max 10 (2 questions × 5)
  // - Sleep: max 5 (1-5 scale, lower = worse)
  // - Self-Esteem: max 5 (1-5 scale, lower = worse)

  // MODERATE RISK: Significant mental health concerns
  // Thresholds: Stress >= 10/15, Anxiety >= 7/10, Sleep <= 2/5, Self-Esteem <= 2/5
  if (
    stressScore >= 10 ||   // 67% or higher stress
    anxietyScore >= 7 ||   // 70% or higher anxiety
    sleepScore <= 2 ||     // Very poor sleep
    selfEsteemScore <= 2   // Very low self-worth
  ) {
    riskLevel = "moderate";
  }

  // HIGH RISK: Severe symptoms requiring immediate support
  // Thresholds: Stress >= 13/15, Anxiety >= 9/10, Sleep = 1/5
  // Multiple severe indicators = high risk
  if (
    stressScore >= 13 ||   // 87% or higher stress (severe)
    anxietyScore >= 9 ||   // 90% or higher anxiety (severe)
    (sleepScore === 1 && (stressScore >= 10 || anxietyScore >= 7)) || // Extremely poor sleep + elevated stress/anxiety
    (selfEsteemScore === 1 && (stressScore >= 10 || anxietyScore >= 7)) // Extremely low self-worth + elevated stress/anxiety
  ) {
    riskLevel = "high";
  }

  // === RETURN ASSESSMENT RESULT ===
  // Return all calculated metrics for storage and AI personalization
  return {
    // Raw scores for detailed analysis
    stressScore,
    anxietyScore,
    sleepScore,
    selfEsteemScore,
    
    // Personalization settings
    therapyStyle, // How AI should respond to user
    riskLevel,    // Whether to show crisis resources
    
    // Timestamp of calculation
    calculatedAt: new Date()
  };
};

// === CREATE ASSESSMENT SERVICE ===
// This service handles all assessment-related business logic

const assessmentService = {
  
  /**
   * Submit user's assessment answers and save results
   * @param {string} userId - ID of user taking the assessment
   * @param {Object} answers - User's answers to assessment questions
   * @returns {Object} Saved assessment document with calculated scores
   */
  submitAssessment: async (userId, answers) => {
    try {
      // Calculate scores using the scoring logic above
      const scoreData = calculateAssessment(answers);

      // Create new assessment document in database
      const assessment = new Assessment({
        userId,                  // Link assessment to specific user
        stressScore: scoreData.stressScore,
        anxietyScore: scoreData.anxietyScore,
        sleepScore: scoreData.sleepScore,
        selfEsteemScore: scoreData.selfEsteemScore,
        therapyStyle: scoreData.therapyStyle,
        riskLevel: scoreData.riskLevel
        // timestamps: true will auto-add createdAt/updatedAt via schema
      });

      // Save to database
      await assessment.save();

      // Return saved assessment
      return {
        success: true,
        data: assessment,
        message: "Assessment submitted successfully"
      };
    } catch (error) {
      // Return error details for controller to handle
      return {
        success: false,
        error: error.message,
        message: "Failed to submit assessment"
      };
    }
  },

  /**
   * Get user's most recent assessment
   * @param {string} userId - ID of the user
   * @returns {Object} Most recent assessment or null if none exist
   */
  getLatestAssessment: async (userId) => {
    try {
      // Query database for this user's assessments
      // Sort by createdAt descending to get most recent first
      // Limit to 1 result
      const assessment = await Assessment.findOne({ userId })
        .sort({ createdAt: -1 })
        .exec();

      return {
        success: true,
        data: assessment,
        message: assessment ? "Assessment found" : "No assessments found"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Failed to fetch assessment"
      };
    }
  },

  /**
   * Get user's assessment history (all assessments over time)
   * Useful for tracking mental health trends
   * @param {string} userId - ID of the user
   * @param {number} limit - Maximum number of assessments to return (default 10)
   * @returns {Array} Array of assessment documents ordered by date
   */
  getAssessmentHistory: async (userId, limit = 10) => {
    try {
      // Query for all this user's assessments, sorted by date
      const assessments = await Assessment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return {
        success: true,
        data: assessments,
        count: assessments.length,
        message: "Assessment history retrieved"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Failed to fetch assessment history"
      };
    }
  },

  /**
   * Get therapy recommendations based on assessment scores
   * Provides personalized guidance on next steps
   * @param {string} userId - ID of the user
   * @returns {Object} Therapy recommendations and resources
   */
  getTherapyRecommendations: async (userId) => {
    try {
      // Get user's latest assessment
      const result = await assessmentService.getLatestAssessment(userId);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: "No assessment found for this user"
        };
      }

      const assessment = result.data;
      const recommendations = [];

      // === BUILD PERSONALIZED RECOMMENDATIONS ===

      // If stress is high, recommend stress management techniques
      if (assessment.stressScore > 15) {
        recommendations.push({
          category: "Stress Management",
          advice: "High stress detected. Try breathing exercises: 4-7-8 breathing (inhale 4, hold 7, exhale 8)",
          resources: ["Meditation app", "Yoga videos", "Progressive muscle relaxation"]
        });
      }

      // If anxiety is high, recommend anxiety techniques
      if (assessment.anxietyScore > 10) {
        recommendations.push({
          category: "Anxiety Management",
          advice: "Consider cognitive reframing: identify anxious thoughts and challenge them",
          resources: ["Thought journal", "CBT workbook", "Anxiety support group"]
        });
      }

      // If sleep is poor, recommend sleep hygiene
      if (assessment.sleepScore <= 2) {
        recommendations.push({
          category: "Sleep Hygiene",
          advice: "Poor sleep detected. Establish consistent sleep schedule and avoid screens 1 hour before bed",
          resources: ["Sleep tracker", "Relaxation meditations", "Sleep clinic referral"]
        });
      }

      // If self-esteem is low, add confidence building
      if (assessment.selfEsteemScore <= 2) {
        recommendations.push({
          category: "Self-Esteem",
          advice: "Build confidence through self-compassion practice and journaling positive experiences",
          resources: ["Affirmation journal", "Self-compassion exercises"]
        });
      }

      // If risk level is moderate or higher, provide crisis resources
      if (assessment.riskLevel !== "low") {
        recommendations.push({
          category: "Crisis Support",
          urgent: true,
          advice: "If you're in crisis, please reach out immediately",
          resources: [
            "Crisis Text Line: Text HOME to 741741",
            "National Suicide Prevention Lifeline: 988",
            "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/"
          ]
        });
      }

      return {
        success: true,
        data: {
          assessment: assessment,
          therapyStyle: assessment.therapyStyle,
          recommendations: recommendations
        },
        message: "Recommendations generated successfully"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Failed to generate recommendations"
      };
    }
  }
};

// Export both the calculateAssessment function and the service
module.exports = {
  calculateAssessment,
  assessmentService
};
