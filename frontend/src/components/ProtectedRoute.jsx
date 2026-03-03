// ============================================================
// PROTECTED ROUTE COMPONENT
// ============================================================
// This component acts as a route guard (like middleware) for
// authenticated-only pages. It wraps protected page components
// in the React Router config.
//
// HOW IT WORKS:
//   1. Reads auth state from AuthContext
//   2. While auth is loading (checking token) → shows spinner
//   3. If user is authenticated → renders the child route (Outlet)
//   4. If user is NOT authenticated → redirects to /login
//
// USAGE IN App.jsx:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/dashboard" element={<DashboardPage />} />
//     ...all other protected routes...
//   </Route>
//
// WHY Outlet?
//   React Router v6's "layout routes" pattern uses <Outlet />
//   to render whichever child route matched. This lets us wrap
//   multiple routes in a single auth check without repeating
//   the guard on each route.
// ============================================================

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  // === GET AUTH STATE ===
  // `isAuthenticated` is true when user has a valid token
  // `loading` is true while the app checks the existing token on mount
  const { isAuthenticated, loading } = useAuth();

  // === LOADING STATE ===
  // While checking auth (e.g., verifying stored token on page reload),
  // show a loading spinner instead of briefly flashing the login page
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // === AUTH CHECK ===
  // If not authenticated, redirect to login page
  // `replace` prevents the /login redirect from being added to history,
  // so pressing "Back" won't loop back to the protected page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // === RENDER CHILD ROUTES ===
  // <Outlet /> renders whichever nested route matched
  return <Outlet />;
}
