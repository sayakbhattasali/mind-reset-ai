"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProtocolCard from "@/components/ProtocolCard";
import InterventionModal from "@/components/InterventionModal";
import Footer from "@/components/Footer";
import { getLiveFirebaseMetrics } from "@/lib/firebase";
import { Flame, Activity, Smartphone, BrainCircuit, Heart, ShieldCheck, CheckCircle2, Users } from "lucide-react";

export default function Home() {
  const [liveMetrics, setLiveMetrics] = useState({ totalSessions: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTrigger, setModalTrigger] = useState("Substance Craving");

  useEffect(() => {
    getLiveFirebaseMetrics().then((data) => {
      setLiveMetrics(data);
      setLoading(false);
    });
  }, []);

  const handleOpenModal = (triggerName: string = "Substance Craving") => {
    setModalTrigger(triggerName);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0E0E11] text-zinc-100 font-sans selection:bg-amber-500/25">
      <Navbar onOpenSession={() => handleOpenModal("Substance Craving")} />

      <HeroSection onStartReset={() => handleOpenModal("Substance Craving")} />

      {/* Live Firestore Telemetry & Scientific Principles Banner */}
      <section id="metrics" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md">
          {/* Card 1: 90s Neuro Window */}
          <div className="p-3 sm:border-r border-zinc-800/80">
            <div className="text-3xl font-extrabold text-zinc-100 font-mono tracking-tight">90s</div>
            <div className="text-xs text-zinc-500 mt-1">Intervention Window</div>
          </div>

          {/* Card 2: Total Sessions Done (Live Firebase) */}
          <div className="p-3 sm:border-r border-zinc-800/80">
            <div className="text-3xl font-extrabold text-amber-400 font-mono flex items-center gap-1.5 tracking-tight">
              <span>{loading ? "—" : liveMetrics.totalSessions}</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            </div>
            <div className="text-xs text-zinc-500 mt-1">Sessions Completed</div>
          </div>

          {/* Card 3: Registered Users (Live Firebase) */}
          <div className="p-3 sm:border-r border-zinc-800/80">
            <div className="text-3xl font-extrabold text-amber-300 font-mono flex items-center gap-1.5 tracking-tight">
              <span>{loading ? "—" : liveMetrics.totalUsers}</span>
              <Users size={16} className="text-amber-400" />
            </div>
            <div className="text-xs text-zinc-500 mt-1">Registered Users</div>
          </div>

          {/* Card 4: 100% Client-Side Privacy */}
          <div className="p-3">
            <div className="text-3xl font-extrabold text-stone-200 font-mono tracking-tight">100%</div>
            <div className="text-xs text-zinc-500 mt-1">Private &amp; Client-Side</div>
          </div>
        </div>
      </section>

      {/* Protocols Grid */}
      <section id="protocols" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-amber-400">Targeted Protocols</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
            Structured for immediate relief.
          </p>
          <p className="text-zinc-400 text-sm">
            Select any protocol to start a real-time guided session with Dr. Marcus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProtocolCard
            id="Substance Craving"
            icon={<Flame size={24} />}
            category="Craving &amp; Impulse"
            title="Urge Surfing"
            description="Guides you through peak craving waves (nicotine, sugar, binge impulses) by decoupling physical tension from action."
            points={["Body tension scanning", "Controlled wave breathing", "Physical tactile redirection"]}
          />
          <ProtocolCard
            id="Panic & Anxiety"
            icon={<Activity size={24} />}
            category="Anxiety &amp; Panic"
            title="Calm Down Regulation"
            description="Somatic grounding for sudden panic attacks, rapid heartbeat, and overwhelming mental pressure."
            points={["Double-inhale physiological sighs", "Feet-on-floor tactile anchoring", "Shoulder and jaw release"]}
          />
          <ProtocolCard
            id="Screen Compulsion"
            icon={<Smartphone size={24} />}
            category="Digital Overstimulation"
            title="Sensory Pattern Interrupt"
            description="Breaks endless scrolling loops and brain fog by re-engaging your real-world senses and visual focus."
            points={["Optical depth refocusing", "Physical sensory grounding", "Conscious task reset"]}
          />
        </div>
      </section>

      {/* Science & Physiology Section */}
      <section id="science" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
              Why Voice and Visual Presence Stop Urges Faster
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              When an intense craving or panic surge hits, your brain&apos;s fight-or-flight center temporarily overrides logical thinking. Trying to read dense text or articles during a crisis takes too much cognitive effort. Dr. Marcus works through direct somatic co-regulation.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 h-fit border border-amber-500/20">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Mirror-Neuron Calming</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Seeing a steady human presence and hearing slow, gentle voice guidance signals safety to your nervous system automatically.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 h-fit border border-amber-500/20">
                  <Heart size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Vagus Nerve Activation</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Guided physiological breathing slows your pulse and restores blood flow to the prefrontal cortex within 90 seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-[#16161A] border border-zinc-800 space-y-4 text-zinc-300 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-800/80 pb-3 font-mono text-xs">
              <span className="uppercase tracking-wider">The 4-Step Somatic Reset Loop</span>
              <span className="text-amber-400 flex items-center gap-1.5 font-sans text-xs font-semibold">
                <CheckCircle2 size={13} /> Clinical Method
              </span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#1C1D22] border border-zinc-800/80 space-y-1">
                <div className="font-bold text-zinc-100 text-sm">1. Urge Calibration &amp; Body Scan</div>
                <p className="text-zinc-400 leading-relaxed">
                  You pinpoint where the physical urge lives (tight chest, clenched stomach, restless hands) to separate sensation from impulse.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#1C1D22] border border-zinc-800/80 space-y-1">
                <div className="font-bold text-amber-400 text-sm">2. Real-Time Physical Guidance</div>
                <p className="text-zinc-400 leading-relaxed">
                  Dr. Marcus guides your breathing pace and cues physical actions—dropping shoulders, unclenching the jaw, and planting feet firmly.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#1C1D22] border border-zinc-800/80 space-y-1">
                <div className="font-bold text-amber-300 text-sm">3. Continuous Voice Check-In</div>
                <p className="text-zinc-400 leading-relaxed">
                  You talk out loud and share what is changing. The conversation dynamically adapts until your body settles.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#1C1D22] border border-zinc-800/80 space-y-1">
                <div className="font-bold text-stone-200 text-sm">4. Relief Confirmation &amp; Proof</div>
                <p className="text-zinc-400 leading-relaxed">
                  You re-score your physical intensity to verify that the wave has passed and build lasting confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Interactive In-Page Intervention Modal */}
      <InterventionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTrigger={modalTrigger}
      />
    </div>
  );
}
