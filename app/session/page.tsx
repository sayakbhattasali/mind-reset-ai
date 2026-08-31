"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
  } = useVoiceTherapist((finalSpeech) => {
    handleSendMessage(finalSpeech);
  });

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

      if (!res.body) {
        throw new Error("No response body");
      }

      setIsLoading(false);

      await speakStream(
        res.body,
        (currentText) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = { role: "assistant", content: currentText };
            }
            return next;
          });
        },
        (finalText, shouldEnd) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = { role: "assistant", content: finalText };
            }
            return next;
          });
          if (shouldEnd) {
            setTimeout(() => {
              setPhase("rate_post");
            }, 800);
          } else {
            startListening();
          }
        }
      );
    } catch (err) {
      console.error("Client send error:", err);
      const fallbackMsg = "Take a slow, grounding breath. I am right here with you.";
      setMessages([...updatedHistory, { role: "assistant", content: fallbackMsg }]);
      speak(fallbackMsg, () => {
        startListening();
      });
    } finally {
      setIsLoading(false);
    }
  };

  const beginTherapy = async () => {
    await requestMicAccess();
    setPhase("active");
    setIsLoading(false);

    const openingLine = "I'm right here. Take a breath, let your shoulders drop, and please tell me how you feel.";
    setMessages([{ role: "assistant", content: openingLine }]);

    if (typeof speak === "function") {
      speak(openingLine, () => {
        if (typeof startListening === "function") startListening();
      });
    }
  };

  const endSession = async () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();
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
    <div className="h-screen bg-[#0E0E11] text-zinc-100 font-sans flex flex-col overflow-hidden selection:bg-amber-500/30">
      
      {/* Top Header */}
      <header className="shrink-0 h-16 bg-[#0E0E11]/90 backdrop-blur-xl border-b border-zinc-800/80 z-30 px-4 sm:px-8 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm font-medium"
        >
          <ArrowLeft size={16} />
          <span>Exit Session</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
            <HeartPulse size={16} />
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

      {/* Modern 2-Column Split Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 flex items-center justify-center overflow-hidden">
        <div className="w-full h-[82vh] max-h-[750px] grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT COLUMN: Avatar Studio */}
          <section className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-[#16161A] via-[#121216] to-[#0E0E11] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Somatic Ambient Breathing Halo Glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              animate={{
                backgroundColor: isSpeaking
                  ? "rgba(245, 158, 11, 0.12)"
                  : "rgba(245, 158, 11, 0.03)",
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {/* Status Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md">
                <span className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-amber-400 animate-pulse" : "bg-amber-500"}`} />
                <span className="text-xs font-semibold text-zinc-200">
                  {isSpeaking ? "Dr. Marcus • Active Guidance" : "Dr. Marcus • Clinical AI"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider">
                Somatic Edge
              </span>
            </div>

            {/* Center Avatar Viewport */}
            <div className="relative z-10 my-auto flex items-center justify-center h-[250px] sm:h-[280px]">
              <HumanAvatar isSpeaking={isSpeaking} hideBadge={true} />
            </div>

            {/* Audio Wave & State Indicator */}
            <div className="relative z-10 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium text-xs">
                    <Volume2 size={15} className="animate-pulse" />
                    <span>Speaking grounding steps...</span>
                  </span>
                ) : isListening ? (
                  <span className="flex items-center gap-1.5 text-rose-400 font-medium text-xs animate-pulse">
                    <Mic size={15} />
                    <span>Listening to you...</span>
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">
                    Target: <strong className="text-zinc-200">{selectedTrigger}</strong>
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] text-zinc-500">Live Feedback</span>
            </div>
          </section>

          {/* RIGHT COLUMN: Dedicated Clinical Console */}
          <section className="lg:col-span-7 flex flex-col justify-between bg-[#16161A] border border-zinc-800 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Pre-Urge Calibration with Session Type Selector */}
              {phase === "calibrate" && (
                <motion.div
                  key="calibrate"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between h-full space-y-4 overflow-y-auto pr-1"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                      <Activity size={14} /> Intake Calibration
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                      What are you experiencing?
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Choose your trigger category and baseline intensity level.
                    </p>
                  </div>

                  {/* Trigger Type Selector Pills */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-zinc-500">
                      Select Trigger Category:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TRIGGERS.map((t) => {
                        const isSelected = selectedTrigger === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTrigger(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
                            }`}
                          >
                            <t.icon size={13} className={isSelected ? "text-amber-400" : "text-zinc-500"} />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Urge Intensity Meter */}
                  <div className="p-4 rounded-2xl bg-[#1C1D22] border border-zinc-800/80 space-y-3">
                    <div className="text-center py-2">
                      <div className="text-5xl font-extrabold text-amber-400 font-mono tracking-tight">
                        {preScore} <span className="text-sm text-zinc-500 font-normal">/ 10</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
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

                  <button
                    onClick={beginTherapy}
                    className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-2xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.15)] text-base active:scale-[0.99]"
                  >
                    Start Guided Voice Session
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Active Therapy (Live Streaming Console) */}
              {phase === "active" && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between h-full overflow-hidden space-y-3"
                >
                  {/* Console Top Bar: Urge Score Meter + Quick Conclude */}
                  <div className="shrink-0 flex items-center justify-between pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">Session Stream</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {selectedTrigger} &bull; {preScore}/10
                      </span>
                    </div>
                    <button
                      onClick={endSession}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                    >
                      <span>Wrap Up Session</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Scrollable Conversation Stream with Auto-Scroll */}
                  <div className="flex-1 bg-[#1C1D22] border border-zinc-800/80 rounded-2xl p-4 overflow-y-auto space-y-3 min-h-0 pr-2">
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
                            className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
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
                        <div className="max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed bg-amber-500/10 text-amber-300 border border-amber-500/20 italic">
                          &ldquo;{transcript}&rdquo;
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Bottom Console: Audio/Mic Status + Text/Voice Input Bar */}
                  <div className="shrink-0 space-y-2 pt-1">
                    <div className="flex gap-2">
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`p-3.5 rounded-2xl border transition-all shrink-0 ${
                          isListening
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        }`}
                        title={isListening ? "Mute Microphone" : "Speak to Dr. Marcus"}
                      >
                        {isListening ? <MicOff size={19} /> : <Mic size={19} />}
                      </button>
                      <input
                        type="text"
                        placeholder={isListening ? "Listening to your voice..." : "Speak aloud or type your thoughts..."}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 min-w-0 bg-[#1C1D22] border border-zinc-800 rounded-2xl px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading}
                        className="p-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl font-bold transition-all disabled:opacity-40 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      >
                        <Send size={18} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 px-1 font-mono">
                      <span>Mic Status: {hasMicPermission ? "Connected" : "Standby"}</span>
                      <span>Speak naturally or type anytime</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Post-Urge Re-Assessment */}
              {phase === "rate_post" && (
                <motion.div
                  key="rate_post"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between h-full space-y-4"
                >
                  <div>
                    <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">Clinical Re-Assessment</span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 mt-1 tracking-tight">How strong is the urge now?</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Check your physiological state. Slide to record your post-session intensity.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#1C1D22] border border-zinc-800/80 space-y-4 text-center my-auto">
                    <div className="text-6xl font-extrabold text-amber-400 font-mono tracking-tight">
                      {postScore} <span className="text-base text-zinc-500 font-normal">/ 10</span>
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
                    className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-2xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.15)] text-base active:scale-[0.99]"
                  >
                    Generate Verified Relief Summary
                  </button>
                </motion.div>
              )}

              {/* STEP 4: Somatic Verification & Streak Claiming Card */}
              {phase === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col justify-between h-full space-y-4 text-center overflow-y-auto pr-1"
                >
                  <div>
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 mb-1">
                      <ShieldCheck size={26} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">Somatic Relief Verified</h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedTrigger}</p>
                  </div>

                  {/* Pre/Post Urge Metrics Delta */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3.5 border border-zinc-800 bg-[#1C1D22] rounded-2xl font-mono">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">Pre-Urge</div>
                      <div className="text-2xl font-bold text-rose-400 mt-0.5">{preScore}/10</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">Post-Urge</div>
                      <div className="text-2xl font-bold text-amber-400 mt-0.5">{postScore}/10</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">Relief</div>
                      <div className="text-2xl font-bold text-amber-300 mt-0.5">{urgeReduction}%</div>
                    </div>
                  </div>

                  {/* Streak Claiming Box */}
                  {!currentUser ? (
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-left">
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-400" />
                          Save this session to your streak?
                        </div>
                        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                          Sign in with Google to log recovery trends, or continue as guest to stay anonymous.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={authLoading}
                          className="flex-1 py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <LogIn size={14} />
                          <span>{authLoading ? "Linking..." : "Sign In with Google"}</span>
                        </button>
                        <button
                          onClick={() => { setMessages([]); setPhase("calibrate"); }}
                          className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-xl transition-all"
                        >
                          Ignore &amp; Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-center gap-2">
                      <Check size={16} />
                      <span className="truncate">Saved to account: {currentUser.email}</span>
                    </div>
                  )}

                  {/* Footer Navigation Actions */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      onClick={() => { setMessages([]); setPhase("calibrate"); }}
                      className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={15} /> Try Another Session
                    </button>
                    <Link
                      href="/"
                      className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    >
                      <ArrowLeft size={15} /> Back to Home
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
