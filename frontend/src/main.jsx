// ============================================================
// MAIN.JSX - Application Entry Point
// ============================================================
// This is the very first JavaScript file that runs. It:
//   1. Creates a React root attached to the #root DOM element
//   2. Wraps the entire app in context providers (order matters!)
//
// PROVIDER ORDER (outermost → innermost):
//   <BrowserRouter>   → Enables client-side routing (useNavigate, etc.)
//     <AuthProvider>  → Provides auth state (user, token, login/logout)
//       <App />       → The actual application routes and UI
//
// WHY THIS ORDER?
//   - BrowserRouter must wrap AuthProvider because AuthProvider
//     may need to use useNavigate() for redirects
//   - AuthProvider must wrap App because all pages need access
//     to auth state via useAuth() hook
//
// NOTE: React.StrictMode is intentionally omitted to avoid
// double-mounting effects during development (which would cause
// duplicate API calls). You can add it back if desired:
//   <React.StrictMode><App /></React.StrictMode>
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

// === MOUNT THE APPLICATION ===
// document.getElementById('root') finds the <div id="root"> in index.html
// createRoot enables React 18's concurrent rendering features
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    {/* AuthProvider makes user/token/login/logout available everywhere */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);