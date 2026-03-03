// ============================================================
// ASSESSMENT PAGE - Initial mental health assessment test
// ============================================================
// This is the CORE feature of SerenAI. New users MUST take
// this 7-question assessment before using the chat feature.
//
// The assessment evaluates:
//   - Stress levels (q1-q3)
//   - Anxiety levels (q4-q5)
//   - Sleep quality (q6)
//   - Self-confidence (q7)
//
// Results determine the AI's therapy style:
//   - "supportive" (default)
//   - "calm_grounding" (high stress)
//   - "reflective" (high anxiety)
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assessmentAPI } from "../services/api";

// === ASSESSMENT QUESTIONS ===
// Each question maps to a scoring category on the backend.
// Users answer on a 1-5 scale for each one.
const questions = [
  {
    id: "q1",
    text: "How would you rate your work/school-related stress?",
    category: "Stress", // Maps to stressScore (part of q1+q2+q3)
    options: [
      { value: 1, label: "No stress at all" },
      { value: 2, label: "Mild stress" },
      { value: 3, label: "Moderate stress" },
      { value: 4, label: "High stress" },
      { value: 5, label: "Extreme stress" },
    ],
  },
  {
    id: "q2",
    text: "How much pressure do you feel from life responsibilities?",
    category: "Stress",
    options: [
      { value: 1, label: "Very little pressure" },
      { value: 2, label: "Some pressure" },
      { value: 3, label: "Moderate pressure" },
      { value: 4, label: "Significant pressure" },
      { value: 5, label: "Overwhelming pressure" },
    ],
  },
  {
    id: "q3",
    text: "How would you describe your general stress level recently?",
    category: "Stress",
    options: [
      { value: 1, label: "Very relaxed" },
      { value: 2, label: "Mostly calm" },
      { value: 3, label: "Somewhat stressed" },
      { value: 4, label: "Quite stressed" },
      { value: 5, label: "Severely stressed" },
    ],
  },
  {
    id: "q4",
    text: "How often do you experience anxiety or nervousness?",
    category: "Anxiety", // Maps to anxietyScore (part of q4+q5)
    options: [
      { value: 1, label: "Rarely or never" },
      { value: 2, label: "Occasionally" },
      { value: 3, label: "Sometimes" },
      { value: 4, label: "Frequently" },
      { value: 5, label: "Almost constantly" },
    ],
  },
  {
    id: "q5",
    text: "How often do you experience panic or excessive worry?",
    category: "Anxiety",
    options: [
      { value: 1, label: "Never" },
      { value: 2, label: "Rarely" },
      { value: 3, label: "Sometimes" },
      { value: 4, label: "Often" },
      { value: 5, label: "Very frequently" },
    ],
  },
  {
    id: "q6",
    text: "How would you rate your sleep quality?",
    category: "Sleep", // Maps to sleepScore (q6 alone)
    options: [
      { value: 1, label: "Very poor — I barely sleep" },
      { value: 2, label: "Poor — I struggle most nights" },
      { value: 3, label: "Fair — it varies" },
      { value: 4, label: "Good — I sleep well usually" },
      { value: 5, label: "Excellent — I sleep great" },
    ],
  },
  {
    id: "q7",
    text: "How confident do you generally feel about yourself?",
    category: "Self-Esteem", // Maps to selfEsteemScore (q7 alone)
    options: [
      { value: 1, label: "Very low confidence" },
      { value: 2, label: "Low confidence" },
      { value: 3, label: "Moderate confidence" },
      { value: 4, label: "Good confidence" },
      { value: 5, label: "Very confident" },
    ],
  },
];

export default function AssessmentPage() {
  const navigate = useNavigate();

  // === STATE ===
  const [currentQuestion, setCurrentQuestion] = useState(0); // Index of current question (0-6)
  const [answers, setAnswers] = useState({});                  // { q1: 3, q2: 4, ... }
  const [selectedValue, setSelectedValue] = useState(null);    // Currently selected option for active question
  const [loading, setLoading] = useState(false);               // Submission loading state
  const [error, setError] = useState("");                      // Error message
  const [result, setResult] = useState(null);                  // Assessment result from backend

  // Current question object from the array
  const question = questions[currentQuestion];

  // Calculate progress percentage for the progress bar
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // === HANDLE OPTION SELECTION ===
  // Called when user clicks one of the 5 options
  const handleSelect = (value) => {
    setSelectedValue(value); // Highlight the selected option
  };

  // === HANDLE NEXT QUESTION ===
  // Save current answer and move to next question (or submit if last)
  const handleNext = async () => {
    if (selectedValue === null) return; // Don't proceed without selection

    // Save the answer: { q1: selectedValue, ... }
    const newAnswers = { ...answers, [question.id]: selectedValue };
    setAnswers(newAnswers);
    setSelectedValue(null); // Reset selection for next question

    // If this was the last question, submit to backend
    if (currentQuestion === questions.length - 1) {
      await submitAssessment(newAnswers);
    } else {
      // Move to next question
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  // === HANDLE PREVIOUS QUESTION ===
  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      // Restore previously selected answer for this question
      setSelectedValue(answers[questions[currentQuestion - 1].id] || null);
    }
  };

  // === SUBMIT ASSESSMENT TO BACKEND ===
  const submitAssessment = async (finalAnswers) => {
    setLoading(true);
    setError("");

    try {
      // POST /api/assessment/submit with all 7 answers
      // Backend runs calculateAssessment() to compute scores
      const response = await assessmentAPI.submit(finalAnswers);

      if (response.success) {
        // Store the result to show the results screen
        setResult(response.data);
      } else {
        setError(response.error || "Failed to submit assessment");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  // === HELPER: Get label for therapy style ===
  const getTherapyStyleLabel = (style) => {
    switch (style) {
      case "calm_grounding":
        return "Calm & Grounding"; // For high stress — breathing, grounding techniques
      case "reflective":
        return "Reflective & Introspective"; // For high anxiety — self-exploration
      case "supportive":
      default:
        return "Supportive & Encouraging"; // Default balanced approach
    }
  };

  // === HELPER: Get color for risk level badge ===
  const getRiskColor = (level) => {
    switch (level) {
      case "moderate":
        return "bg-yellow-100 text-yellow-800"; // Warning color
      case "high":
        return "bg-red-100 text-red-800";       // Danger color
      default:
        return "bg-green-100 text-green-800";   // Safe/good color
    }
  };

  // ============================================================
  // RENDER: RESULTS SCREEN (shown after assessment is submitted)
  // ============================================================
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Results header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl">✓</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Assessment Complete!</h1>
              <p className="text-gray-500 mt-2">Here's what we learned about your mental wellness</p>
            </div>

            {/* === SCORE CARDS === */}
            {/* Display each calculated score as a visual card */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              
              {/* Stress Score Card */}
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-600 font-medium">Stress Level</p>
                {/* stressScore = q1+q2+q3, max 15 */}
                <p className="text-3xl font-bold text-orange-700 mt-1">{result.stressScore}</p>
                <p className="text-xs text-orange-500 mt-1">out of 15</p>
              </div>

              {/* Anxiety Score Card */}
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium">Anxiety Level</p>
                {/* anxietyScore = q4+q5, max 10 */}
                <p className="text-3xl font-bold text-blue-700 mt-1">{result.anxietyScore}</p>
                <p className="text-xs text-blue-500 mt-1">out of 10</p>
              </div>

              {/* Sleep Score Card */}
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-sm text-indigo-600 font-medium">Sleep Quality</p>
                {/* sleepScore = q6, range 1-5 */}
                <p className="text-3xl font-bold text-indigo-700 mt-1">{result.sleepScore}</p>
                <p className="text-xs text-indigo-500 mt-1">out of 5</p>
              </div>

              {/* Self-Esteem Score Card */}
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-sm text-purple-600 font-medium">Self-Confidence</p>
                {/* selfEsteemScore = q7, range 1-5 */}
                <p className="text-3xl font-bold text-purple-700 mt-1">{result.selfEsteemScore}</p>
                <p className="text-xs text-purple-500 mt-1">out of 5</p>
              </div>
            </div>

            {/* === THERAPY STYLE & RISK LEVEL === */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Your Therapy Style</span>
                {/* This determines how the AI will respond to this user */}
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  {getTherapyStyleLabel(result.therapyStyle)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Risk Level</span>
                {/* Color-coded risk badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(result.riskLevel)}`}>
                  {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}
                </span>
              </div>
            </div>

            {/* === CONTINUE BUTTON === */}
            {/* If risk is elevated → go to breathing exercise first */}
            {/* If risk is low → go straight to dashboard */}
            <button
              onClick={() => navigate(
                result.riskLevel !== "low" ? "/breathing" : "/dashboard"
              )}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              {result.riskLevel !== "low"
                ? "🧘 Start Calming Exercise →"
                : "Continue to Dashboard →"}
            </button>
          </div>

          {/* === CRISIS RESOURCES (only shown for elevated risk) === */}
          {result.riskLevel !== "low" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <h3 className="font-bold text-yellow-800 mb-2">⚠️ Support Resources</h3>
              <p className="text-yellow-700 text-sm mb-3">
                Based on your responses, here are some resources that may help:
              </p>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li>📞 Crisis Text Line: Text HOME to 741741</li>
                <li>📞 National Suicide Prevention Lifeline: 988</li>
                <li>📞 SAMHSA Helpline: 1-800-662-4357</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: QUESTION SCREEN (main assessment flow)
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        
        {/* === HEADER === */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mental Health Assessment</h1>
          <p className="text-gray-500 text-sm mt-1">
            Answer honestly — there are no right or wrong answers
          </p>
        </div>

        {/* === PROGRESS BAR === */}
        {/* Shows how far through the assessment the user is */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          {/* Gray track with purple fill */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }} // Dynamic width based on progress
            ></div>
          </div>
        </div>

        {/* === CATEGORY TAG === */}
        {/* Shows which mental health area this question evaluates */}
        <div className="mb-3">
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
            {question.category}
          </span>
        </div>

        {/* === QUESTION TEXT === */}
        <h2 className="text-lg font-semibold text-gray-800 mb-6">{question.text}</h2>

        {/* === ERROR MESSAGE === */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* === OPTIONS LIST === */}
        {/* Each option is a clickable button. Selected option gets purple highlight. */}
        <div className="space-y-3 mb-8">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)} // Select this option
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                selectedValue === option.value
                  ? "border-purple-500 bg-purple-50 text-purple-700" // Selected state
                  : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50" // Unselected state
              }`}
            >
              {/* Option number circle + label text */}
              <span className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedValue === option.value
                      ? "bg-purple-500 text-white"  // Selected circle
                      : "bg-gray-100 text-gray-500" // Unselected circle
                  }`}
                >
                  {option.value}
                </span>
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* === NAVIGATION BUTTONS === */}
        <div className="flex gap-3">
          {/* Back button — only shows after first question */}
          {currentQuestion > 0 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"
            >
              ← Back
            </button>
          )}

          {/* Next/Submit button */}
          <button
            onClick={handleNext}
            disabled={selectedValue === null || loading} // Disabled if no option selected
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Analyzing..." // Show while submitting
              : currentQuestion === questions.length - 1
              ? "Submit Assessment" // Last question
              : "Next →"           // Not last question
            }
          </button>
        </div>
      </div>
    </div>
  );
}
