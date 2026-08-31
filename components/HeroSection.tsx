"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import HumanAvatar from "./HumanAvatar";

interface HeroSectionProps {
  onStartReset?: () => void;
}

export default function HeroSection({ onStartReset }: HeroSectionProps) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] lg:min-h-screen flex flex-col justify-center overflow-y-auto lg:overflow-hidden bg-[#090A0F] pt-20 sm:pt-24 pb-8 sm:pb-12 select-none">

      {/* 1. Background Neural Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/mind-reset-bg.webp"
          alt="MindReset Background"
          fill
          priority
          quality={95}
          className="object-cover object-center opacity-75 md:opacity-85 blur-[1px] scale-[1.01]"
        />

        {/* Contrast Vignette Scrims: Left-side focus for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F]/85 via-[#090A0F]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_#090A0F_92%)]" />
      </div>

      {/* 2. Balanced 2-Column Hero Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: Headline & Action Suite */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
            <div className="space-y-4">
              {/* Primary Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[54px] font-bold tracking-tight text-zinc-50 lg:text-white leading-[1.15] lg:leading-[1.1]">
                De-escalate acute urges <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  in 90 seconds.
                </span>
              </h1>

              {/* Body Copy */}
              <p className="text-sm lg:text-lg text-zinc-400 lg:text-zinc-300 leading-relaxed max-w-xl">
                Talk through intense cravings, panic spikes, and mental overload with real-time voice guidance. Zero account needed—just instant relief when you need it most.
              </p>
            </div>

            {/* CTA Button Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              {onStartReset ? (
                <button
                  onClick={onStartReset}
                  className="w-full sm:w-auto py-3.5 sm:px-7 rounded-full font-semibold sm:font-bold text-sm sm:text-base bg-amber-500 sm:bg-amber-400 hover:bg-amber-400 sm:hover:bg-amber-300 text-zinc-950 text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 sm:shadow-[0_0_25px_rgba(245,158,11,0.25)] sm:hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
                >
                  <span>Start 90s Reset</span>
                  <span>→</span>
                </button>
              ) : (
                <Link
                  href="/session?trigger=Substance+Craving"
                  className="w-full sm:w-auto py-3.5 sm:px-7 rounded-full font-semibold sm:font-bold text-sm sm:text-base bg-amber-500 sm:bg-amber-400 hover:bg-amber-400 sm:hover:bg-amber-300 text-zinc-950 text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 sm:shadow-[0_0_25px_rgba(245,158,11,0.25)] sm:hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
                >
                  <span>Start 90s Reset</span>
                  <span>→</span>
                </Link>
              )}

              <Link
                href="/protocols"
                className="w-full sm:w-auto py-3.5 sm:px-6 rounded-full font-medium sm:font-semibold text-sm sm:text-base bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-800 sm:border-white/10 sm:hover:border-white/20 text-center transition-all backdrop-blur-md"
              >
                Explore Protocols
              </Link>
            </div>

            {/* Clean Feature List with | separator */}
            <div className="flex items-center justify-between sm:justify-start sm:flex-wrap gap-x-3 gap-y-1.5 pt-1 sm:pt-3 pb-2 sm:pb-0 text-[10px] sm:text-xs text-zinc-500 sm:text-zinc-400 font-medium border-t border-white/[0.06]">
              <span>100% Free &amp; Private</span>
              <span className="text-zinc-600 font-normal hidden sm:inline">|</span>
              <span>Vagus Nerve Calming</span>
              <span className="text-zinc-600 font-normal hidden sm:inline">|</span>
              <span>Live Voice Co-Regulation</span>
            </div>
          </div>

          {/* Right Column: Glassmorphic Console */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full sm:max-w-md rounded-2xl sm:rounded-3xl bg-zinc-950/40 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-2xl flex flex-col space-y-4">
              
              {/* Console Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                    How It Works
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-100 mt-0.5">
                    90-Second Craving Reset
                  </h3>
                </div>
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              </div>

              {/* Minimal Open Avatar Stage */}
              <div className="relative w-full py-4 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/[0.04] rounded-2xl blur-xl pointer-events-none" />
                <div className="relative h-28 sm:h-32 w-full flex items-center justify-center">
                  <HumanAvatar isSpeaking={false} hideBadge={true} />
                </div>

                {/* Subtle Voice Equalizer Lines */}
                <div className="flex items-center gap-1 mt-2 opacity-60">
                  <span className="w-0.5 h-1.5 bg-amber-400/80 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-amber-400/80 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-0.5 h-4 bg-amber-400/80 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                  <span className="w-0.5 h-2.5 bg-amber-400/80 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                  <span className="w-0.5 h-1 bg-amber-400/80 rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                </div>
              </div>

              {/* Clean Glassmorphic Step Rows */}
              <div className="space-y-2">
                {[
                  { num: "01", title: "Quick Body Check", desc: "Find where tension hides" },
                  { num: "02", title: "Slow Guided Breath", desc: "Calm your racing heart" },
                  { num: "03", title: "Feel The Shift", desc: "Watch the urge fade away" },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-amber-500/20 transition-all flex items-center gap-2.5 sm:gap-3 text-xs text-zinc-300"
                  >
                    <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                      {step.num}
                    </span>
                    <div className="truncate">
                      <span className="text-zinc-100 font-medium">{step.title}</span>{" "}
                      <span className="text-zinc-500">|</span>{" "}
                      <span className="text-zinc-400">{step.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

