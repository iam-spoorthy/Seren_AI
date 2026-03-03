// ============================================================
// PROMPT.BUILDER.JS — AI System Prompt Constructor
// ============================================================
//
// FILE PURPOSE:
//   This file builds the message array that gets sent to the AI.
//   It combines three things into a single prompt:
//     1. SYSTEM MESSAGE: Instructions telling AI how to behave
//        (therapy style, stress level, personality)
//     2. MEMORY: Previous conversation messages for context
//     3. USER MESSAGE: The current message from the user
//
// WHAT THIS FILE DOES:
//   1. Takes user's profile (stressScore, therapyStyle)
//   2. Takes conversation memory (array of past messages)
//   3. Takes the current user message
//   4. Combines them into the exact format the AI API expects
//   5. Returns the complete messages array
//
// WHY THIS FILE EXISTS:
//   - Separates prompt construction from API calling logic
//   - Makes it easy to modify the AI's personality/behavior
//   - The system message is CRUCIAL — it determines how the
//     AI responds (empathetically, calmly, reflectively, etc.)
//   - Clean separation of concerns
//
// HOW THE AI MESSAGE FORMAT WORKS:
//   OpenAI/Groq API expects an array of message objects:
//   [
//     { role: "system", content: "You are a therapist..." },  ← Instructions
//     { role: "user", content: "I'm feeling anxious" },       ← Past message
//     { role: "assistant", content: "Tell me more..." },      ← Past AI reply
//     { role: "user", content: "It's about work" }            ← Current message
//   ]
//
// NOTE: This module is available but chat.service.js builds
//       its own prompt inline with more detail. This could be
//       refactored to use this shared builder for consistency.
//
// USED BY: Could be used by chat.service.js
// ============================================================

// ai prompt dynamic ga build chstundi 
const buildPrompt = (profile, memory, userMessage) => {
  return [
    // system message tells ai how to behave
    {
      role: "system",
      content: `
You are a supportive AI therapist.
Stress Level: ${profile?.stressScore || "Unknown"}
Therapy Style: ${profile?.therapyStyle || "Supportive"}
Never give medical diagnosis.
Respond calmly and empathetically.
      `
    },
    // previous convo memory
    ...memory,
    {
      role: "user",
      content: userMessage
    }
  ];
};

module.exports = buildPrompt;