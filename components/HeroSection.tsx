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
    <section className="relative min-h-[calc(100vh-4rem)] lg:min-h-screen flex flex-col justify-center overflow-y-auto lg:overflow-hidden bg-[#090A0F] pt-28 sm:pt-28 lg:pt-20 pb-14 sm:pb-14 lg:pb-8 select-none">

      {/* 1. Background Neural Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/mind-reset-bg.webp"
          alt="MindReset Background"
          fill
          priority
          unoptimized
          className="object-cover object-center opacity-90 md:opacity-85 blur-[0.5px] scale-[1.01]"
        />

        {/* Contrast Vignette Scrims: Brighter on mobile to keep vibrant neural glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F]/65 via-[#090A0F]/25 to-transparent lg:from-[#090A0F]/85 lg:via-[#090A0F]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-transparent to-transparent lg:via-[#090A0F]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_#090A0F_95%)] opacity-70 lg:opacity-100" />
      </div>

      {/* 2. Balanced 2-Column Hero Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-8 lg:gap-12 items-center">

          {/* Left Column: Headline & Action Suite */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
            <div className="space-y-6 sm:space-y-4">
              {/* Primary Headline */}
              <h1 className="text-[42px] sm:text-4xl lg:text-5xl xl:text-[54px] font-medium sm:font-bold tracking-tight text-white leading-[1.08] lg:leading-[1.1]">
                De-escalate <br className="sm:hidden" />
                acute urges <br />
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent font-medium sm:font-bold">
                  in 90 seconds.
                </span>
              </h1>

              {/* Body Copy */}
              <p className="text-[15px] sm:text-base lg:text-lg text-zinc-300 sm:text-zinc-400 lg:text-zinc-300 leading-relaxed max-w-xl">
                Talk through intense cravings, panic spikes, and mental overload with real-time voice guidance. Zero account needed—just instant relief when you need it most.
              </p>
            </div>

            {/* CTA Button Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-3.5 pt-2 sm:pt-1">
              <Link
                href="/session?trigger=Substance+Craving"
                className="w-full sm:w-auto py-4 sm:py-3.5 px-7 rounded-full font-bold text-[15px] sm:text-base bg-[#FF8811] hover:bg-amber-400 text-zinc-950 text-center flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
              >
                <span>Start 90s Reset</span>
                <span className="text-base font-bold">→</span>
              </Link>

              <Link
                href="/protocols"
                className="w-full sm:w-auto py-4 sm:py-3.5 px-6 rounded-full font-medium sm:font-semibold text-[15px] sm:text-base bg-[#181920]/80 hover:bg-[#20212A] text-zinc-100 hover:text-white border border-white/25 hover:border-white/40 text-center transition-all backdrop-blur-md shadow-sm"
              >
                Explore Protocols
              </Link>
            </div>

            {/* Clean Feature List: Hidden on mobile (<640px), visible on tablet/laptop (sm+) */}
            <div className="hidden sm:flex items-center justify-start flex-wrap gap-x-3 gap-y-1.5 pt-3 pb-0 text-xs text-zinc-400 font-medium border-t border-white/[0.06]">
              <span>100% Free &amp; Private</span>
              <span className="text-zinc-600 font-normal">|</span>
              <span>Vagus Nerve Calming</span>
              <span className="text-zinc-600 font-normal">|</span>
              <span>Live Voice Co-Regulation</span>
            </div>
          </div>

          {/* Right Column: Glassmorphic Console with Inner White Border Frame */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <Link
              href="/how-it-works"
              aria-label="Learn how Mind Reset AI works"
              className="group block w-full sm:max-w-md rounded-3xl bg-[#14151D]/60 backdrop-blur-2xl border border-white/10 p-3 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-amber-400/40 hover:shadow-[0_12px_50px_rgba(245,158,11,0.15)] transition-all cursor-pointer"
            >
              
              {/* Inner White Line Framing Container */}
              <div className="w-full rounded-[22px] border border-white/20 sm:border-white/[0.12] group-hover:border-white/30 p-4 sm:p-5 flex flex-col space-y-4 bg-white/[0.01] transition-colors">
                
                {/* Console Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold flex items-center gap-1.5">
                      <span>HOW IT WORKS</span>
                      <span className="text-[10px] text-zinc-400 group-hover:text-amber-300 font-normal transition-colors">→</span>
                    </span>
                    <h3 className="text-lg sm:text-lg font-bold text-zinc-100 group-hover:text-white mt-0.5 transition-colors">
                      90-Second Craving Reset
                    </h3>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] group-hover:scale-110 transition-transform" />
                </div>

                {/* Minimal Open Avatar Stage */}
                <div className="relative w-full py-2 flex flex-col items-center justify-center overflow-hidden">
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
                <div className="space-y-2.5">
                  {[
                    { num: "01", title: "Quick Body Check", desc: "Find where tension hides" },
                    { num: "02", title: "Slow Guided Breath", desc: "Calm your racing heart" },
                    { num: "03", title: "Feel The Shift", desc: "Watch the urge fade away" },
                  ].map((step) => (
                    <div
                      key={step.num}
                      className="p-3 rounded-2xl bg-white/[0.02] group-hover:bg-white/[0.04] border border-white/[0.05] group-hover:border-amber-500/20 transition-all flex items-center gap-3 text-xs text-zinc-300"
                    >
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {step.num.replace(/^0/, "")}
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

            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

