"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { Volume2, VolumeX, Sparkles, MessageSquare } from "lucide-react";
import type { Protocol, Step } from "@/lib/protocols";
import { speechEngine } from "@/lib/speech";

interface SessionGuideProps {
  protocol: Protocol;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onSessionComplete: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function SessionGuide({
  protocol,
  currentStepIndex,
  onStepChange,
  onSessionComplete,
  isMuted,
  onToggleMute,
}: SessionGuideProps) {
  const [stepProgress, setStepProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const animRef = useRef<number | null>(null);
  const stepStartRef = useRef<number>(performance.now());

  const currentStep: Step = protocol.steps[currentStepIndex] || protocol.steps[0];
  const isLastStep = currentStepIndex === protocol.steps.length - 1;

  // Speak the step when stepIndex changes or unmuted
  useEffect(() => {
    if (!isMuted && currentStep?.spokenText) {
      speechEngine.speak(
        currentStep.spokenText,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } else {
      speechEngine.stop();
      setIsSpeaking(false);
    }

    return () => {
      speechEngine.stop();
      setIsSpeaking(false);
    };
  }, [currentStepIndex, isMuted, currentStep?.spokenText]);

  // Advance steps based on duration timers
  const advanceStep = useCallback(() => {
    if (isLastStep) {
      speechEngine.stop();
      onSessionComplete();
    } else {
      const nextIndex = currentStepIndex + 1;
      onStepChange(nextIndex);
      setStepProgress(0);
      stepStartRef.current = performance.now();
    }
  }, [isLastStep, currentStepIndex, onStepChange, onSessionComplete]);

  // Step timer & progress animation
  useEffect(() => {
    stepStartRef.current = performance.now();
    const durationMs = (currentStep.duration || 20) * 1000;

    const tick = (now: number) => {
      const elapsed = now - stepStartRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      setStepProgress(progress);

      if (progress >= 1) {
        advanceStep();
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentStepIndex, currentStep.duration, advanceStep]);

  // Total session elapsed tracker
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalDuration = protocol.steps.reduce((acc, s) => acc + s.duration, 0);
  const remainingSeconds = Math.max(0, totalDuration - totalElapsed);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecs = remainingSeconds % 60;
  const stepTimeRemaining = Math.ceil(currentStep.duration * (1 - stepProgress));

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Step Progress Segmented Bar */}
      <div className="flex items-center gap-1.5">
        {protocol.steps.map((step, idx) => (
          <div key={idx} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-amber-400"
              initial={{ width: "0%" }}
              animate={{
                width:
                  idx < currentStepIndex
                    ? "100%"
                    : idx === currentStepIndex
                    ? `${stepProgress * 100}%`
                    : "0%",
              }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      {/* Session Status & Voice Toggle Bar */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-medium text-zinc-300">
            {currentStep.stage} ({currentStepIndex + 1}/{protocol.steps.length})
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
              Speaking
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="tabular-nums text-zinc-500 font-mono">
            {remainingMinutes}:{remainingSecs.toString().padStart(2, "0")} remaining
          </span>
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800"
            title={isMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
          >
            {isMuted ? <VolumeX size={13} className="text-zinc-500" /> : <Volume2 size={13} className="text-amber-400" />}
            <span className="text-[10px]">{isMuted ? "Muted" : "Voice On"}</span>
          </button>
        </div>
      </div>

      {/* Step Guidance Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-[#16161A] border border-zinc-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-3 relative overflow-hidden"
        >
          {/* Top Stage Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                <Sparkles size={14} />
              </div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                {currentStep.stage}
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-mono tabular-nums">
              {stepTimeRemaining}s
            </span>
          </div>

          {/* Spoken Voice Text */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1C1D22] border border-zinc-800/80">
            <MessageSquare size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic">
              &ldquo;{currentStep.spokenText}&rdquo;
            </p>
          </div>

          {/* Direct Actionable UI Prompt */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-0.5 font-mono">
              Action Prompt
            </div>
            <div className="text-xs sm:text-sm font-medium text-zinc-100">
              {currentStep.uiPrompt}
            </div>
          </div>

          {/* Step Progress Line */}
          <div className="h-0.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
              animate={{ width: `${stepProgress * 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
