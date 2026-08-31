"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import HumanAvatar from "@/components/HumanAvatar";
import { useVoiceTherapist } from "@/hooks/useVoiceTherapist";
import { logCompletedSession, signInAndClaimSession, auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  HeartPulse, Mic, MicOff, Send, RotateCcw, ShieldCheck,
  ArrowLeft, Volume2, Activity, Flame, Smartphone, Sparkles,
  LogIn, Check, ArrowRight
} from "lucide-react";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

type SessionPhase = "calibrate" | "active" | "rate_post" | "done";

const AVAILABLE_TRIGGERS = [
  { id: "Substance Craving", label: "Substance Urge", icon: Flame },
  { id: "Panic & Anxiety", label: "Panic & Anxiety", icon: Activity },
  { id: "Screen Compulsion", label: "Screen Doomscroll", icon: Smartphone },
  { id: "Binge Eating", label: "Binge / Food Urge", icon: Sparkles },
  { id: "Anger & Frustration", label: "Anger / Stress", icon: HeartPulse },
];

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const triggerFromUrl = searchParams.get("trigger") || "Substance Craving";

  const [phase, setPhase] = useState<SessionPhase>("calibrate");
  const [selectedTrigger, setSelectedTrigger] = useState(triggerFromUrl);
  const [preScore, setPreScore] = useState(7);
  const [postScore, setPostScore] = useState(3);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Firebase session logging & Auth states
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    isSpeaking,
    isListening,
    transcript,
    hasMicPermission,
    requestMicAccess,
    startListening,
    stopListening,
    speak,
    speakStream,
    terminateAllAudio,
  } = useVoiceTherapist((finalSpeech) => {
    handleSendMessage(finalSpeech);
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync trigger from URL
  useEffect(() => {
    if (triggerFromUrl) {
      setSelectedTrigger(triggerFromUrl);
    }
  }, [triggerFromUrl]);

  // Auto-scroll chat to bottom smoothly
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  // Guaranteed immediate audio & mic cancellation on unmount or page change
  useEffect(() => {
    return () => {
      terminateAllAudio();
    };
  }, [terminateAllAudio]);

  // Immediate termination when user clicks "Exit Session" without saving
  const handleExitSession = () => {
    terminateAllAudio();
    router.push("/");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedHistory: Message[] = [...messages, userMessage];

    const assistantIndex = updatedHistory.length;
    setMessages([...updatedHistory, { role: "assistant", content: "" }]);
    setInputVal("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          trigger: selectedTrigger || "Substance Craving",
          preScore: preScore || 5,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Chat stream failed");
      }

      await speakStream(
        res.body,
        (updatedText) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = { role: "assistant", content: updatedText };
            }
            return next;
          });
        },
        (finalFullText, shouldEnd) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = { role: "assistant", content: finalFullText };
            }
            return next;
          });
          if (shouldEnd) {
            endSession();
          } else {
            startListening();
          }
        }
      );
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackText = "I hear you. Take another deep nasal inhale... and release slowly. You are doing great.";
      setMessages((prev) => {
        const next = [...prev];
        if (next[assistantIndex]) {
          next[assistantIndex] = { role: "assistant", content: fallbackText };
        }
        return next;
      });
      speak(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  const beginTherapy = async () => {
    setPhase("active");
    const initialGreeting = `I'm right here with you. Let's calm this ${selectedTrigger} together. Take a slow, deep breath... and tell me how you feel.`;
    
    setMessages([{ role: "assistant", content: initialGreeting }]);
    
    try {
      await requestMicAccess();
      startListening();
    } catch (e) {
      console.warn("Microphone access declined or unavailable.");
    }

    speak(initialGreeting, () => {
      startListening();
    });
  };

  const endSession = async () => {
    terminateAllAudio();
    setPhase("rate_post");
  };

  const handleFinishEvaluation = async () => {
    const reduction = Math.max(0, Math.round(((preScore - postScore) / preScore) * 100));

    const docId = await logCompletedSession({
      trigger: selectedTrigger || "General Urge",
      preScore,
      postScore,
      reductionPercent: reduction,
    });

    setSavedSessionId(docId);
    setPhase("done");
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    const user = await signInAndClaimSession(savedSessionId);
    if (user) {
      setCurrentUser(user);
    }
    setAuthLoading(false);
  };

  const urgeReduction = Math.max(0, Math.round(((preScore - postScore) / preScore) * 100));

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0E0E11] text-zinc-100 font-sans flex flex-col overflow-hidden select-none selection:bg-amber-500/30">
      
      {/* 1. Fixed Top Header */}
      <header className="shrink-0 h-14 sm:h-16 bg-[#0E0E11]/90 backdrop-blur-xl border-b border-zinc-800/80 z-30 px-4 sm:px-8 flex items-center justify-between">
        <button
          onClick={handleExitSession}
          className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm font-medium focus:outline-none"
        >
          <ArrowLeft size={16} />
          <span>Exit Session</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
            <HeartPulse size={15} />
          </div>
          <span className="font-semibold text-sm sm:text-base text-zinc-100 tracking-tight">
            Mind<span className="text-amber-400">Reset</span>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase tracking-wider">
          <span className={`w-2 h-2 rounded-full ${phase === "active" ? "bg-amber-400 animate-pulse" : "bg-zinc-600"}`} />
          <span className="hidden sm:inline">
            {phase === "calibrate" && "Calibration"}
            {phase === "active" && "Active Session"}
            {phase === "rate_post" && "Post-Assessment"}
            {phase === "done" && "Verified Relief"}
          </span>
        </div>
      </header>

      {/* 2. Main Viewport Enclosed Container: Strictly Non-Scrolling Outer Workspace */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto p-2.5 sm:p-4 lg:p-6 flex flex-col justify-center overflow-hidden">
        <div className="w-full h-full min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-2.5 sm:gap-3.5 lg:gap-6 items-stretch overflow-hidden">
          
          {/* LEFT COLUMN: Doctor Avatar Studio (Tight & Consistent Across All Screens) */}
          <section className="h-[36%] sm:h-[38%] lg:h-full lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-[#16161A] via-[#121216] to-[#0E0E11] border border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-xl relative overflow-hidden shrink-0">
            {/* Ambient Breathing Halo Glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              animate={{
                backgroundColor: isSpeaking
                  ? "rgba(245, 158, 11, 0.12)"
                  : "rgba(245, 158, 11, 0.03)",
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {/* Status Header Pill */}
            <div className="relative z-10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md">
                <span className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-amber-400 animate-pulse" : "bg-amber-500"}`} />
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-200">
                  {isSpeaking ? "Dr. Marcus • Active Guidance" : "Dr. Marcus • Clinical AI"}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-amber-400/80 uppercase tracking-wider">
                Somatic Edge
              </span>
            </div>

            {/* Avatar Stage: Uniform Proportional Stage */}
            <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center py-1 overflow-hidden">
              <HumanAvatar isSpeaking={isSpeaking} hideBadge={true} />
            </div>

            {/* Audio Wave & State Indicator */}
            <div className="relative z-10 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] sm:text-xs text-zinc-400 shrink-0">
              <div className="flex items-center gap-1.5">
                {isSpeaking ? (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px] sm:text-xs">
                    <Volume2 size={14} className="animate-pulse shrink-0" />
                    <span className="truncate">Speaking grounding steps...</span>
                  </span>
                ) : isListening ? (
                  <span className="flex items-center gap-1.5 text-rose-400 font-medium text-[11px] sm:text-xs animate-pulse">
                    <Mic size={14} className="shrink-0" />
                    <span>Listening to you...</span>
                  </span>
                ) : (
                  <span className="text-[11px] sm:text-xs text-zinc-400 truncate">
                    Target: <strong className="text-zinc-200">{selectedTrigger}</strong>
                  </span>
                )}
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-zinc-500 shrink-0">Live Feedback</span>
            </div>
          </section>

          {/* RIGHT COLUMN: Clinical Console */}
          <section className={`lg:col-span-7 flex flex-col ${phase === "calibrate" ? "h-auto justify-start" : "flex-1 min-h-0 h-full justify-between"} bg-[#16161A] border border-zinc-800 rounded-3xl p-4 sm:p-5 lg:p-6 backdrop-blur-xl shadow-xl overflow-hidden`}>
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Pre-Urge Calibration (Harmonious & Beautifully Spaced) */}
              {phase === "calibrate" && (
                <motion.div
                  key="calibrate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col justify-start space-y-3.5 sm:space-y-4 lg:h-full lg:justify-between"
                >
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                      <Activity size={13} /> Intake Calibration
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-100 tracking-tight">
                      What are you experiencing?
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Choose your trigger category and baseline intensity level.
                    </p>
                  </div>

                  {/* Trigger Selection Grid */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-zinc-500">
                      Select Trigger:
                    </span>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {AVAILABLE_TRIGGERS.map((t) => {
                        const isSelected = selectedTrigger === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTrigger(t.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-left ${
                              isSelected
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                                : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
                            }`}
                          >
                            <t.icon size={14} className={`shrink-0 ${isSelected ? "text-amber-400" : "text-zinc-500"}`} />
                            <span className="truncate">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Urge Intensity Meter */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1C1D22] border border-zinc-800/80 space-y-2 text-center">
                    <div>
                      <div className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono tracking-tight">
                        {preScore} <span className="text-sm text-zinc-500 font-normal">/ 10</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5 font-medium">
                        Urge Intensity (1 = mild, 10 = acute peak)
                      </div>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={preScore}
                      onChange={(e) => setPreScore(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  {/* Primary CTA */}
                  <button
                    onClick={beginTherapy}
                    className="w-full py-3.5 bg-[#FF8811] hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl transition-all shadow-[0_4px_25px_rgba(255,136,17,0.25)] text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
                  >
                    <span>Start Guided Voice Session</span>
                    <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Active Therapy Session (STRICT INTERNAL SCROLL ONLY) */}
              {phase === "active" && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 min-h-0 h-full flex flex-col justify-between overflow-hidden space-y-2.5"
                >
                  {/* Console Top Bar: Urge Score + Wrap Up Action */}
                  <div className="shrink-0 flex items-center justify-between pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">Session Stream</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                        {selectedTrigger} &bull; {preScore}/10
                      </span>
                    </div>
                    <button
                      onClick={endSession}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-3 py-1 rounded-xl"
                    >
                      <span>Wrap Up</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Strict Fixed Height Scrollable Chat Container (Only This Scrolls) */}
                  <div className="flex-1 min-h-0 overflow-y-auto bg-[#1C1D22] border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 space-y-3 pr-2 scrollbar-thin">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic">
                        Connecting to Dr. Marcus...
                      </div>
                    ) : (
                      messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] font-mono text-zinc-500 mb-1 px-1">
                            {m.role === "user" ? "You" : "Dr. Marcus"}
                          </span>
                          <div
                            className={`max-w-[88%] rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed ${
                              m.role === "user"
                                ? "bg-amber-500/15 text-amber-100 border border-amber-500/25 rounded-tr-none shadow-sm"
                                : "bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tl-none font-light shadow-sm"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))
                    )}
                    {isListening && transcript && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-amber-400 mb-1 animate-pulse px-1">Transcribing...</span>
                        <div className="max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed bg-amber-500/10 text-amber-300 border border-amber-500/20 italic">
                          &ldquo;{transcript}&rdquo;
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Fixed Bottom Input Bar: Always Visible On-Screen */}
                  <div className="shrink-0 space-y-1.5 pt-1">
                    <div className="flex gap-2">
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all shrink-0 ${
                          isListening
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        }`}
                        title={isListening ? "Mute Microphone" : "Speak to Dr. Marcus"}
                      >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>
                      <input
                        type="text"
                        placeholder={isListening ? "Listening to your voice..." : "Speak aloud or type here..."}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 min-w-0 bg-[#1C1D22] border border-zinc-800 rounded-2xl px-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading}
                        className="p-3 sm:p-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl font-bold transition-all disabled:opacity-40 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      >
                        <Send size={17} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 px-1 font-mono">
                      <span>Mic: {hasMicPermission ? "Connected" : "Standby"}</span>
                      <span>Speak naturally or type anytime</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Post-Urge Re-Assessment */}
              {phase === "rate_post" && (
                <motion.div
                  key="rate_post"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 min-h-0 h-full flex flex-col justify-between overflow-y-auto space-y-4 pr-1 scrollbar-thin"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">Clinical Re-Assessment</span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-100 tracking-tight">How strong is the urge now?</h2>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Check your physiological state. Slide to record your post-session intensity.
                    </p>
                  </div>

                  <div className="p-4 sm:p-6 rounded-2xl bg-[#1C1D22] border border-zinc-800/80 space-y-3 text-center my-auto">
                    <div className="text-5xl sm:text-6xl font-extrabold text-amber-400 font-mono tracking-tight">
                      {postScore} <span className="text-sm text-zinc-500 font-normal">/ 10</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Rate your updated tension level
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={postScore}
                      onChange={(e) => setPostScore(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  <button
                    onClick={handleFinishEvaluation}
                    className="w-full py-3.5 sm:py-4 bg-[#FF8811] hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl transition-all shadow-[0_4px_25px_rgba(255,136,17,0.25)] text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
                  >
                    <span>Generate Verified Relief Summary</span>
                    <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* STEP 4: Somatic Verification & Streak Claiming Card */}
              {phase === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 min-h-0 h-full flex flex-col justify-between overflow-y-auto space-y-3.5 text-center pr-1 scrollbar-thin"
                >
                  <div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 mb-1">
                      <ShieldCheck size={22} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-100">Somatic Relief Verified</h2>
                    <p className="text-[11px] sm:text-xs text-zinc-400 font-mono mt-0.5">{selectedTrigger}</p>
                  </div>

                  {/* Pre/Post Urge Metrics Delta */}
                  <div className="grid grid-cols-3 gap-2 p-3 border border-zinc-800 bg-[#1C1D22] rounded-2xl font-mono">
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Pre-Urge</div>
                      <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-0.5">{preScore}/10</div>
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Post-Urge</div>
                      <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-0.5">{postScore}/10</div>
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Relief</div>
                      <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-0.5">{urgeReduction}%</div>
                    </div>
                  </div>

                  {/* Streak Claiming Box */}
                  {!currentUser ? (
                    <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 text-left">
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-amber-400 shrink-0" />
                          <span>Save this session to your streak?</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">
                          Sign in with Google to log recovery trends, or continue as guest to stay anonymous.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={authLoading}
                          className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <LogIn size={13} />
                          <span>{authLoading ? "Linking..." : "Sign In with Google"}</span>
                        </button>
                        <button
                          onClick={() => { setMessages([]); setPhase("calibrate"); }}
                          className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-xl transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-center gap-1.5">
                      <Check size={14} />
                      <span className="truncate">Saved to account: {currentUser.email}</span>
                    </div>
                  )}

                  {/* Footer Navigation Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={() => { setMessages([]); setPhase("calibrate"); }}
                      className="flex-1 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} /> Try Another
                    </button>
                    <Link
                      href="/"
                      className="flex-1 py-2.5 sm:py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    >
                      <ArrowLeft size={14} /> Back to Home
                    </Link>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </section>

        </div>
      </main>

    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0E0E11] flex items-center justify-center">
        <div className="text-amber-400 font-mono text-sm animate-pulse">Connecting to Dr. Marcus...</div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
