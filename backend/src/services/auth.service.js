// ============================================================
// AUTH.SERVICE.JS — Authentication Business Logic
// ============================================================
//
// FILE PURPOSE:
//   This service handles ALL authentication business logic:
//   creating accounts, verifying passwords, generating JWT tokens,
//   and fetching user profiles. It's the security backbone of
//   the entire application.
//
// WHAT THIS FILE DOES:
//   Provides 4 methods:
//
//   1. signup(email, password, isAnonymous)
//      - For regular users: validates email format, checks
//        password strength (min 6 chars), ensures email is unique,
//        hashes password with bcrypt, creates User document
//      - For anonymous users: generates random email/password,
//        sets isAnonymous=true, no validation needed
//      - Returns: { userId, email, isAnonymous }
//
//   2. login(email, password)
//      - Finds user by email in database
//      - Compares plain password with stored bcrypt hash
//      - If match: creates JWT token (expires in 7 days)
//      - If no match: returns generic "incorrect" error
//        (to not reveal which field is wrong)
//      - Returns: { token, user data }
//
//   3. verifyToken(token)
//      - Verifies JWT signature and expiration
//      - Used by frontend on app load to check saved tokens
//      - Returns decoded data if valid, error if expired/invalid
//
//   4. getUserProfile(userId)
//      - Fetches user from database by ID
//      - Returns user data WITHOUT the password field
//      - Used by the profile endpoint
//
// SECURITY FEATURES:
//   - Passwords hashed with bcrypt (10 salt rounds)
//   - JWT tokens expire after 7 days
//   - Generic error messages prevent email enumeration
//   - Password never returned in API responses
//
// DEPENDENCIES:
//   bcryptjs     — Password hashing library
//   jsonwebtoken — JWT creation and verification
//
// USED BY: auth.controller.js
// ============================================================

// Import User model from database
const User = require("../models/User");

// Import bcryptjs for password hashing
const bcrypt = require("bcryptjs");

// Import jsonwebtoken for creating JWT tokens
const jwt = require("jsonwebtoken");

// === AUTH SERVICE ===
// Handles user authentication including signup, login, and token management
// Passwords are hashed before storage for security

const authService = {

  /**
   * Register a new user account
   * @param {string} email - User's email address
   * @param {string} password - User's password (will be hashed)
   * @param {boolean} isAnonymous - Whether to create anonymous account (default: false)
   * @returns {Object} Success status with user data or error
   */
  signup: async (email, password, isAnonymous = false) => {
    try {
      // === VALIDATION ===
      
      // For anonymous users, we don't require email/password
      if (isAnonymous) {
        // Create anonymous user with random ID
        const anonymousUser = new User({
          email: `anonymous_${Date.now()}_${Math.random().toString(36)}@serenai.local`,
          password: await bcrypt.hash(Math.random().toString(), 10),
          isAnonymous: true
        });

        await anonymousUser.save();

        // Return user data (without password)
        return {
          success: true,
          user: {
            userId: anonymousUser._id,
            email: anonymousUser.email,
            isAnonymous: true
          },
          message: "Anonymous account created"
        };
      }

      // For regular users, validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: "Invalid email format",
          code: "INVALID_EMAIL"
        };
      }

      // Validate password strength (at least 6 characters)
      if (!password || password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters",
          code: "WEAK_PASSWORD"
        };
      }

      // Check if email already exists (prevent duplicate accounts)
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return {
          success: false,
          error: "Email already registered",
          code: "EMAIL_EXISTS"
        };
      }

      // === CREATE USER ===

      // Hash password using bcryptjs (salt rounds: 10 is standard for security)
      // This ensures passwords are never stored in plain text
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user document
      const newUser = new User({
        email,
        password: hashedPassword,
        isAnonymous: false
      });

      // Save user to database
      await newUser.save();

      // Return success with user data (note: DO NOT return password)
      return {
        success: true,
        user: {
          userId: newUser._id,
          email: newUser.email,
          isAnonymous: false
        },
        message: "User registered successfully"
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "SIGNUP_ERROR"
      };
    }
  },

  /**
   * Login user and generate JWT token
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Object} Success status with JWT token and user data
   */
  login: async (email, password) => {
    try {
      // === VALIDATION ===

      // Check if email and password provided
      if (!email || !password) {
        return {
          success: false,
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS"
        };
      }

      // === FIND USER ===

      // Query database for user with this email
      const user = await User.findOne({ email });

      // If user not found
      if (!user) {
        return {
          success: false,
          error: "Email or password is incorrect",
          code: "INVALID_CREDENTIALS"
        };
      }

      // === VERIFY PASSWORD ===

      // Compare provided password with hashed password using bcrypt
      // bcrypt.compare returns true if passwords match, false otherwise
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return {
          success: false,
          error: "Email or password is incorrect",
          code: "INVALID_CREDENTIALS"
        };
      }

      // === GENERATE JWT TOKEN ===

      // Create JWT token with user information
      // This token will be sent to client and used for authenticated requests
      // Token expires in 7 days for security
      const token = jwt.sign(
        {
          userId: user._id,      // Include user ID for request identification
          email: user.email,
          isAnonymous: user.isAnonymous
        },
        process.env.JWT_SECRET, // Secret key from environment
        { expiresIn: "7d" }      // Token valid for 7 days
      );

      // Return success with token and user data
      return {
        success: true,
        token, // Client stores this and sends in Authorization header
        user: {
          userId: user._id,
          email: user.email,
          isAnonymous: user.isAnonymous
        },
        message: "Login successful"
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "LOGIN_ERROR"
      };
    }
  },

  /**
   * Verify a JWT token
   * @param {string} token - The JWT token to verify
   * @returns {Object} Decoded token data if valid, error if invalid
   */
  verifyToken: async (token) => {
    try {
      // Verify JWT signature and expiration using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      return {
        success: true,
        data: decoded,
        message: "Token is valid"
      };
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === "TokenExpiredError") {
        return {
          success: false,
          error: "Token has expired",
          code: "TOKEN_EXPIRED"
        };
      }

      return {
        success: false,
        error: "Invalid token",
        code: "INVALID_TOKEN"
      };
    }
  },

  /**
   * Get user profile information
   * @param {string} userId - ID of user
   * @returns {Object} User document with email and isAnonymous flag
   */
  getUserProfile: async (userId) => {
    try {
      // Find user in database by ID
      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND"
        };
      }

      // Return user data (excluding password)
      return {
        success: true,
        user: {
          userId: user._id,
          email: user.email,
          isAnonymous: user.isAnonymous,
          createdAt: user.createdAt
        },
        message: "User profile retrieved"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "PROFILE_ERROR"
      };
    }
  }
};

// Export auth service for use in controllers
module.exports = authService;