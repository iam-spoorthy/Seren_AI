// ============================================================
// AUTH.MIDDLEWARE.JS — JWT Authentication Guard
// ============================================================
//
// FILE PURPOSE:
//   This middleware protects API routes that require authentication.
//   It runs BEFORE the controller for every protected endpoint.
//   If the user doesn't have a valid JWT token, the request is
//   rejected with a 401 Unauthorized error.
//
// WHAT THIS FILE DOES:
//   1. Extracts the JWT token from the Authorization header
//      (format: "Bearer eyJhbGciOi...")
//   2. Verifies the token's signature using JWT_SECRET
//   3. Checks if the token has expired
//   4. If valid: attaches decoded user data to req.user
//      (so controllers can access req.user.userId)
//   5. If invalid: returns appropriate error response
//
// WHY THIS FILE EXISTS:
//   - Without this, anyone could access protected endpoints
//   - Centralizes auth logic in one place (DRY principle)
//   - Every protected route just adds `authMiddleware` before
//     its controller: router.get("/profile", authMiddleware, ctrl)
//
// HOW JWT AUTHENTICATION WORKS (full flow):
//   1. User logs in -> server creates JWT with { userId, email }
//   2. Client stores JWT in localStorage
//   3. Client sends JWT in every request header:
//      Authorization: "Bearer <token>"
//   4. This middleware verifies the token on each request
//   5. If valid -> req.user = { userId, email, isAnonymous }
//   6. Controller uses req.user.userId to fetch user-specific data
//
// ERROR HANDLING:
//   - No token provided      -> 401 "Authentication token is required"
//   - Token expired           -> 401 "Token has expired"
//   - Token tampered/invalid  -> 401 "Invalid token format"
//   - Any other error         -> 401 "Authentication failed"
//
// USED BY: All route files (assessment, chat, journal, mood, auth/profile)
// ============================================================

// Import JWT library for token verification
const jwt = require("jsonwebtoken");

// === AUTH MIDDLEWARE ===
// This middleware verifies JWT tokens in incoming requests
// If token is invalid or missing, request is rejected
// If token is valid, user ID is attached to req.user for use in controllers

const authMiddleware = (req, res, next) => {
  try {
    // Extract JWT token from Authorization header (format: "Bearer <token>")
    const token = req.headers.authorization?.split(" ")[1];

    // If no token provided, reject the request with 401 Unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication token is required",
        code: "NO_TOKEN"
      });
    }

    // Verify token using JWT_SECRET from environment variables
    // If verification fails, jwt.verify() will throw an error caught below
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user information to request object
    // This allows controllers to access user data: req.user.userId
    req.user = decoded;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    // Handle specific JWT errors with helpful messages

    // Token has expired - user needs to refresh or login again
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired, please login again",
        code: "TOKEN_EXPIRED"
      });
    }

    // Token format or signature is invalid - likely tampered with
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token format",
        code: "INVALID_TOKEN"
      });
    }

    // Handle any other authentication errors
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_FAILED"
    });
  }
};

// Export middleware for use in protected routes
module.exports = authMiddleware;