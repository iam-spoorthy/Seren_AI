// ============================================================
// API SERVICE LAYER - Handles ALL backend HTTP requests
// ============================================================
// This file centralizes every API call the frontend makes.
// Every function returns the JSON body from the backend.
// The axios instance automatically attaches the JWT token
// from localStorage so protected routes work seamlessly.
// ============================================================

import axios from "axios"; // HTTP client library (cleaner than fetch)

// === CREATE AXIOS INSTANCE ===
// Base URL points to our Express backend.
// Uses VITE_API_URL from .env in production, falls back to localhost for dev.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json", // We always send JSON
  },
});

// === REQUEST INTERCEPTOR ===
// Runs BEFORE every request is sent to the backend.
// Attaches the JWT token (if the user is logged in) to the
// Authorization header so protected routes can authenticate.
API.interceptors.request.use((config) => {
  // Retrieve token from localStorage (saved during login/signup)
  const token = localStorage.getItem("serenai_token");

  // If token exists, attach it as a Bearer token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config; // Continue with the modified config
});

// === RESPONSE INTERCEPTOR ===
// Runs AFTER every response comes back from the backend.
// If the server returns 401 (Unauthorized / token expired),
// we clear stored credentials and redirect to login.
API.interceptors.response.use(
  (response) => response, // If response is OK, pass it through unchanged
  (error) => {
    // If server says "Unauthorized" — token expired or invalid
    if (error.response && error.response.status === 401) {
      // Clear stored auth data
      localStorage.removeItem("serenai_token");
      localStorage.removeItem("serenai_user");

      // Redirect to login page (unless already there)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Re-throw the error so calling code can handle it too
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API - Signup, Login, Profile, Token verification
// ============================================================

export const authAPI = {
  /**
   * Register a new user account
   * @param {string} email - User's email address
   * @param {string} password - User's password (min 6 chars)
   * @returns {Object} { success, data: { user, token }, message }
   */
  signup: async (email, password) => {
    // POST /api/auth/signup — creates account and returns JWT token
    const response = await API.post("/auth/signup", { email, password });
    return response.data; // { success: true, data: { user, token } }
  },

  /**
   * Register an anonymous (no-email) account
   * Useful for users who want privacy
   * @returns {Object} { success, data: { user, token }, message }
   */
  anonymousSignup: async () => {
    // POST /api/auth/signup with isAnonymous flag
    const response = await API.post("/auth/signup", { isAnonymous: true });
    return response.data;
  },

  /**
   * Login with email and password
   * @param {string} email - Registered email
   * @param {string} password - Account password
   * @returns {Object} { success, data: { user, token }, message }
   */
  login: async (email, password) => {
    // POST /api/auth/login — verifies credentials and returns JWT
    const response = await API.post("/auth/login", { email, password });
    return response.data;
  },

  /**
   * Get the current user's profile
   * Requires: valid JWT token (attached by interceptor)
   * @returns {Object} { success, data: { userId, email, isAnonymous, createdAt } }
   */
  getProfile: async () => {
    // GET /api/auth/profile — protected route
    const response = await API.get("/auth/profile");
    return response.data;
  },

  /**
   * Verify whether a JWT token is still valid
   * @param {string} token - JWT to verify
   * @returns {Object} { success, data: decoded user info }
   */
  verifyToken: async (token) => {
    const response = await API.post("/auth/verify-token", { token });
    return response.data;
  },
};

// ============================================================
// ASSESSMENT API - Submit test, get results, recommendations
// ============================================================

export const assessmentAPI = {
  /**
   * Submit the 7-question mental health assessment
   * @param {Object} answers - { q1:1-5, q2:1-5, ..., q7:1-5 }
   * @returns {Object} { success, data: { stressScore, anxietyScore, therapyStyle, ... } }
   */
  submit: async (answers) => {
    // POST /api/assessment/submit — calculates scores and saves
    const response = await API.post("/assessment/submit", { answers });
    return response.data;
  },

  /**
   * Get the user's most recent assessment
   * @returns {Object} Latest assessment with all scores
   */
  getLatest: async () => {
    // GET /api/assessment/latest — returns newest assessment
    const response = await API.get("/assessment/latest");
    return response.data;
  },

  /**
   * Get assessment history to track mental health progress
   * @param {number} limit - Max entries to return (default 10)
   * @returns {Object} { success, data: [assessments], count }
   */
  getHistory: async (limit = 10) => {
    const response = await API.get(`/assessment/history?limit=${limit}`);
    return response.data;
  },

  /**
   * Get AI-generated therapy recommendations based on scores
   * @returns {Object} { success, data: { recommendations[], therapyStyle } }
   */
  getRecommendations: async () => {
    const response = await API.get("/assessment/recommendations");
    return response.data;
  },
};

// ============================================================
// CHAT API - Send messages, get history, clear history
// ============================================================

export const chatAPI = {
  /**
   * Send a message to the AI therapist
   * The backend personalizes the response based on the user's
   * assessment results (therapyStyle) and conversation history.
   * @param {string} message - User's message text
   * @returns {Object} { success, data: { aiResponse, userMessage, therapyStyle, tokenUsage } }
   */
  sendMessage: async (message) => {
    // POST /api/chat/send — processes message through OpenAI
    const response = await API.post("/chat/send", { message });
    return response.data;
  },

  /**
   * Get conversation history with the AI
   * @param {number} limit - Number of messages (default 20)
   * @returns {Object} { success, data: [messages], count }
   */
  getHistory: async (limit = 50) => {
    const response = await API.get(`/chat/history?limit=${limit}`);
    return response.data;
  },

  /**
   * Clear entire conversation history (permanent!)
   * @returns {Object} { success, deletedCount, message }
   */
  clearHistory: async () => {
    const response = await API.delete("/chat/history");
    return response.data;
  },
};

// ============================================================
// MOOD API - Log moods, get history with statistics
// ============================================================

export const moodAPI = {
  /**
   * Log a new mood entry
   * @param {number} moodScore - Rating 1-10 (1=very sad, 10=euphoric)
   * @param {string} note - Optional note about what's influencing mood
   * @returns {Object} { success, data: saved mood entry }
   */
  logMood: async (moodScore, note = "") => {
    // POST /api/mood/log — saves mood to database
    const response = await API.post("/mood/log", { moodScore, note });
    return response.data;
  },

  /**
   * Get mood history with statistics (avg, trend, etc.)
   * @param {number} days - Number of past days to fetch (default 30)
   * @returns {Object} { success, data: { entries, stats: {count,average,highest,lowest,trend} } }
   */
  getHistory: async (days = 30) => {
    const response = await API.get(`/mood/history?days=${days}`);
    return response.data;
  },
};

// ============================================================
// JOURNAL API - Create entries, get entries, delete
// ============================================================

export const journalAPI = {
  /**
   * Create a journal entry — AI analyzes sentiment and provides insight
   * @param {string} content - Journal text (max 5000 chars)
   * @returns {Object} { success, data: { content, sentiment, aiInsight, createdAt } }
   */
  createEntry: async (content) => {
    // POST /api/journal/create — AI analyzes and stores
    const response = await API.post("/journal/create", { content });
    return response.data;
  },

  /**
   * Get all journal entries with sentiment statistics
   * @param {number} limit - Max entries (default 10, max 50)
   * @returns {Object} { success, data: { entries[], stats } }
   */
  getEntries: async (limit = 10) => {
    const response = await API.get(`/journal/entries?limit=${limit}`);
    return response.data;
  },

  /**
   * Get a single journal entry by its ID
   * @param {string} entryId - MongoDB ObjectId of the entry
   * @returns {Object} { success, data: full journal entry }
   */
  getEntry: async (entryId) => {
    const response = await API.get(`/journal/entry/${entryId}`);
    return response.data;
  },

  /**
   * Delete a journal entry permanently
   * @param {string} entryId - MongoDB ObjectId of the entry to delete
   * @returns {Object} { success, message }
   */
  deleteEntry: async (entryId) => {
    const response = await API.delete(`/journal/entry/${entryId}`);
    return response.data;
  },
};

// Default export for convenience — import all APIs at once
export default { authAPI, assessmentAPI, chatAPI, moodAPI, journalAPI };
