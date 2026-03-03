// ============================================================
// LOGIN PAGE - SerenAI Authentication Entry Point
// ============================================================
//
// FILE PURPOSE:
//   This is the first page users see. It provides two ways to
//   access SerenAI:
//     1. Email + Password login (for returning users)
//     2. "Continue Anonymously" (for privacy-conscious users)
//
// WHAT THIS FILE DOES:
//   1. Renders a login form with email and password fields
//   2. On submit: calls the login() function from AuthContext
//      which calls POST /api/auth/login on the backend
//   3. On success: navigates to /dashboard
//   4. On failure: displays error message (wrong credentials, etc.)
//   5. Also provides "Continue Anonymously" button which:
//      - Calls anonymousSignup() from AuthContext
//      - Creates a temporary account without email/password
//      - Redirects to /assessment (new users must take test first)
//   6. Links to /signup for new users who want a real account
//
// WHY THIS FILE EXISTS:
//   - Authentication is required to access all features
//   - Anonymous option removes barrier for hesitant users
//   - Mental health apps need to be low-friction for entry
//
// UI DESIGN:
//   - Dark gradient background (slate/emerald) for calming effect
//   - Glassmorphism card design with subtle borders
//   - Ambient glow effects in background
//   - Loading spinner during authentication
//   - Red error banner for failed login attempts
//
// STATE:
//   email    — controlled input for email field
//   password — controlled input for password field
//   error    — error message string (empty = no error)
//   loading  — true during API call (disables buttons)
//
// NAVIGATION:
//   Success login    → /dashboard
//   Success anon     → /assessment (must take test first)
//   "Sign up" link   → /signup
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, anonymousSignup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleAnonymous = async () => {
    setError("");
    setLoading(true);

    const result = await anonymousSignup();
    if (result.success) {
      navigate("/assessment");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SerenAI</h1>
          <p className="text-slate-400 mt-2 text-sm">Welcome back. Your safe space awaits.</p>
        </div>

        {/* Card */}
        <div className="glass-dark border border-white/10 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-xs text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          <button
            onClick={handleAnonymous}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 text-slate-300 py-3 rounded-xl font-medium hover:bg-white/10 transition-all disabled:opacity-50 text-sm"
          >
            Continue Anonymously
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
