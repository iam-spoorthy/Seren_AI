// ============================================================
// MOOD TRACKER PAGE - Log and visualize emotional trends
// ============================================================
// This page lets users:
//   1. Log their current mood on a 1-10 scale with optional note
//   2. View mood history as a visual bar chart
//   3. See statistics (average, highest, lowest, trend)
//
// KEY BACKEND ENDPOINTS USED:
//   POST /api/mood/log          → Save a new mood entry
//   GET  /api/mood/history?days → Fetch mood entries + stats
//
// Mood Scale:
//   1-2: Very sad/depressed  |  3-4: Unhappy/stressed
//   5: Neutral               |  6-7: Happy/content
//   8-9: Very happy          |  10: Euphoric
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { moodAPI } from "../services/api";

// === MOOD EMOJI MAPPING ===
// Maps mood score ranges to descriptive emojis and labels
// Used throughout the page for visual feedback
const moodEmojis = {
  1: { emoji: "😢", label: "Very Sad", color: "bg-red-100 text-red-700" },
  2: { emoji: "😞", label: "Sad", color: "bg-red-50 text-red-600" },
  3: { emoji: "😔", label: "Down", color: "bg-orange-100 text-orange-700" },
  4: { emoji: "😕", label: "Uneasy", color: "bg-orange-50 text-orange-600" },
  5: { emoji: "😐", label: "Neutral", color: "bg-yellow-100 text-yellow-700" },
  6: { emoji: "🙂", label: "Okay", color: "bg-lime-100 text-lime-700" },
  7: { emoji: "😊", label: "Good", color: "bg-green-100 text-green-700" },
  8: { emoji: "😄", label: "Happy", color: "bg-green-50 text-green-600" },
  9: { emoji: "😁", label: "Very Happy", color: "bg-emerald-100 text-emerald-700" },
  10: { emoji: "🤩", label: "Amazing", color: "bg-emerald-50 text-emerald-600" },
};

export default function MoodPage() {
  const navigate = useNavigate();

  // === STATE ===
  const [moodScore, setMoodScore] = useState(5);       // Selected mood score (default neutral)
  const [note, setNote] = useState("");                  // Optional note about the mood
  const [loading, setLoading] = useState(false);         // Log button loading
  const [historyLoading, setHistoryLoading] = useState(true); // History loading
  const [error, setError] = useState("");                // Error message
  const [success, setSuccess] = useState("");            // Success message
  const [history, setHistory] = useState(null);          // Mood history data from backend
  const [days, setDays] = useState(30);                  // How many days of history to show

  // === LOAD MOOD HISTORY ON MOUNT AND WHEN DAYS CHANGES ===
  useEffect(() => {
    loadHistory();
  }, [days]); // Re-fetch when user changes the time range

  // === FETCH MOOD HISTORY FROM BACKEND ===
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      // GET /api/mood/history?days=30
      // Returns: { entries: [...], stats: { count, average, highest, lowest, trend } }
      const result = await moodAPI.getHistory(days);
      if (result.success) {
        setHistory(result.data);
      }
    } catch (err) {
      console.error("Failed to load mood history:", err);
    }
    setHistoryLoading(false);
  };

  // === LOG A NEW MOOD ENTRY ===
  const handleLogMood = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // POST /api/mood/log — saves the mood entry
      const result = await moodAPI.logMood(moodScore, note);

      if (result.success) {
        setSuccess("Mood logged successfully! 🎉");
        setNote("");           // Clear note field
        setMoodScore(5);       // Reset to neutral
        await loadHistory();   // Refresh the history display

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to log mood");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }

    setLoading(false);
  };

  // === FORMAT DATE FOR DISPLAY ===
  // Converts ISO string to readable format like "Feb 14"
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // === GET BAR HEIGHT ===
  // Converts mood score (1-10) to a percentage height for the bar chart
  const getBarHeight = (score) => {
    return `${(score / 10) * 100}%`; // e.g., score 7 → 70%
  };

  // === GET BAR COLOR ===
  // Color gradient based on mood score (red=sad, green=happy)
  const getBarColor = (score) => {
    if (score <= 3) return "bg-red-400";      // Sad mood
    if (score <= 5) return "bg-yellow-400";   // Neutral
    if (score <= 7) return "bg-green-400";    // Happy
    return "bg-emerald-400";                  // Very happy
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* === HEADER === */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <div>
          <h1 className="font-bold text-gray-800">Mood Tracker</h1>
          <p className="text-xs text-gray-400">Track your emotional wellness</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* ============================================ */}
        {/* SECTION 1: LOG NEW MOOD                     */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            How are you feeling right now?
          </h2>

          {/* === SUCCESS MESSAGE === */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          {/* === ERROR MESSAGE === */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* === EMOJI DISPLAY === */}
          {/* Shows current mood emoji and label, updates as slider moves */}
          <div className="text-center mb-6">
            <span className="text-6xl">
              {moodEmojis[moodScore]?.emoji}
            </span>
            <p className="text-lg font-medium text-gray-700 mt-2">
              {moodEmojis[moodScore]?.label}
            </p>
            <p className="text-3xl font-bold text-purple-600">{moodScore}/10</p>
          </div>

          {/* === MOOD SLIDER === */}
          {/* Range input from 1-10. The accent color makes it purple. */}
          <div className="mb-4">
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            {/* Scale labels */}
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
              <span>Very Sad</span>
              <span>Neutral</span>
              <span>Amazing</span>
            </div>
          </div>

          {/* === OPTIONAL NOTE === */}
          {/* Users can add context about why they feel this way */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's influencing your mood? (optional)"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm resize-none mb-4"
          />

          {/* === SUBMIT BUTTON === */}
          <button
            onClick={handleLogMood}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? "Logging..." : "Log Mood"}
          </button>
        </div>

        {/* ============================================ */}
        {/* SECTION 2: MOOD STATISTICS                  */}
        {/* ============================================ */}
        {history && history.stats && history.stats.count > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Your Stats</h2>
              {/* Time range selector */}
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>

            {/* === STAT CARDS GRID === */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Average mood */}
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-xs text-purple-600 font-medium">Average</p>
                <p className="text-2xl font-bold text-purple-700">
                  {history.stats.average}
                </p>
              </div>

              {/* Number of entries */}
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-medium">Entries</p>
                <p className="text-2xl font-bold text-blue-700">
                  {history.stats.count}
                </p>
              </div>

              {/* Highest mood */}
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xs text-green-600 font-medium">Highest</p>
                <p className="text-2xl font-bold text-green-700">
                  {history.stats.highest}
                </p>
              </div>

              {/* Lowest mood */}
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-xs text-orange-600 font-medium">Lowest</p>
                <p className="text-2xl font-bold text-orange-700">
                  {history.stats.lowest}
                </p>
              </div>
            </div>

            {/* === TREND INDICATOR === */}
            {/* Positive trend = improving, Negative = declining */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Mood Trend</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  history.stats.trend > 0
                    ? "bg-green-100 text-green-700" // Improving
                    : history.stats.trend < 0
                    ? "bg-red-100 text-red-700"     // Declining
                    : "bg-gray-100 text-gray-700"   // Stable
                }`}
              >
                {history.stats.trend > 0
                  ? `↑ Improving (+${history.stats.trend})`
                  : history.stats.trend < 0
                  ? `↓ Declining (${history.stats.trend})`
                  : "→ Stable"}
              </span>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* SECTION 3: MOOD HISTORY BAR CHART           */}
        {/* ============================================ */}
        {history && history.entries && history.entries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Mood History
            </h2>

            {/* === SIMPLE BAR CHART === */}
            {/* Each bar represents one mood entry, height = mood score */}
            <div className="flex items-end gap-1 h-40 mb-4">
              {/* Show last 20 entries (most recent on the right) */}
              {history.entries
                .slice(0, 20)
                .reverse() // Reverse so oldest is on left, newest on right
                .map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                    title={`${entry.moodScore}/10 — ${formatDate(entry.createdAt)}`}
                  >
                    {/* The actual bar */}
                    <div
                      className={`w-full rounded-t-md ${getBarColor(entry.moodScore)} transition-all duration-300`}
                      style={{ height: getBarHeight(entry.moodScore) }}
                    ></div>
                  </div>
                ))}
            </div>

            {/* === RECENT ENTRIES LIST === */}
            <div className="space-y-2">
              {history.entries.slice(0, 5).map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  {/* Emoji + score */}
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {moodEmojis[entry.moodScore]?.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {moodEmojis[entry.moodScore]?.label} — {entry.moodScore}/10
                      </p>
                      {/* Show note if one was provided */}
                      {entry.note && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Date */}
                  <span className="text-xs text-gray-400">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === EMPTY STATE === */}
        {!historyLoading && (!history || !history.entries || history.entries.length === 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <span className="text-4xl">📊</span>
            <p className="text-gray-500 mt-2">
              No mood entries yet. Log your first mood above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
