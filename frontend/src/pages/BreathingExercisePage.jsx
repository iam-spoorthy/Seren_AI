// ============================================================
// BREATHING EXERCISE PAGE - Crisis Calming Tool
// ============================================================
// Shown immediately after a HIGH/MODERATE risk assessment.
// Features an animated Buddha figure with:
//   - 4-count inhale (gradual, little by little)
//   - 4-second hold
//   - 8-count exhale (gradual, little by little)
//   - Buddha eyes OPEN during hold, CLOSED during breathing
//   - Breathing sound effects (air/whoosh)
//   - 4 complete cycles before showing "Continue" button
//
// BREATHING PATTERN: 4-4-8 technique
//   Inhale:  4 seconds (circle grows gradually)
//   Hold:    4 seconds (circle stays, eyes open)
//   Exhale:  8 seconds (circle shrinks gradually)
//   Total:   16 seconds per cycle × 4 cycles = 64 seconds
//
// SOUND: Uses Web Audio API to generate breathing sounds
//   - Inhale: rising white noise (air coming in)
//   - Exhale: falling white noise (air going out)
//   - Hold: silence
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// === BREATHING TIMING CONSTANTS (in seconds) ===
const INHALE_DURATION = 4;   // Breathe in for 4 seconds
const HOLD_DURATION = 4;     // Hold breath for 4 seconds
const EXHALE_DURATION = 8;   // Breathe out for 8 seconds
const TOTAL_CYCLES = 4;      // Complete 4 full breath cycles

// === PHASES ===
const PHASES = {
  IDLE: "idle",       // Before starting
  INHALE: "inhale",   // Breathing in
  HOLD: "hold",       // Holding breath
  EXHALE: "exhale",   // Breathing out
  DONE: "done",       // All cycles complete
};

export default function BreathingExercisePage() {
  const navigate = useNavigate();

  // === STATE ===
  const [phase, setPhase] = useState(PHASES.IDLE);      // Current breathing phase
  const [cycle, setCycle] = useState(0);                  // Current cycle (1-4)
  const [timer, setTimer] = useState(0);                  // Seconds remaining in phase
  const [progress, setProgress] = useState(0);            // 0-1 progress within phase
  const [circleScale, setCircleScale] = useState(0.6);    // Buddha circle size (0.6 = small, 1.0 = big)
  const [eyesOpen, setEyesOpen] = useState(false);        // Buddha eyes state

  // Refs for audio and animation
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const animationRef = useRef(null);
  const phaseStartRef = useRef(null);

  // === INITIALIZE WEB AUDIO API ===
  // Creates audio context for generating breathing sounds
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    // Create audio context
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;

    // Create white noise buffer (sounds like air/breathing)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Fill buffer with random noise (white noise)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Create noise source node
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Create gain node (volume control) — starts silent
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    // Create filter to make noise sound like breathing (bandpass)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 500;  // Center frequency
    filter.Q.value = 0.5;          // Bandwidth

    // Connect: noise → filter → gain → speakers
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    whiteNoise.start();

    noiseNodeRef.current = whiteNoise;
    gainNodeRef.current = gainNode;
  }, []);

  // === UPDATE BREATHING SOUND ===
  // Adjusts volume based on current phase and progress
  const updateSound = useCallback((currentPhase, currentProgress) => {
    if (!gainNodeRef.current || !audioContextRef.current) return;

    const gain = gainNodeRef.current.gain;
    const now = audioContextRef.current.currentTime;

    switch (currentPhase) {
      case PHASES.INHALE:
        // Gradually increase volume during inhale (air coming in)
        gain.setTargetAtTime(0.15 * currentProgress, now, 0.1);
        break;
      case PHASES.HOLD:
        // Silence during hold
        gain.setTargetAtTime(0, now, 0.1);
        break;
      case PHASES.EXHALE:
        // Gradually decrease volume during exhale (air going out)
        gain.setTargetAtTime(0.12 * (1 - currentProgress), now, 0.1);
        break;
      default:
        gain.setTargetAtTime(0, now, 0.1);
    }
  }, []);

  // === START BREATHING EXERCISE ===
  const startExercise = () => {
    initAudio();
    setCycle(1);
    startPhase(PHASES.INHALE);
  };

  // === START A NEW PHASE ===
  const startPhase = useCallback((newPhase) => {
    setPhase(newPhase);
    phaseStartRef.current = Date.now();

    // Set phase duration
    let duration;
    switch (newPhase) {
      case PHASES.INHALE: duration = INHALE_DURATION; break;
      case PHASES.HOLD: duration = HOLD_DURATION; break;
      case PHASES.EXHALE: duration = EXHALE_DURATION; break;
      default: return;
    }
    setTimer(duration);

    // Buddha eyes: OPEN during hold, CLOSED during inhale/exhale
    setEyesOpen(newPhase === PHASES.HOLD);
  }, []);

  // === ANIMATION LOOP ===
  // Runs every frame to update circle size, sound, and timer
  useEffect(() => {
    if (phase === PHASES.IDLE || phase === PHASES.DONE) return;

    let duration;
    switch (phase) {
      case PHASES.INHALE: duration = INHALE_DURATION; break;
      case PHASES.HOLD: duration = HOLD_DURATION; break;
      case PHASES.EXHALE: duration = EXHALE_DURATION; break;
      default: return;
    }

    const animate = () => {
      const elapsed = (Date.now() - phaseStartRef.current) / 1000;
      const prog = Math.min(elapsed / duration, 1);
      setProgress(prog);
      setTimer(Math.max(0, Math.ceil(duration - elapsed)));

      // Update circle scale based on phase
      switch (phase) {
        case PHASES.INHALE:
          // Grow from 0.6 to 1.0 gradually
          setCircleScale(0.6 + 0.4 * prog);
          break;
        case PHASES.HOLD:
          // Stay at full size
          setCircleScale(1.0);
          break;
        case PHASES.EXHALE:
          // Shrink from 1.0 to 0.6 gradually
          setCircleScale(1.0 - 0.4 * prog);
          break;
      }

      // Update breathing sound
      updateSound(phase, prog);

      // Check if phase is complete
      if (prog >= 1) {
        // Move to next phase
        if (phase === PHASES.INHALE) {
          startPhase(PHASES.HOLD);
        } else if (phase === PHASES.HOLD) {
          startPhase(PHASES.EXHALE);
        } else if (phase === PHASES.EXHALE) {
          // One cycle complete
          setCycle((prev) => {
            const next = prev + 1;
            if (next > TOTAL_CYCLES) {
              // All cycles done
              setPhase(PHASES.DONE);
              setEyesOpen(true);
              // Silence audio
              if (gainNodeRef.current && audioContextRef.current) {
                gainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
              }
              return prev;
            }
            // Start next cycle
            startPhase(PHASES.INHALE);
            return next;
          });
        }
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, updateSound, startPhase]);

  // === CLEANUP AUDIO ON UNMOUNT ===
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // === GET INSTRUCTION TEXT ===
  const getInstructionText = () => {
    switch (phase) {
      case PHASES.INHALE: return "Breathe In...";
      case PHASES.HOLD: return "Hold...";
      case PHASES.EXHALE: return "Breathe Out...";
      case PHASES.DONE: return "Well Done 🙏";
      default: return "Ready to begin";
    }
  };

  // === GET PHASE COLOR ===
  const getPhaseColor = () => {
    switch (phase) {
      case PHASES.INHALE: return "from-blue-400 to-cyan-400";
      case PHASES.HOLD: return "from-amber-400 to-yellow-300";
      case PHASES.EXHALE: return "from-purple-400 to-pink-400";
      default: return "from-emerald-400 to-teal-400";
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* === AMBIENT BACKGROUND PARTICLES === */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/10 animate-pulse"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              top: `${15 + i * 12}%`,
              left: `${10 + i * 14}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + i}s`,
            }}
          />
        ))}
      </div>

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 text-center max-w-lg w-full">

        {/* Header */}
        <h1 className="text-white text-2xl font-bold mb-2">
          {phase === PHASES.IDLE ? "🙏 Let's Calm Your Mind" : phase === PHASES.DONE ? "🙏 Namaste" : "🙏 Breathing Exercise"}
        </h1>
        <p className="text-purple-300 text-sm mb-8">
          {phase === PHASES.IDLE
            ? "A guided 4-4-8 breathing exercise to help you feel calm"
            : phase === PHASES.DONE
            ? "You completed the exercise. Take a moment before continuing."
            : `Cycle ${cycle} of ${TOTAL_CYCLES}`}
        </p>

        {/* === BUDDHA FIGURE === */}
        {/* Central animated circle with Buddha character */}
        <div className="relative mx-auto mb-8" style={{ width: "280px", height: "280px" }}>

          {/* Outer glow ring — pulses with breathing */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${getPhaseColor()} opacity-20 blur-xl transition-transform duration-300`}
            style={{ transform: `scale(${circleScale * 1.3})` }}
          />

          {/* Middle ring */}
          <div
            className={`absolute inset-4 rounded-full bg-gradient-to-r ${getPhaseColor()} opacity-10 transition-transform duration-300`}
            style={{ transform: `scale(${circleScale * 1.1})` }}
          />

          {/* === BUDDHA CIRCLE === */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-150 ease-out"
            style={{ transform: `scale(${circleScale})` }}
          >
            <div className="w-56 h-56 rounded-full bg-gradient-to-br from-amber-200 via-amber-100 to-yellow-50 shadow-2xl flex flex-col items-center justify-center border-4 border-amber-300/50">

              {/* Buddha Face */}
              <div className="relative" style={{ fontSize: "0" }}>

                {/* === EYES === */}
                {/* Open during HOLD phase, closed during INHALE/EXHALE */}
                <div className="flex gap-8 mb-3">
                  {/* Left eye */}
                  <div className="relative">
                    {eyesOpen ? (
                      // OPEN EYE — during hold (awareness, presence)
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    ) : (
                      // CLOSED EYE — during breathing (meditation)
                      <div className="w-8 h-1 bg-slate-700 rounded-full mt-2" style={{ borderRadius: "0 0 50% 50%" }}></div>
                    )}
                  </div>
                  {/* Right eye */}
                  <div className="relative">
                    {eyesOpen ? (
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    ) : (
                      <div className="w-8 h-1 bg-slate-700 rounded-full mt-2" style={{ borderRadius: "0 0 50% 50%" }}></div>
                    )}
                  </div>
                </div>

                {/* Nose — small dot */}
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto mb-2"></div>

                {/* === MOUTH === */}
                {/* Changes with breathing phase */}
                <div className="flex justify-center">
                  {phase === PHASES.INHALE ? (
                    // Inhaling — small open mouth
                    <div className="w-4 h-4 rounded-full border-2 border-slate-600 bg-slate-700/30"></div>
                  ) : phase === PHASES.EXHALE ? (
                    // Exhaling — open wider
                    <div className="w-6 h-5 rounded-full border-2 border-slate-600 bg-slate-700/30"></div>
                  ) : (
                    // Hold / idle / done — gentle smile
                    <div className="w-10 h-1 bg-slate-600 rounded-full" style={{ borderRadius: "0 0 50% 50%", height: "4px" }}></div>
                  )}
                </div>
              </div>

              {/* Lotus emoji at bottom */}
              <p className="text-2xl mt-4">🪷</p>
            </div>
          </div>
        </div>

        {/* === INSTRUCTION TEXT === */}
        <div className="mb-6">
          <p className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getPhaseColor()} mb-2`}>
            {getInstructionText()}
          </p>
          {phase !== PHASES.IDLE && phase !== PHASES.DONE && (
            <p className="text-white text-5xl font-mono font-bold">{timer}</p>
          )}
        </div>

        {/* === PROGRESS DOTS (4 cycles) === */}
        {phase !== PHASES.IDLE && (
          <div className="flex justify-center gap-3 mb-8">
            {[...Array(TOTAL_CYCLES)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i + 1 < cycle || phase === PHASES.DONE
                    ? "bg-emerald-400 scale-110"  // Completed cycle
                    : i + 1 === cycle
                    ? "bg-purple-400 animate-pulse" // Current cycle
                    : "bg-white/20"                 // Future cycle
                }`}
              />
            ))}
          </div>
        )}

        {/* === START / CONTINUE BUTTONS === */}
        {phase === PHASES.IDLE && (
          <button
            onClick={startExercise}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            🧘 Begin Breathing Exercise
          </button>
        )}

        {phase === PHASES.DONE && (
          <div className="space-y-4">
            <p className="text-emerald-300 text-sm mb-4">
              You completed {TOTAL_CYCLES} breathing cycles. Feel the calm.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setPhase(PHASES.IDLE);
                  setCycle(0);
                  setCircleScale(0.6);
                  setEyesOpen(false);
                }}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-all"
              >
                🔄 Repeat
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Continue to Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* === CRISIS RESOURCES === */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-4 text-xs text-purple-300">
          <p className="font-medium text-white mb-2">📞 You're not alone — reach out anytime:</p>
          <div className="space-y-1">
            <p>988 Suicide & Crisis Lifeline: <span className="text-white font-medium">Call or text 988</span></p>
            <p>Crisis Text Line: <span className="text-white font-medium">Text HOME to 741741</span></p>
            <p>SAMHSA Helpline: <span className="text-white font-medium">1-800-662-4357</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
