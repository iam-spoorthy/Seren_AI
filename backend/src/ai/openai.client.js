// ============================================================
// OPENAI.CLIENT.JS — Groq AI Client Configuration
// ============================================================
//
// FILE PURPOSE:
//   This file creates and configures the AI client that talks
//   to the Groq API. Groq is an AI inference provider that uses
//   the same API format as OpenAI, so we use the OpenAI SDK
//   but point it to Groq's servers instead.
//
// WHAT THIS FILE DOES:
//   1. Imports the OpenAI SDK (npm package "openai")
//   2. Creates a new client instance with Groq credentials
//   3. Sets the baseURL to Groq's API endpoint
//   4. Exports the configured client for other files to use
//
// WHY THIS FILE EXISTS:
//   - Centralizes AI client configuration in one place
//   - Any file that needs to call the AI just imports this
//   - If we switch AI providers, we only change this file
//   - Groq provides fast inference for open-source models
//     like LLaMA, Mixtral, etc.
//
// WHY GROQ INSTEAD OF OPENAI?
//   - Groq is MUCH faster (uses custom LPU hardware)
//   - Groq is cheaper than OpenAI for similar quality
//   - Groq supports the same API format (drop-in compatible)
//   - Model used: llama-3.3-70b-versatile (set in .env)
//
// ENVIRONMENT VARIABLES REQUIRED:
//   GROQ_API_KEY — API key from console.groq.com
//
// USED BY: chat.service.js, journal.service.js
//
// NOTE: This module is available but chat.service.js and
//       journal.service.js create their own clients inline.
//       This could be refactored to use this shared client.
// ============================================================

// Groq client using OpenAI-compatible SDK
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

module.exports = openai;