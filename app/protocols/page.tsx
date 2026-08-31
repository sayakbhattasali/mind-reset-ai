"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtocolCard from "@/components/ProtocolCard";
import Footer from "@/components/Footer";
import { ArrowLeft, Flame, Activity, Smartphone } from "lucide-react";

export default function ProtocolsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E11] text-zinc-100 font-sans selection:bg-amber-500/30">
      <Navbar />

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Overview
        </Link>

        <div className="space-y-3 mb-12">
          <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">
            Clinical Interventions Library
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 tracking-tight">
            Targeted Somatic Protocol Directory
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl">
            Explore and launch specialized physiological de-escalation routines tailored to specific autonomic triggers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProtocolCard
            id="Substance Craving"
            icon={<Flame size={24} />}
            category="Habit Loop"
            title="Urge Surfing Protocol"
            description="De-couples autonomic reward cravings from motor execution during acute nicotine, alcohol, or binge urges."
            points={["Somatic body locus scan", "Wave crest breathing pacing", "Hand motor distraction"]}
          />
          <ProtocolCard
            id="Panic & Anxiety"
            icon={<Activity size={24} />}
            category="Autonomic Reset"
            title="Parasympathetic Shift"
            description="Rapid down-regulation for acute panic attacks, racing heart rates, and hyperventilation cycles."
            points={["Double inhale physiological sigh", "Plantar sensory feedback", "Vestibular eye locking"]}
          />
          <ProtocolCard
            id="Screen Compulsion"
            icon={<Smartphone size={24} />}
            category="Dopamine Reset"
            title="Sensory Pattern Interrupt"
            description="Halts compulsive doomscrolling and brain fog through 20-20 visual depth shifts and tactile anchoring."
            points={["20-foot optical refocus", "Tactile texture grounding", "Conscious task isolation"]}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
