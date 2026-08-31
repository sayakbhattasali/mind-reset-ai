"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Brain, Heart, ArrowLeft, CheckCircle2, ShieldCheck, Eye } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0E0E11] text-zinc-100 font-sans selection:bg-amber-500/30">
      <Navbar />

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Overview
        </Link>

        <div className="space-y-4 mb-12">
          <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">
            Neurological Foundations
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 tracking-tight">
            How 90 Seconds of Somatic Guidance De-Escalates Urges
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Understanding why human presence, voice pacing, and targeted physical movements calm the brain&apos;s craving and panic centers faster than willpower alone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-[#16161A] border border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">The Amygdala Hijack</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              When an intense craving (nicotine, sugar, binge urge) or sudden panic wave hits, your brain&apos;s threat-detection center floods your system with adrenaline and cortisol. In this state, logic and willpower drop by up to 60%.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-medium flex items-center gap-2">
              <CheckCircle2 size={14} /> Calming the body restores conscious choice
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-[#16161A] border border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Vagus Nerve &amp; Physiological Sighs</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Dr. Marcus guides you through two nasal inhales followed by an extended, slow oral exhale. This opens up collapsed air sacs in your lungs and stimulates the vagus nerve to slow your heartbeat within 3 breath cycles.
            </p>
            <div className="pt-2 text-xs text-amber-300 font-medium flex items-center gap-2">
              <CheckCircle2 size={14} /> Immediate heart rate deceleration in &lt; 45 seconds
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-[#16161A] border border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Eye size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Mirror-Neuron Co-Regulation</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Humans are wired to synchronize with the emotional state of others. Seeing a calm, steady face and hearing soothing, unhurried speech signals subconscious safety to your nervous system automatically.
            </p>
            <div className="pt-2 text-xs text-amber-300 font-medium flex items-center gap-2">
              <CheckCircle2 size={14} /> Natural de-escalation without mental strain
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-[#16161A] border border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Urge Surfing</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Neuroscience shows that acute emotional and physical craving spikes naturally peak and recede within 90 seconds. By observing the physical sensations without acting on them, the craving dissipates on its own.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-medium flex items-center gap-2">
              <CheckCircle2 size={14} /> Proven reduction in compulsive relapse
            </div>
          </div>
        </div>

        {/* Call to Action Box */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-tr from-[#16161A] via-[#121216] to-[#0E0E11] border border-zinc-800 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">Experience Dr. Marcus Live</h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            Ready to test somatic de-escalation for yourself? Start a free, private voice session now.
          </p>
          <Link
            href="/session?trigger=Panic+%26+Anxiety"
            className="inline-block px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-2xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.15)] active:scale-[0.99]"
          >
            Start a Guided Session
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
