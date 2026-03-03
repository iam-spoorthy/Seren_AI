// ============================================================
// DASHBOARD PAGE - Main hub after login
// ============================================================
// The dashboard is the central navigation point of SerenAI.
// After login (and assessment), users land here and can:
//   1. See a welcome message and quick mental health summary
//   2. Navigate to Chat, Mood, Journal, Assessment features
//   3. View their latest assessment scores
//   4. See therapy recommendations
//   5. Access crisis resources if risk level is elevated
//
// KEY BACKEND ENDPOINTS USED:
//   GET /api/auth/profile               → User info
//   GET /api/assessment/latest           → Latest assessment scores
//   GET /api/assessment/recommendations  → Therapy suggestions
//   GET /api/mood/history?days=7         → Recent mood data
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assessmentAPI, moodAPI } from "../services/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Get user info and logout function

  // === STATE ===
  const [assessment, setAssessment] = useState(null);       // Latest assessment data
  const [recommendations, setRecommendations] = useState(null); // Therapy recommendations
  const [moodStats, setMoodStats] = useState(null);         // Recent mood statistics
  const [loading, setLoading] = useState(true);             // Overall loading state

  // === LOAD DASHBOARD DATA ON MOUNT ===
  // Fetch assessment, recommendations, and mood data in parallel
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // === PARALLEL API CALLS ===
      // Use Promise.allSettled so one failure doesn't block others
      // allSettled returns results even if some promises reject
      const [assessmentResult, recsResult, moodResult] = await Promise.allSettled([
        assessmentAPI.getLatest(),           // GET /api/assessment/latest
        assessmentAPI.getRecommendations(),  // GET /api/assessment/recommendations
        moodAPI.getHistory(7),               // GET /api/mood/history?days=7
      ]);

      // Extract assessment data (if the call succeeded)
      if (assessmentResult.status === "fulfilled" && assessmentResult.value.success) {
        setAssessment(assessmentResult.value.data);
      }

      // Extract recommendations (if the call succeeded)
      if (recsResult.status === "fulfilled" && recsResult.value.success) {
        setRecommendations(recsResult.value.data);
      }

      // Extract mood stats (if the call succeeded)
      if (moodResult.status === "fulfilled" && moodResult.value.success) {
        setMoodStats(moodResult.value.data.stats);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    }

    setLoading(false);
  };

  // === HANDLE LOGOUT ===
  const handleLogout = () => {
    logout();              // Clear auth state and localStorage
    navigate("/login");    // Redirect to login page
  };

  // === GET GREETING BASED ON TIME OF DAY ===
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";      // 12am - 11:59am
    if (hour < 17) return "Good Afternoon";    // 12pm - 4:59pm
    return "Good Evening";                      // 5pm - 11:59pm
  };

  // === THERAPY STYLE LABEL ===
  const getTherapyLabel = (style) => {
    switch (style) {
      case "calm_grounding": return "Calm & Grounding";
      case "reflective": return "Reflective";
      case "supportive":
      default: return "Supportive";
    }
  };

  // ============================================================
  // RENDER: LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* === TOP HEADER === */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Top row: logo + logout */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
              </div>
              <span className="font-bold text-lg">SerenAI</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Greeting */}
          <h1 className="text-2xl font-bold">{getGreeting()} 👋</h1>
          <p className="text-purple-200 text-sm mt-1">
            {user?.email || "Anonymous User"} — How are you feeling today?
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4 pb-8">
        {/* ============================================ */}
        {/* QUICK ACTIONS - Main navigation cards       */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 gap-3">
          {/* Chat with AI button */}
          <button
            onClick={() => navigate("/chat")}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md hover:border-purple-200 transition-all"
          >
            <span className="text-2xl">💬</span>
            <h3 className="font-bold text-gray-800 mt-2">AI Therapist</h3>
            <p className="text-xs text-gray-400 mt-1">Talk to your personal AI</p>
          </button>

          {/* Mood tracker button */}
          <button
            onClick={() => navigate("/mood")}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md hover:border-purple-200 transition-all"
          >
            <span className="text-2xl">📊</span>
            <h3 className="font-bold text-gray-800 mt-2">Mood Tracker</h3>
            <p className="text-xs text-gray-400 mt-1">Log and track your mood</p>
          </button>

          {/* Journal button */}
          <button
            onClick={() => navigate("/journal")}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md hover:border-purple-200 transition-all"
          >
            <span className="text-2xl">📝</span>
            <h3 className="font-bold text-gray-800 mt-2">Journal</h3>
            <p className="text-xs text-gray-400 mt-1">AI-assisted reflection</p>
          </button>

          {/* Retake assessment button */}
          <button
            onClick={() => navigate("/assessment")}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md hover:border-purple-200 transition-all"
          >
            <span className="text-2xl">📋</span>
            <h3 className="font-bold text-gray-800 mt-2">Assessment</h3>
            <p className="text-xs text-gray-400 mt-1">Retake your evaluation</p>
          </button>
        </div>

        {/* ============================================ */}
        {/* MOOD QUICK STATS (if data available)        */}
        {/* ============================================ */}
        {moodStats && moodStats.count > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-3">This Week's Mood</h2>
            <div className="grid grid-cols-3 gap-3">
              {/* Average mood */}
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xs text-purple-600 font-medium">Average</p>
                <p className="text-xl font-bold text-purple-700">{moodStats.average}</p>
              </div>
              {/* Best mood */}
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-green-600 font-medium">Best</p>
                <p className="text-xl font-bold text-green-700">{moodStats.highest}</p>
              </div>
              {/* Mood trend */}
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-600 font-medium">Trend</p>
                <p className={`text-xl font-bold ${moodStats.trend >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {moodStats.trend >= 0 ? "↑" : "↓"} {Math.abs(moodStats.trend)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ASSESSMENT SUMMARY (if data available)      */}
        {/* ============================================ */}
        {assessment ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Your Assessment</h2>
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {getTherapyLabel(assessment.therapyStyle)}
              </span>
            </div>

            {/* Score bars */}
            <div className="space-y-3">
              {/* Stress score bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Stress</span>
                  <span className="text-gray-500">{assessment.stressScore}/15</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full transition-all"
                    style={{ width: `${(assessment.stressScore / 15) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Anxiety score bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Anxiety</span>
                  <span className="text-gray-500">{assessment.anxietyScore}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${(assessment.anxietyScore / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Sleep score bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Sleep Quality</span>
                  <span className="text-gray-500">{assessment.sleepScore}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-400 h-2 rounded-full transition-all"
                    style={{ width: `${(assessment.sleepScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Self-esteem score bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Confidence</span>
                  <span className="text-gray-500">{assessment.selfEsteemScore}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-400 h-2 rounded-full transition-all"
                    style={{ width: `${(assessment.selfEsteemScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Risk level badge (only if elevated) */}
            {assessment.riskLevel !== "low" && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ Elevated risk detected. Crisis resources are available below.
                </p>
              </div>
            )}
          </div>
        ) : (
          // No assessment yet — prompt user to take one
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <span className="text-3xl">📋</span>
            <h3 className="font-bold text-gray-700 mt-2">Take Your Assessment</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Complete a quick 7-question assessment to personalize your AI therapy experience.
            </p>
            <button
              onClick={() => navigate("/assessment")}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Start Assessment
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* RECOMMENDATIONS (if available)              */}
        {/* ============================================ */}
        {recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-3">💡 Recommendations</h2>
            <div className="space-y-3">
              {recommendations.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-4 ${
                    rec.urgent
                      ? "bg-red-50 border border-red-200"   // Urgent (crisis)
                      : "bg-gray-50 border border-gray-100" // Normal
                  }`}
                >
                  {/* Category label */}
                  <div className="flex items-center gap-2 mb-1">
                    {rec.urgent && <span className="text-red-500">⚠️</span>}
                    <h3 className={`font-medium text-sm ${rec.urgent ? "text-red-700" : "text-gray-700"}`}>
                      {rec.category}
                    </h3>
                  </div>
                  {/* Advice text */}
                  <p className={`text-sm ${rec.urgent ? "text-red-600" : "text-gray-500"}`}>
                    {rec.advice}
                  </p>
                  {/* Resources list */}
                  {rec.resources && rec.resources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rec.resources.map((resource, rIdx) => (
                        <span
                          key={rIdx}
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            rec.urgent
                              ? "bg-red-100 text-red-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ETHICAL DISCLAIMER (always visible)          */}
        {/* ============================================ */}
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">
            ⚕️ SerenAI is not a substitute for professional mental health care.
            If you're in crisis, please call 988 (Suicide & Crisis Lifeline) or text HOME to 741741.
          </p>
        </div>
      </div>
    </div>
  );
}
