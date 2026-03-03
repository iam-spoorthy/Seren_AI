// ============================================================
// CHAT.SERVICE.JS — AI Therapist Chat Business Logic
// ============================================================
//
// FILE PURPOSE:
//   This is the HEART of SerenAI's chat feature. It handles
//   the entire flow of sending a message to the AI therapist
//   and getting a personalized therapeutic response back.
//
// WHAT THIS FILE DOES:
//   Provides 4 methods:
//
//   1. sendMessage(userId, userMessage)
//      THE MAIN FLOW (step by step):
//      a) Validates the message is not empty
//      b) Fetches user's latest assessment to get therapyStyle
//         (determines how the AI responds: supportive/calm/reflective)
//      c) Builds a detailed system prompt telling the AI how to behave
//      d) Fetches last 5 messages from database for conversation context
//      e) Calls Groq API (LLaMA 3.3 70B model) with system prompt +
//         conversation history + new message
//      f) Saves BOTH the user message AND AI response to database
//      g) Returns the AI response + token usage stats
//
//   2. buildSystemPrompt(therapyStyle, riskLevel)
//      - Creates the system instruction that controls AI behavior
//      - Adapts based on therapy style:
//        "calm_grounding" -> breathing/grounding techniques
//        "reflective"     -> self-exploration questions
//        "supportive"     -> balanced validation and guidance
//      - Adds crisis awareness instructions for elevated risk
//      - Adds safety boundaries (no medical advice, no diagnosis)
//
//   3. getConversationHistory(userId, limit)
//      - Fetches past messages from database
//      - Returns in chronological order (oldest first)
//      - Used by ChatPage to show conversation on load
//
//   4. clearConversationHistory(userId)
//      - Deletes ALL messages for a user (cannot be undone)
//      - Returns count of deleted messages
//
// AI MODEL DETAILS:
//   Provider: Groq (fast AI inference platform)
//   Model:    llama-3.3-70b-versatile (or from GROQ_MODEL env var)
//   SDK:      OpenAI-compatible (same API format, different baseURL)
//   Tokens:   max 500 per response (keeps responses concise)
//   Temp:     0.7 (slight randomness for natural conversation)
//
// WHY CONVERSATION CONTEXT MATTERS:
//   AI models are stateless — they don't remember past messages.
//   By sending the last 5 messages with each request, the AI can
//   continue the conversation naturally ("you mentioned earlier...").
//
// USED BY: chat.controller.js
// ============================================================

// Import OpenAI-compatible library (Groq uses the same API format)
const { OpenAI } = require("openai");

// Import ChatMessage model for storing conversation history
const ChatMessage = require("../models/ChatMessage");

// Import Assessment model to get user's therapy style
const Assessment = require("../models/Assessment");

// Initialize Groq client using OpenAI-compatible SDK
// Groq provides the same chat.completions API as OpenAI
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// === CHAT SERVICE ===
// Handles AI-powered therapeutic conversations with users
// Uses OpenAI GPT-4 with personality-adapted prompts

const chatService = {

  /**
   * Send a message to AI therapist and get response
   * @param {string} userId - ID of user sending message
   * @param {string} userMessage - User's message content
   * @returns {Object} AI response and saved conversation
   */
  sendMessage: async (userId, userMessage) => {
    try {
      // === VALIDATE INPUT ===

      if (!userMessage || userMessage.trim().length === 0) {
        return {
          success: false,
          error: "Message cannot be empty",
          code: "EMPTY_MESSAGE"
        };
      }

      // === FETCH USER'S THERAPY STYLE ===

      // Get user's latest assessment to determine therapy style
      // This personalizes how the AI responds
      const latestAssessment = await Assessment.findOne({ userId })
        .sort({ createdAt: -1 });

      // Default to supportive if no assessment yet
      const therapyStyle = latestAssessment?.therapyStyle || "supportive";
      const riskLevel = latestAssessment?.riskLevel || "low";

      // === BUILD SYSTEM PROMPT ===

      // Create a system prompt that instructs the AI how to behave
      // This is crucial for getting therapist-like responses
      const systemPrompt = chatService.buildSystemPrompt(therapyStyle, riskLevel);

      // === FETCH CONVERSATION HISTORY ===

      // Get last 5 messages from conversation to provide context
      // This helps the AI respond coherently to the ongoing conversation
      const conversationHistory = await ChatMessage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();

      // Reverse to get chronological order (oldest to newest)
      conversationHistory.reverse();

      // === BUILD MESSAGE HISTORY FOR OPENAI ===

      // Format conversation history for OpenAI API
      // OpenAI needs conversation in specific format
      const messages = [
        // Add previous messages to context
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        // Add current user message
        {
          role: "user",
          content: userMessage
        }
      ];

      // === CALL OPENAI API ===

      // Send message to OpenAI with system instructions and history
      // max_tokens limits response length to keep responses concise
      const completion = await openai.chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...messages
        ],
        max_tokens: 500, // Keep responses to ~500 tokens (reasonable length)
        temperature: 0.7 // Slight randomness for natural conversation
      });

      // Extract AI response from OpenAI result
      const aiResponse = completion.choices[0].message.content;

      // === SAVE MESSAGES TO DATABASE ===

      // Save user message to conversation history
      const userMsg = new ChatMessage({
        userId,
        role: "user",
        content: userMessage,
        tokenCount: completion.usage.prompt_tokens
      });

      await userMsg.save();

      // Save AI response to conversation history
      const assistantMsg = new ChatMessage({
        userId,
        role: "assistant",
        content: aiResponse,
        tokenCount: completion.usage.completion_tokens
      });

      await assistantMsg.save();

      // === RETURN RESPONSE ===

      return {
        success: true,
        data: {
          userMessage,
          aiResponse, // The AI therapist's response
          therapyStyle, // So frontend can adapt display if needed
          tokenUsage: {
            prompt: completion.usage.prompt_tokens,
            completion: completion.usage.completion_tokens,
            total: completion.usage.total_tokens
          }
        },
        message: "Message processed successfully"
      };

    } catch (error) {
      console.error("Chat error:", error);
      return {
        success: false,
        error: error.message,
        code: "CHAT_ERROR"
      };
    }
  },

  /**
   * Build system prompt based on user's therapy style
   * This determines how the AI therapist responds
   * @param {string} therapyStyle - Type of therapy approach
   * @param {string} riskLevel - Risk assessment level
   * @returns {string} System prompt for OpenAI
   */
  buildSystemPrompt: (therapyStyle, riskLevel) => {
    let prompt = `You are a compassionate, empathetic AI therapist providing support as part of SerenAI. 
Your role is to listen, validate feelings, and provide thoughtful guidance. You are NOT a replacement for professional therapy.

Key principles:
- Be warm, non-judgmental, and supportive
- Ask clarifying questions to understand user's feelings
- Provide practical coping strategies when appropriate
- Normalize their emotions and experiences
- Encourage professional help if needed

`;

    // === ADAPT THERAPY STYLE ===

    // Different therapy styles get different instructions
    switch (therapyStyle) {
      case "calm_grounding":
        prompt += `THERAPY STYLE: Calm & Grounding
The user has high stress. Focus your responses on:
- Breathing and grounding techniques (5-4-8 breathing, 5 senses exercise)
- Helping them feel present and safe in the moment
- Gentle reassurance and calming language
- Short, clear suggestions for immediate relief`;
        break;

      case "reflective":
        prompt += `THERAPY STYLE: Reflective & Introspective
The user has high anxiety. Focus your responses on:
- Reflective listening (repeat back what you hear)
- Helping them explore and understand their anxiety
- Asking thoughtful questions about patterns and triggers
- Encouraging self-discovery rather than prescribing solutions`;
        break;

      case "supportive":
      default:
        prompt += `THERAPY STYLE: Supportive & Encouraging
Use a balanced approach that:
- Validates their emotions and experiences
- Provides gentle guidance and encouragement
- Offers hope and positive perspective when appropriate
- Respects their pace and readiness for change`;
    }

    // === ADD CRISIS AWARENESS ===

    // If user is at elevated risk, include crisis response information
    if (riskLevel === "moderate" || riskLevel === "high") {
      prompt += `

IMPORTANT - CRISIS AWARENESS:
If the user mentions suicidal thoughts, serious self-harm, or severe crisis:
1. IMMEDIATELY provide crisis resources
2. Encourage them to contact: National Suicide Prevention Lifeline: 988 (US)
3. Be direct: "Your safety is the most important thing"
4. Never minimize their pain
5. Suggest professional emergency help`;
    }

    // === ADD BOUNDARIES ===

    prompt += `

IMPORTANT BOUNDARIES:
- If asked for medical advice, say: "I'm not a doctor. Please consult a healthcare provider."
- If asked to diagnose: "Only licensed professionals can diagnose. Please see a doctor."
- Keep responses to 2-3 paragraphs for readability
- Never pretend to have personal experiences
- Be honest about your limitations as an AI`;

    return prompt;
  },

  /**
   * Get user's conversation history
   * @param {string} userId - ID of user
   * @param {number} limit - Number of messages to return (default 20)
   * @returns {Object} Array of messages in conversation
   */
  getConversationHistory: async (userId, limit = 20) => {
    try {
      // Fetch messages from database, sorted by most recent first
      const messages = await ChatMessage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      // Reverse to get chronological order
      messages.reverse();

      return {
        success: true,
        data: messages,
        count: messages.length,
        message: "Conversation history retrieved"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "HISTORY_ERROR"
      };
    }
  },

  /**
   * Clear user's conversation history
   * @param {string} userId - ID of user
   * @returns {Object} Confirmation of cleared history
   */
  clearConversationHistory: async (userId) => {
    try {
      // Delete all messages for this user
      const result = await ChatMessage.deleteMany({ userId });

      return {
        success: true,
        deletedCount: result.deletedCount,
        message: `Cleared ${result.deletedCount} messages from conversation history`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: "CLEAR_ERROR"
      };
    }
  }
};

// Export chat service
module.exports = chatService;