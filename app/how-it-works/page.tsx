"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { unlockAudioEngine } from "@/lib/audioUnlock";
import HumanAvatar from "@/components/HumanAvatar";
import {
  Brain,
  Heart,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Flame,
  Activity,
  Smartphone,
  Sparkles,
  Volume2,
  Clock,
  Lock,
  ArrowRight,
  Sparkle
} from "lucide-react";

export default function HowItWorksPage() {
  const useCases = [
    {
      icon: Flame,
      title: "Substance & Chemical Cravings",
      subtitle: "Nicotine, Alcohol, Sugar & Binge Impulses",
      description:
        "Craving waves typically peak and dissolve within 90 seconds. Dr. Marcus helps you ride the wave through urge surfing, preventing impulsive relapse before you act.",
      tags: ["Nicotine / Vaping", "Sugar & Snacking", "Alcohol Urges"],
      color: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/30",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Activity,
      title: "Panic Spikes & Acute Anxiety",
      subtitle: "Racing Heart, Chest Tightness & Hyperventilation",
      description:
        "When adrenaline floods your bloodstream, logic disconnects. Guided physiological sighs and grounding tactile cues quickly restore parasympathetic control.",
      tags: ["Panic Attacks", "Performance Anxiety", "Overwhelm Spikes"],
      color: "from-rose-500/20 to-amber-500/10",
      border: "border-rose-500/30",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      icon: Smartphone,
      title: "Digital Doomscrolling & Brain Fog",
      subtitle: "Compulsive App Checking & Dopamine Loops",
      description:
        "Breaks dopamine fatigue and endless scrolling trance through optical depth refocusing, physical sensory grounding, and conscious reset cues.",
      tags: ["Social Media Trance", "ADHD Task Paralysis", "Late-Night Screen Use"],
      color: "from-blue-500/20 to-indigo-500/10",
      border: "border-blue-500/30",
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Sparkles,
      title: "Sudden Anger & Reactive Impulses",
      subtitle: "Heated Confrontations & Stress Spikes",
      description:
        "Dissipates intense emotional charge before you send an angry message or make an impulsive decision you might regret later.",
      tags: ["Workplace Conflict", "Relationship Friction", "Frustration Peaks"],
      color: "from-purple-500/20 to-amber-500/10",
      border: "border-purple-500/30",
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  const systemSteps = [
    {
      step: "01",
      title: "Identify & Rate the Sensation",
      desc: "Select your specific trigger and rate the urge from 1 to 10. By putting a number on the sensation, you immediately activate your prefrontal cortex, creating conscious distance between sensation and impulse.",
      highlight: "Neuro-calibration",
    },
    {
      step: "02",
      title: "Mirror-Neuron Voice Co-Regulation",
      desc: "Dr. Marcus speaks in real time with an unhurried, grounded cadence. Human nervous systems naturally synchronize with calm vocal cues, triggering subconscious physiological safety within seconds.",
      highlight: "Real-Time AI Voice Streaming",
    },
    {
      step: "03",
      title: "Targeted Somatic De-Escalation",
      desc: "You are guided through physiological sighs (two quick inhales, long slow exhale) and physical cues—dropping your shoulders, unclenching your jaw, and feeling your feet firmly on the ground.",
      highlight: "Vagus Nerve Activation",
    },
    {
      step: "04",
      title: "Quantified Proof of Relief",
      desc: "Re-score your physical sensation at the end of 90 seconds. Seeing your urge drop by 40%–80% builds neuroplastic confidence and proves that craving waves are temporary.",
      highlight: "Verified Symptom Reduction",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100 font-sans selection:bg-amber-500/30">
      <Navbar />

      {/* Main Content Area */}
      <main className="pt-28 sm:pt-32 pb-20 px-5 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16 sm:space-y-24">
        
        {/* Breadcrumb & Hero Header */}
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                How Mind Reset AI Works &amp; When to Use It
              </h1>

              <p className="text-zinc-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                A rapid 90-second somatic emergency toolkit designed to intercept acute cravings, panic spikes, and compulsive loops before you act on impulse.
              </p>
            </div>

            {/* Dr. Marcus Avatar Showcase Card */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="w-full max-w-xs rounded-3xl bg-[#14151D]/80 backdrop-blur-xl border border-white/15 p-5 shadow-2xl space-y-3 text-center">
                <div className="h-32 flex items-center justify-center">
                  <HumanAvatar isSpeaking={false} hideBadge={true} />
                </div>
                <div className="space-y-1 border-t border-white/[0.08] pt-3">
                  <div className="text-xs font-bold text-zinc-100">Dr. Marcus</div>
                  <div className="text-[11px] text-amber-400 font-mono">Somatic Voice Guide</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: When to Use Mind Reset AI (Use Cases Grid) */}
        <section className="space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Targeted Scenarios
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Primary Use Cases
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              Open Mind Reset AI whenever your nervous system enters fight-or-flight or an acute craving strikes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {useCases.map((uc, i) => {
              const IconComp = uc.icon;
              return (
                <div
                  key={i}
                  className={`p-6 sm:p-7 rounded-3xl bg-[#14151D]/70 backdrop-blur-xl border ${uc.border} space-y-4 shadow-xl flex flex-col justify-between hover:border-amber-400/50 transition-all`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
                        <IconComp size={24} />
                      </div>
                      <span className={`text-[10px] font-mono font-semibold uppercase px-2.5 py-1 rounded-full border ${uc.badgeColor}`}>
                        Instant Relief
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{uc.title}</h3>
                      <div className="text-xs text-amber-300/80 font-medium mt-0.5">{uc.subtitle}</div>
                    </div>

                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                      {uc.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
                    {uc.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-mono text-zinc-400 bg-white/[0.02] border border-white/[0.04] px-2.5 py-1 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Step-by-Step Protocol (The 4 Steps) */}
        <section className="space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              The 90-Second Method
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How the System Calms Your Nervous System
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              Backed by somatic psychotherapy, mirror-neuron research, and physiological breathing mechanics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {systemSteps.map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#14151D]/60 backdrop-blur-xl border border-white/10 space-y-3 flex flex-col justify-between hover:border-amber-400/40 transition-all shadow-lg"
              >
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block">
                    Step {s.step}
                  </span>
                  <h4 className="text-base font-bold text-white leading-snug">{s.title}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{s.desc}</p>
                </div>
                <div className="pt-2 text-[10px] font-mono text-amber-300 font-semibold border-t border-white/[0.06]">
                  ✦ {s.highlight}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Privacy & System Guarantees */}
        <section className="p-7 sm:p-10 rounded-3xl bg-gradient-to-b from-[#161720] to-[#101117] border border-white/10 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Built for Private, Zero-Friction Emergency Use</h3>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              When an impulse strikes, you should never face login walls, questionnaires, or paywalls.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="text-amber-400 flex items-center gap-2 font-bold text-sm">
                <Lock size={16} />
                <span>100% Private &amp; Ephemeral</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Microphone audio streams in real time client-side and is never recorded or stored on any server.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="text-amber-400 flex items-center gap-2 font-bold text-sm">
                <Zap size={16} />
                <span>Zero Account Required</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Start a live session instantly with one tap. No passwords or registration required for emergency resets.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="text-amber-400 flex items-center gap-2 font-bold text-sm">
                <Clock size={16} />
                <span>Sub-Second Voice Responses</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Low-latency stream-to-sentence voice technology ensures Dr. Marcus speaks immediately when you talk.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Final Bottom Call-To-Action Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#161720] to-amber-500/10 border border-amber-500/30 text-center space-y-6 shadow-2xl">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ready to De-escalate Your Sensation?
            </h2>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
              Dr. Marcus is ready to guide you through a private 90-second somatic reset right now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/session?trigger=Substance+Craving"
              onClick={() => unlockAudioEngine()}
              className="w-full sm:w-auto py-4 px-8 rounded-full font-bold text-sm sm:text-base bg-[#FF8811] hover:bg-amber-400 text-zinc-950 flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98]"
            >
              <span>Start 90s Reset</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/protocols"
              className="w-full sm:w-auto py-4 px-7 rounded-full font-medium text-sm sm:text-base bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/20 text-center transition-all backdrop-blur-md"
            >
              Explore All Protocols
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
