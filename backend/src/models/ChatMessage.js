// ============================================================
// CHATMESSAGE.JS — Chat Message MongoDB Model (Schema)
// ============================================================
//
// FILE PURPOSE:
//   This file defines the database schema for chat messages.
//   Every message in the AI therapy conversation (both user
//   messages and AI responses) is stored as a ChatMessage document.
//
// WHAT THIS FILE DOES:
//   1. Defines the ChatMessage schema with required fields
//   2. Creates the Mongoose model for database operations
//   3. Exports for use in chat service and memory manager
//
// SCHEMA FIELDS:
//   userId     — Which user this message belongs to (ObjectId ref)
//   role       — Who sent the message: "user" or "assistant"
//              ("user" = human, "assistant" = AI therapist)
//   content    — The actual text content of the message
//   tokenCount — Number of AI tokens used (for cost tracking)
//              - prompt_tokens for user messages
//              - completion_tokens for AI responses
//   createdAt  — When the message was sent (auto via timestamps)
//   updatedAt  — Auto-generated (via timestamps)
//
// WHY THIS FILE EXISTS:
//   - Stores conversation history so users can see past chats
//   - Provides context to the AI (last 5 messages are sent
//     with each new request so AI can continue the conversation)
//   - Token counting helps track API usage costs
//
// WHY role IS IMPORTANT:
//   The OpenAI/Groq API uses roles to understand conversation flow:
//   - "user" messages = what the human said
//   - "assistant" messages = what the AI replied
//   This lets the AI understand turn-taking in the conversation.
//
// USED BY: chat.service.js, memory.manager.js
// ============================================================

const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    // userID links message to user
    userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
    },
    // role tells if msg is from user or ai
    role: {
        type: String,
        enum: ["user", "assistant"]
    },
    // actual text content
    content: String,
    // token count for ai cost tracking
    tokenCount: Number
}, { 
    // automatically adds createdAt and updatedAt
    timestamps: true
  });

  // model ni export chstuna so that services lo use chskovachani
const ChatMessage = mongoose.model("ChatMessage", chatSchema);

module.exports = ChatMessage;

// chat schema ni design ela chyali 