// ============================================================
// CRISIS.SERVICE.JS — Crisis Keyword Detection
// ============================================================
//
// FILE PURPOSE:
//   This file provides a safety function that checks if a user's
//   message contains crisis-related keywords (suicidal thoughts,
//   self-harm, etc.). This is a critical safety feature for a
//   mental health application.
//
// WHAT THIS FILE DOES:
//   1. Defines a list of crisis-related keywords/phrases
//   2. Provides checkCrisis(message) function
//   3. Checks if the message contains ANY of the crisis keywords
//   4. Returns true if crisis keywords found, false otherwise
//
// WHY THIS FILE EXISTS:
//   - SAFETY FIRST: Mental health apps MUST detect crisis signals
//   - When a user mentions suicide or self-harm, the app should
//     immediately show crisis resources (hotlines, text lines)
//   - This is a basic keyword-based approach; production apps
//     would use more sophisticated NLP models
//
// HOW IT WORKS:
//   - Converts message to lowercase for case-insensitive matching
//   - Uses Array.some() to check if ANY keyword is found
//   - Returns boolean: true = crisis detected, false = safe
//
// CRISIS KEYWORDS CHECKED:
//   "suicide", "kill myself", "want to die", "end my life"
//
// POTENTIAL IMPROVEMENTS:
//   - Add more keywords (self-harm, cutting, overdose, etc.)
//   - Use AI/NLP for more nuanced detection
//   - Add severity scoring (mild concern vs. immediate danger)
//   - Integrate with crisis hotline APIs
//
// NOTE: This module is available but not currently integrated
//       into the main chat flow. chat.service.js relies on the
//       AI's system prompt for crisis awareness instead.
//
// USED BY: Could be used by chat.service.js before sending to AI
// ============================================================

// function checks if user message contain some dangerous words
const checkCrisis = (message) => {

  const crisisWords = [
    "suicide", 
    "kill myself", 
    "want to die", 
    "end my life"
    ];
    // return true if any keyword exists
  return crisisWords.some(word =>
    message.toLowerCase().includes(word)
  );
};

module.exports = checkCrisis;