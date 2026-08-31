"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface BreathingRingProps {
  breathPacing?: "inhale" | "hold" | "exhale" | "none";
}

export default function BreathingRing({ breathPacing = "inhale" }: BreathingRingProps) {
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Relax">("Inhale");
  const [countdown, setCountdown] = useState<number>(4);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (breathPacing === "none") {
      setPhase("Relax");
      return;
    }

    if (breathPacing === "inhale") {
      setPhase("Inhale");
    } else if (breathPacing === "exhale") {
      setPhase("Exhale");
    } else if (breathPacing === "hold") {
      setPhase("Hold");
    }

    let isMounted = true;
    const runCycle = () => {
      if (!isMounted) return;
      setPhase("Inhale");
      setCountdown(4);

      phaseTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        setPhase("Exhale");
        setCountdown(4);

        phaseTimerRef.current = setTimeout(() => {
          if (!isMounted) return;
          runCycle();
        }, 4000);
      }, 4000);
    };

    if (breathPacing === undefined) {
      runCycle();
    }

    return () => {
      isMounted = false;
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [breathPacing]);

  const getDisplayText = () => {
    if (breathPacing === "none") return "Ground";
    if (breathPacing === "inhale") return "Inhale";
    if (breathPacing === "exhale") return "Exhale";
    if (breathPacing === "hold") return "Hold";
    return phase;
  };

  const displayText = getDisplayText();

  return (
    <div className="relative flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64 mx-auto pointer-events-none">
      {/* Outer Pulse Ring */}
      <motion.div
        className="absolute w-full h-full rounded-full border-2 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
        animate={{
          scale: breathPacing === "none" ? [1, 1.08, 1] : phase === "Inhale" ? [1, 1.35] : [1.35, 1],
          opacity: [0.35, 0.75, 0.35],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Middle Ring */}
      <motion.div
        className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        animate={{
          scale: breathPacing === "none" ? [1, 1.05, 1] : phase === "Inhale" ? [1, 1.25] : [1.25, 1],
          opacity: [0.45, 0.85, 0.45],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />

      {/* Center Glowing Orb Backdrop */}
      <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-amber-500/15 blur-2xl animate-pulse-slow" />

      {/* Center Phase Bubble */}
      <motion.div
        className="z-10 flex flex-col items-center justify-center text-center px-4 py-2 rounded-full bg-[#0E0E11]/80 backdrop-blur-xl border border-amber-500/30 shadow-lg"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={displayText}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-amber-400 font-semibold tracking-wider uppercase text-xs sm:text-sm font-mono"
          >
            {displayText}
          </motion.span>
        </AnimatePresence>
        <span className="text-[9px] sm:text-[10px] text-zinc-400 font-light">
          {breathPacing === "none" ? "Stay Present" : "Deep & Steady"}
        </span>
      </motion.div>
    </div>
  );
}
