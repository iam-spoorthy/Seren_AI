// ============================================================
// JOURNAL PAGE - AI-Assisted Journaling
// ============================================================
// This page lets users write journal entries and receive:
//   1. AI-generated insights (empathetic reflections)
//   2. Sentiment analysis (positive / negative / neutral)
//
// Users can also view past entries, see sentiment trends,
// and delete entries they no longer want.
//
// KEY BACKEND ENDPOINTS USED:
//   POST   /api/journal/create        → Create entry, get AI insight
//   GET    /api/journal/entries?limit  → List entries with stats
//   GET    /api/journal/entry/:id      → Get single entry
//   DELETE /api/journal/entry/:id      → Delete entry
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { journalAPI } from "../services/api";

export default function JournalPage() {
  const navigate = useNavigate();

  // === STATE ===
  const [content, setContent] = useState("");            // New journal entry text
  const [loading, setLoading] = useState(false);         // Creating entry loading
  const [entriesLoading, setEntriesLoading] = useState(true); // Entries list loading
  const [entries, setEntries] = useState([]);             // Array of journal entries
  const [stats, setStats] = useState(null);              // Sentiment statistics
  const [error, setError] = useState("");                // Error message
  const [success, setSuccess] = useState("");            // Success message
  const [selectedEntry, setSelectedEntry] = useState(null); // Entry detail view
  const [showForm, setShowForm] = useState(false);       // Toggle new entry form

  // === LOAD ENTRIES ON MOUNT ===
  useEffect(() => {
    loadEntries();
  }, []);

  // === FETCH JOURNAL ENTRIES FROM BACKEND ===
  const loadEntries = async () => {
    setEntriesLoading(true);
    try {
      // GET /api/journal/entries?limit=20
      // Returns: { entries: [...], stats: { totalEntries, sentiments, mood } }
      const result = await journalAPI.getEntries(20);

      if (result.success) {
        setEntries(result.data.entries);   // Array of journal entries
        setStats(result.data.stats);       // Sentiment breakdown
      }
    } catch (err) {
      console.error("Failed to load journal entries:", err);
    }
    setEntriesLoading(false);
  };

  // === CREATE A NEW JOURNAL ENTRY ===
  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();

    // Validate content is not empty
    if (!trimmed) {
      setError("Please write something in your journal entry.");
      return;
    }

    // Validate content is not too long (backend limit: 5000 chars)
    if (trimmed.length > 5000) {
      setError("Journal entry is too long (max 5000 characters).");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // POST /api/journal/create
      // Backend calls OpenAI for:
      //   1. AI insight (empathetic 2-3 sentence reflection)
      //   2. Sentiment analysis (positive/negative/neutral)
      const result = await journalAPI.createEntry(trimmed);

      if (result.success) {
        setSuccess("Journal entry saved with AI insight! ✨");
        setContent("");         // Clear the text area
        setShowForm(false);     // Hide the form
        setSelectedEntry(result.data); // Show the new entry detail
        await loadEntries();    // Refresh the entries list

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to create entry");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }

    setLoading(false);
  };

  // === DELETE A JOURNAL ENTRY ===
  const handleDelete = async (entryId) => {
    // Confirm destructive action
    if (!window.confirm("Are you sure you want to delete this journal entry? This cannot be undone.")) {
      return;
    }

    try {
      // DELETE /api/journal/entry/:entryId
      const result = await journalAPI.deleteEntry(entryId);

      if (result.success) {
        // If we're viewing the deleted entry, close the detail view
        if (selectedEntry && selectedEntry._id === entryId) {
          setSelectedEntry(null);
        }
        await loadEntries(); // Refresh the list
      }
    } catch (err) {
      setError("Failed to delete entry");
    }
  };

  // === SENTIMENT BADGE COLOR MAPPING ===
  // Returns Tailwind classes based on sentiment value
  const getSentimentStyle = (sentiment) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-700";
      case "negative":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700"; // "neutral" or unknown
    }
  };

  // === SENTIMENT EMOJI ===
  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case "positive": return "😊";
      case "negative": return "😔";
      default: return "😐";
    }
  };

  // === FORMAT DATE ===
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ============================================================
  // RENDER: ENTRY DETAIL VIEW
  // ============================================================
  // When a user clicks on an entry, show full content and AI insight
  if (selectedEntry) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSelectedEntry(null)} // Go back to list
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <h1 className="font-bold text-gray-800">Journal Entry</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Entry content card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Date and sentiment badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">
                {formatDate(selectedEntry.createdAt)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentStyle(selectedEntry.sentiment)}`}
              >
                {getSentimentEmoji(selectedEntry.sentiment)}{" "}
                {selectedEntry.sentiment?.charAt(0).toUpperCase() + selectedEntry.sentiment?.slice(1)}
              </span>
            </div>

            {/* Journal content text */}
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedEntry.content}
            </p>
          </div>

          {/* === AI INSIGHT CARD === */}
          {/* This is the AI-generated empathetic reflection */}
          {selectedEntry.aiInsight && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                <h3 className="font-bold text-purple-800">AI Insight</h3>
              </div>
              <p className="text-purple-700 leading-relaxed text-sm">
                {selectedEntry.aiInsight}
              </p>
            </div>
          )}

          {/* Delete button */}
          <button
            onClick={() => handleDelete(selectedEntry._id)}
            className="w-full py-3 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all text-sm"
          >
            Delete Entry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: ENTRIES LIST VIEW (main page)
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* === HEADER === */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <div>
            <h1 className="font-bold text-gray-800">Journal</h1>
            <p className="text-xs text-gray-400">AI-assisted self-reflection</p>
          </div>
        </div>

        {/* New entry button */}
        <button
          onClick={() => setShowForm(!showForm)} // Toggle form visibility
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-all"
        >
          {showForm ? "Cancel" : "+ New Entry"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* === SUCCESS/ERROR MESSAGES === */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ============================================ */}
        {/* NEW ENTRY FORM (toggled by button above)    */}
        {/* ============================================ */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Write Your Thoughts
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Express yourself freely. Our AI will provide a supportive insight.
            </p>

            <form onSubmit={handleCreate}>
              {/* Journal content textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind today? How are you feeling? What happened?"
                rows={6}
                maxLength={5000} // Matches backend limit
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm resize-none mb-2"
              />

              {/* Character counter */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-400">
                  {content.length}/5000 characters
                </span>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {loading ? "Analyzing with AI..." : "Save & Get Insight ✨"}
              </button>
            </form>
          </div>
        )}

        {/* ============================================ */}
        {/* SENTIMENT STATISTICS                        */}
        {/* ============================================ */}
        {stats && stats.totalEntries > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Sentiment Overview
            </h2>

            {/* Sentiment breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Positive count */}
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <span className="text-xl">😊</span>
                <p className="text-2xl font-bold text-green-700">
                  {stats.sentiments?.positive || 0}
                </p>
                <p className="text-xs text-green-600">Positive</p>
              </div>

              {/* Neutral count */}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <span className="text-xl">😐</span>
                <p className="text-2xl font-bold text-gray-700">
                  {stats.sentiments?.neutral || 0}
                </p>
                <p className="text-xs text-gray-600">Neutral</p>
              </div>

              {/* Negative count */}
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <span className="text-xl">😔</span>
                <p className="text-2xl font-bold text-red-700">
                  {stats.sentiments?.negative || 0}
                </p>
                <p className="text-xs text-red-600">Negative</p>
              </div>
            </div>

            {/* Overall mood trend */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Overall Mood</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stats.mood === "improving"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {stats.mood === "improving" ? "📈 Improving" : "📉 Needs attention"}
              </span>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ENTRIES LIST                                 */}
        {/* ============================================ */}
        {entriesLoading ? (
          // Loading skeleton
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Loading journal entries...</p>
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-800">Your Entries</h2>

            {entries.map((entry) => (
              <div
                key={entry._id}
                onClick={() => setSelectedEntry(entry)} // Click to view detail
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all"
              >
                {/* Entry header: date + sentiment badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {formatDate(entry.createdAt)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSentimentStyle(entry.sentiment)}`}
                  >
                    {getSentimentEmoji(entry.sentiment)} {entry.sentiment}
                  </span>
                </div>

                {/* Entry content preview — truncated to 2 lines */}
                <p className="text-sm text-gray-700 line-clamp-2">
                  {entry.content}
                </p>

                {/* AI insight preview — truncated to 1 line */}
                {entry.aiInsight && (
                  <p className="text-xs text-purple-500 mt-2 line-clamp-1">
                    ✨ {entry.aiInsight}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Empty state — no entries yet
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <span className="text-4xl">📝</span>
            <h3 className="text-lg font-bold text-gray-700 mt-3">
              Start Your Journal
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Write your first entry and let AI provide a supportive insight.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-all"
            >
              Write First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
