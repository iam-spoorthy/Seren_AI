// ============================================================
// MEMORY.MANAGER.JS — Conversation Memory Retrieval
// ============================================================
//
// FILE PURPOSE:
//   This file manages the AI's "memory" of past conversations.
//   When a user sends a new message, the AI needs context from
//   previous messages to respond coherently. This file fetches
//   the last 10 messages from the database for that purpose.
//
// WHAT THIS FILE DOES:
//   1. Imports the ChatMessage model (MongoDB collection)
//   2. Provides getRecentMemory(userId) function
//   3. Queries last 10 messages for the given user
//   4. Returns them in chronological order (oldest → newest)
//   5. Strips away MongoDB metadata, returns only role + content
//
// WHY THIS FILE EXISTS:
//   - AI models (like GPT/Groq) are stateless — they don't
//     remember previous messages unless you send them again
//   - By fetching recent messages, we give the AI context
//     so it can respond to ongoing conversations naturally
//   - 10 messages is a good balance between context and token cost
//
// HOW IT WORKS:
//   1. Query ChatMessage collection for this user's messages
//   2. Sort by createdAt DESC (newest first) → limit to 10
//   3. Reverse the array to get chronological order
//   4. Map to { role, content } format (what OpenAI API expects)
//
// USED BY: prompt.builder.js (to build the full prompt with history)
//
// NOTE: This file is currently not directly used in the main flow.
//       chat.service.js has its own inline memory fetch (last 5 msgs).
//       This module could replace that for cleaner architecture.
// ============================================================

// chatmessage model ni import chstuna so that to read our chat history
const ChatMessage = require("../models/ChatMessage");

// memory nunchi last 10 messages tevali
const getRecentMemory = async (userId) => {
    // find messages for that user
  const messages = await ChatMessage.find({ userId })
  // sort by latest first
    .sort({ createdAt: -1 })
    // 10 messages limit
    .limit(10)
    // convert mongoose object to plain js object
    .lean();

    // reverse oldest -> newest
  return messages.reverse().map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

module.exports = { getRecentMemory };