// ============================================================
// AUTH.CONTROLLER.JS — HTTP Handler for Authentication
// ============================================================
//
// FILE PURPOSE:
//   This controller handles ALL HTTP requests related to user
//   authentication: signup, login, profile, and token verification.
//   It validates user input, calls the auth service, and sends
//   back properly formatted HTTP responses.
//
// WHAT THIS FILE DOES:
//   Provides 4 endpoint handlers:
//
//   1. signup (POST /api/auth/signup)
//      - Registers a new user (email+password OR anonymous)
//      - Validates email and password are provided
//      - Calls auth service to create user + hash password
//      - Generates JWT token and returns it to the client
//      - Returns 409 if email already exists
//
//   2. login (POST /api/auth/login)
//      - Authenticates user with email + password
//      - Validates credentials are provided
//      - Calls auth service to verify password via bcrypt
//      - Returns JWT token on success, 401 on failure
//
//   3. getProfile (GET /api/auth/profile) [PROTECTED]
//      - Returns the currently authenticated user's profile
//      - Uses req.user.userId (set by auth middleware)
//      - Returns: userId, email, isAnonymous, createdAt
//
//   4. verifyToken (POST /api/auth/verify-token)
//      - Checks if a JWT token is still valid (not expired)
//      - Used by frontend on app load to restore sessions
//      - Returns decoded token data if valid
//
// WHY THIS FILE EXISTS:
//   Separates HTTP handling (status codes, request parsing)
//   from business logic (password hashing, DB queries) which
//   lives in auth.service.js. Clean architecture pattern.
//
// JWT TOKEN FLOW:
//   Signup/Login → Server creates JWT → Client stores in localStorage
//   → Client sends in Authorization header → Middleware verifies
//   → Controller accesses req.user.userId
// ============================================================

// Import auth service with business logic
const authService = require("../services/auth.service");

// === AUTH CONTROLLER ===
// Controllers handle HTTP requests and responses
// They use services to perform business logic
// They validate input and format output

const authController = {

  /**
   * POST /api/auth/signup
   * Register a new user account
   * Requires: email, password in request body (or isAnonymous: true)
   * Returns: User data and JWT token
   */
  signup: async (req, res) => {
    try {
      // Extract signup data from request body
      const { email, password, isAnonymous } = req.body;

      // === VALIDATE INPUT ===

      // If not anonymous, validate email and password are provided
      if (!isAnonymous && (!email || !password)) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required for regular signup",
          code: "MISSING_FIELDS"
        });
      }

      // === PERFORM SIGNUP ===

      // Call auth service to create new user
      const result = await authService.signup(email, password, isAnonymous);

      // If signup was successful
      if (result.success) {
        // Generate JWT token for new user
        const { user } = result;
        const token = require("jsonwebtoken").sign(
          {
            userId: user.userId,
            email: user.email,
            isAnonymous: user.isAnonymous
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Return 201 Created with user data and token
        return res.status(201).json({
          success: true,
          data: {
            user: result.user,
            token // Client will use this token for authenticated requests
          },
          message: result.message
        });
      }

      // If signup failed, return appropriate error
      const statusCode = result.code === "EMAIL_EXISTS" ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in signup:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "SIGNUP_ERROR"
      });
    }
  },

  /**
   * POST /api/auth/login
   * Login user with email and password
   * Requires: email, password in request body
   * Returns: User data and JWT token
   */
  login: async (req, res) => {
    try {
      // Extract login credentials from request body
      const { email, password } = req.body;

      // === VALIDATE INPUT ===

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS"
        });
      }

      // === PERFORM LOGIN ===

      // Call auth service to verify credentials and get token
      const result = await authService.login(email, password);

      // If login was successful
      if (result.success) {
        // Return 200 OK with user data and JWT token
        return res.status(200).json({
          success: true,
          data: {
            user: result.user,
            token: result.token // Client stores this for authenticated requests
          },
          message: result.message
        });
      }

      // If login failed (invalid credentials)
      return res.status(401).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in login:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "LOGIN_ERROR"
      });
    }
  },

  /**
   * GET /api/auth/profile
   * Get current user's profile information
   * Requires: JWT authentication (via middleware)
   * Returns: User profile data
   */
  getProfile: async (req, res) => {
    try {
      // Extract user ID from authenticated request (set by auth middleware)
      const userId = req.user.userId;

      // === FETCH PROFILE ===

      // Call auth service to get user profile
      const result = await authService.getUserProfile(userId);

      // If profile found
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.user,
          message: result.message
        });
      }

      // If user not found (shouldn't happen with valid token)
      return res.status(404).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in getProfile:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "PROFILE_ERROR"
      });
    }
  },

  /**
   * POST /api/auth/verify-token
   * Verify if a JWT token is valid
   * Requires: token in request body
   * Returns: Token validity and decoded data if valid
   */
  verifyToken: async (req, res) => {
    try {
      // Extract token from request body
      const { token } = req.body;

      // Validate token is provided
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Token is required",
          code: "NO_TOKEN"
        });
      }

      // === VERIFY TOKEN ===

      // Call auth service to verify token
      const result = await authService.verifyToken(token);

      // If token is valid
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      }

      // If token is invalid or expired
      return res.status(401).json({
        success: false,
        error: result.error,
        code: result.code
      });

    } catch (error) {
      // Catch any unexpected errors
      console.error("Error in verifyToken:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: "VERIFICATION_ERROR"
      });
    }
  }
};

// Export controller functions for use in routes
module.exports = authController;
