// ============================================================
// APP.JSX - Root Application Component (Routing Hub)
// ============================================================
// This is the top-level component that defines ALL routes in
// the SerenAI application using React Router v6.
//
// ROUTE STRUCTURE:
//   PUBLIC (no auth required):
//     /login      → LoginPage
//     /signup     → SignupPage
//
//   PROTECTED (auth required, wrapped in ProtectedRoute):
//     /dashboard  → DashboardPage (main hub)
//     /assessment → AssessmentPage (7-question eval)
//     /chat       → ChatPage (AI therapist)
//     /mood       → MoodPage (mood tracker)
//     /journal    → JournalPage (AI journaling)
//
//     /           → redirects to /dashboard
//     *           → redirects to /dashboard (catch-all)
//
// HOW ROUTING WORKS:
//   <Routes> matches the current URL to a <Route> element.
//   ProtectedRoute is a "layout route" — it checks auth and
//   renders <Outlet /> which displays the matched child route.
//   If the user is not authenticated, ProtectedRoute redirects
//   to /login automatically.
// ============================================================

import { Routes, Route, Navigate } from "react-router-dom";

// === PAGE IMPORTS ===
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import AssessmentPage from "./pages/AssessmentPage";
import ChatPage from "./pages/ChatPage";
import MoodPage from "./pages/MoodPage";
import JournalPage from "./pages/JournalPage";
import BreathingExercisePage from "./pages/BreathingExercisePage";

// === COMPONENT IMPORTS ===
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    // Routes container — only one child route renders at a time
    <Routes>
      {/* ============================================ */}
      {/* PUBLIC ROUTES - accessible without login     */}
      {/* ============================================ */}

      {/* Login page — entry point for returning users */}
      <Route path="/login" element={<LoginPage />} />

      {/* Signup page — registration for new users */}
      <Route path="/signup" element={<SignupPage />} />

      {/* ============================================ */}
      {/* PROTECTED ROUTES - require authentication    */}
      {/* ============================================ */}
      {/* ProtectedRoute checks auth state:            */}
      {/*   - authenticated → renders <Outlet />       */}
      {/*   - not authenticated → redirects to /login  */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard — main hub with summary cards */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Assessment — 7-question mental health evaluation */}
        <Route path="/assessment" element={<AssessmentPage />} />

        {/* Chat — AI therapist conversation interface */}
        <Route path="/chat" element={<ChatPage />} />

        {/* Mood — mood logging and history visualization */}
        <Route path="/mood" element={<MoodPage />} />

        {/* Journal — AI-assisted journaling with insights */}
        <Route path="/journal" element={<JournalPage />} />

        {/* Breathing Exercise — crisis calming tool (4-4-8 breathing with Buddha) */}
        <Route path="/breathing" element={<BreathingExercisePage />} />
      </Route>

      {/* ============================================ */}
      {/* REDIRECTS & CATCH-ALL                        */}
      {/* ============================================ */}

      {/* Root path → redirect to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all → redirect unknown paths to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}