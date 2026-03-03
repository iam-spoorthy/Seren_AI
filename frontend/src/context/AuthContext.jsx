// ============================================================
// AUTH CONTEXT - Global authentication state manager
// ============================================================
// This React Context provides authentication state (user, token,
// loading) to the entire app. Any component can check if the
// user is logged in, access user data, or trigger login/logout.
//
// HOW IT WORKS:
// 1. On app load, checks localStorage for a saved token
// 2. If token exists, verifies it with the backend
// 3. Provides login/signup/logout functions to all children
// 4. Wraps the entire app in <AuthProvider> (see main.jsx)
// ============================================================

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api"; // API functions for auth

// Create the context object — this is what components will consume
const AuthContext = createContext(null);

// ============================================================
// AUTH PROVIDER COMPONENT
// Wraps the app and provides auth state + functions
// ============================================================
export function AuthProvider({ children }) {
  // === STATE ===
  const [user, setUser] = useState(null);       // Current user object (or null if not logged in)
  const [token, setToken] = useState(null);      // JWT token string (or null)
  const [loading, setLoading] = useState(true);  // True while checking if user is already logged in

  // === ON APP LOAD: CHECK FOR EXISTING SESSION ===
  // This runs once when the app first mounts.
  // If the user previously logged in and closed the tab,
  // their token is still in localStorage — we verify it's valid.
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Read saved token and user from browser storage
        const savedToken = localStorage.getItem("serenai_token");
        const savedUser = localStorage.getItem("serenai_user");

        if (savedToken && savedUser) {
          // Verify the token hasn't expired by calling the backend
          const result = await authAPI.verifyToken(savedToken);

          if (result.success) {
            // Token is still valid — restore the session
            setToken(savedToken);
            setUser(JSON.parse(savedUser)); // Parse the JSON string back to object
          } else {
            // Token expired or invalid — clear everything
            localStorage.removeItem("serenai_token");
            localStorage.removeItem("serenai_user");
          }
        }
      } catch (error) {
        // Network error or backend down — clear stale data
        console.error("Auth initialization error:", error);
        localStorage.removeItem("serenai_token");
        localStorage.removeItem("serenai_user");
      } finally {
        // Whether success or failure, we're done loading
        setLoading(false);
      }
    };

    initAuth();
  }, []); // Empty dependency array = runs only once on mount

  // === LOGIN FUNCTION ===
  // Called from the Login page when user submits credentials
  const login = async (email, password) => {
    try {
      // Call backend login endpoint
      const result = await authAPI.login(email, password);

      if (result.success) {
        // Extract user and token from response
        const { user: userData, token: authToken } = result.data;

        // Save to React state (updates UI immediately)
        setUser(userData);
        setToken(authToken);

        // Save to localStorage (persists across page refreshes)
        localStorage.setItem("serenai_token", authToken);
        localStorage.setItem("serenai_user", JSON.stringify(userData));

        return { success: true }; // Tell the Login component it worked
      }

      // Login failed — return error message for the UI to display
      return { success: false, error: result.error };
    } catch (error) {
      // Network error or unexpected failure
      const message = error.response?.data?.error || "Login failed. Please try again.";
      return { success: false, error: message };
    }
  };

  // === SIGNUP FUNCTION ===
  // Called from the Signup page when user creates a new account
  const signup = async (email, password) => {
    try {
      // Call backend signup endpoint
      const result = await authAPI.signup(email, password);

      if (result.success) {
        const { user: userData, token: authToken } = result.data;

        // Save auth state and persist to localStorage
        setUser(userData);
        setToken(authToken);
        localStorage.setItem("serenai_token", authToken);
        localStorage.setItem("serenai_user", JSON.stringify(userData));

        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      const message = error.response?.data?.error || "Signup failed. Please try again.";
      return { success: false, error: message };
    }
  };

  // === ANONYMOUS SIGNUP FUNCTION ===
  // Creates account without email/password for privacy-conscious users
  const anonymousSignup = async () => {
    try {
      const result = await authAPI.anonymousSignup();

      if (result.success) {
        const { user: userData, token: authToken } = result.data;

        setUser(userData);
        setToken(authToken);
        localStorage.setItem("serenai_token", authToken);
        localStorage.setItem("serenai_user", JSON.stringify(userData));

        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      const message = error.response?.data?.error || "Anonymous signup failed.";
      return { success: false, error: message };
    }
  };

  // === LOGOUT FUNCTION ===
  // Clears all auth state and redirects to login
  const logout = () => {
    // Clear React state
    setUser(null);
    setToken(null);

    // Clear persistent storage
    localStorage.removeItem("serenai_token");
    localStorage.removeItem("serenai_user");
  };

  // === PROVIDE VALUES TO ALL CHILDREN ===
  // Any component wrapped in <AuthProvider> can access these values
  // using the useAuth() hook defined below.
  const value = {
    user,             // Current user object { userId, email, isAnonymous }
    token,            // JWT token string
    loading,          // Boolean: true while checking for existing session
    isAuthenticated: !!token, // Quick boolean: is the user logged in?
    login,            // Function to login
    signup,           // Function to signup
    anonymousSignup,  // Function to create anonymous account
    logout,           // Function to logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// useAuth HOOK - Easy way for components to access auth state
// ============================================================
// Usage in any component:
//   const { user, login, logout, isAuthenticated } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);

  // Safety check: make sure this hook is used inside <AuthProvider>
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
