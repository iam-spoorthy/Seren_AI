// ============================================================
// CHAT PAGE - AI Therapist with ElevenLabs Voice Agent
// ============================================================
// Uses ElevenLabs Conversational AI <elevenlabs-convai> widget
// which provides the FULL experience:
//   - Real-time 2-way voice (user speaks + agent speaks)
//   - Built-in avatar/orb visualization
//   - Automatic language detection
//   - No API key needed — just Agent ID
//
// LAYOUT:
//   Left (40%): Chat transcript with text messages
//   Right (60%): ElevenLabs widget with avatar + voice
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// === ELEVENLABS AGENT ID ===
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_1801khjj171qegrvbqxzqvcmzm2t";

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // === STATE ===
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // === LOAD HISTORY + WIDGET SCRIPT ===
  useEffect(() => {
    loadHistory();

    // Load the ElevenLabs Conversational AI widget script
    // This registers the <elevenlabs-convai> custom element
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.onload = () => setWidgetReady(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // === AUTO-SCROLL ===
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // === LOAD CHAT HISTORY ===
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await chatAPI.getHistory(50);
      if (result.success) {
        setMessages(
          result.data.map((msg) => ({
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
    setHistoryLoading(false);
  };

  // === SEND TEXT MESSAGE ===
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    // Add user message to the UI immediately
    const userMsg = { role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSending(true);

    try {
      const result = await chatAPI.sendMessage(text);
      if (result.success) {
        const aiMsg = {
          role: "assistant",
          content: result.data.aiResponse,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMsg = {
        role: "assistant",
        content: "Sorry, I couldn't process your message. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  // === HANDLE ENTER KEY ===
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* === HEADER === */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">SerenAI Voice Therapist</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-white/70 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* === 2-COLUMN LAYOUT === */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

        {/* === LEFT: TRANSCRIPT (40%) === */}
        <div className="w-2/5 flex flex-col border-r border-gray-200 bg-white">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-700 text-sm">💬 Chat with SerenAI</h2>
            <p className="text-xs text-gray-400">Type a message or use voice on the right</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-gray-400 text-sm">Start a conversation below</p>
                  <p className="text-gray-300 text-xs mt-1">Type a message to begin chatting with SerenAI</p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    <p className="text-xs font-medium mb-0.5 opacity-70">
                      {msg.role === "user" ? "You" : "SerenAI"}
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-xl text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span className="text-xs">SerenAI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* === TEXT INPUT === */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={sending}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ maxHeight: "120px", minHeight: "42px" }}
                onInput={(e) => {
                  e.target.style.height = "42px";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || sending}
                className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  "Send"
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>

        {/* === RIGHT: ELEVENLABS AGENT (60%) === */}
        <div className="w-3/5 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center relative">

          {/* Background ambient glow */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          {/* Agent content */}
          <div className="relative z-10 text-center space-y-6 w-full h-full flex flex-col items-center justify-center p-8">

            {/* Title */}
            <div>
              <h2 className="text-white text-xl font-bold mb-1">Voice Therapy Session</h2>
              <p className="text-purple-300 text-sm">Click the orb below to start speaking</p>
            </div>

            {/* === ELEVENLABS WIDGET === */}
            {/* The <elevenlabs-convai> web component renders a full */}
            {/* interactive voice agent with built-in avatar/orb.    */}
            {/* Just pass agent-id and it handles everything:        */}
            {/*   - Microphone access                                */}
            {/*   - Real-time voice recognition                      */}
            {/*   - AI response generation                          */}
            {/*   - Text-to-speech playback                         */}
            {/*   - Visual orb animation (speaking/listening)       */}
            <div className="flex-1 flex items-center justify-center w-full max-w-lg">
              {widgetReady ? (
                <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
              ) : (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                  <p className="text-purple-300 text-sm">Loading voice agent...</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md text-sm text-purple-200">
              <p className="font-medium text-white mb-2">💡 How to use:</p>
              <ul className="space-y-1 text-left text-xs">
                <li>• Click the orb/avatar to start the conversation</li>
                <li>• Speak naturally — English, Hindi, Telugu, or Tamil</li>
                <li>• The agent listens fully before responding</li>
                <li>• Take your time — silence is okay</li>
              </ul>
            </div>

            {/* Crisis note */}
            <p className="text-purple-400/60 text-xs">
              ⚕️ Not a substitute for professional care. Crisis? Call 988
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
