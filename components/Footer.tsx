import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, HeartPulse, Lock, PhoneCall } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#090A0F] text-zinc-400 text-xs">
      {/* Main Multi-Column Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
        
        {/* Col 1 & 2: Brand & Clinical Purpose */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/15 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-amber-400/60 transition-all relative">
              <Image
                src="/mind-reset-logo.png"
                alt="Mind Reset AI Logo"
                width={40}
                height={40}
                className="object-cover w-full h-full scale-125 group-hover:scale-130 transition-transform"
              />
            </div>
            <span className="font-extrabold text-xs tracking-[0.2em] text-white uppercase group-hover:text-amber-300 transition-colors">
              MIND RESET AI
            </span>
          </Link>

          <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
            Immediate, non-judgmental somatic voice intervention designed to help you de-escalate peak urges, panic spikes, and overstimulation in 90 seconds. Built on polyvagal principles and real-time auditory co-regulation.
          </p>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
            <ShieldCheck size={14} className="text-amber-400 shrink-0" />
            <span>Zero Tracking | Client-Side Audio | Anonymous by Design</span>
          </div>
        </div>

        {/* Col 3: Evidence Protocols */}
        <div className="space-y-3">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-200 font-semibold">
            Intervention Protocols
          </h4>
          <ul className="space-y-2 text-zinc-400">
            <li>
              <Link href="/protocols" className="hover:text-amber-400 transition-colors">
                Urge Surfing (Cravings)
              </Link>
            </li>
            <li>
              <Link href="/protocols" className="hover:text-amber-400 transition-colors">
                Physiological Sigh (Panic)
              </Link>
            </li>
            <li>
              <Link href="/protocols" className="hover:text-amber-400 transition-colors">
                Sensory Pattern Interrupt
              </Link>
            </li>
            <li>
              <Link href="/protocols" className="hover:text-amber-400 transition-colors">
                Somatic Tension Scanning
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Scientific Principles */}
        <div className="space-y-3">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-200 font-semibold">
            The Science
          </h4>
          <ul className="space-y-2 text-zinc-400">
            <li>
              <Link href="/about" className="hover:text-amber-400 transition-colors">
                Polyvagal Regulation
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-amber-400 transition-colors">
                Mirror-Neuron Safety
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-amber-400 transition-colors">
                90-Second Chemical Wave
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-amber-400 transition-colors">
                Recovery Streaks &amp; Trends
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 5: Crisis Notice & Support */}
        <div className="space-y-3">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-200 font-semibold">
            Emergency Support
          </h4>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            MindReset is a somatic grounding self-help tool, not medical treatment or crisis intervention.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-200">
              <PhoneCall size={12} className="text-amber-400" />
              <span>Tele-MANAS (India)</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Call <strong className="text-amber-400 font-semibold">14416</strong> or <strong className="text-amber-400 font-semibold">1800-891-4416</strong> (24/7 Toll-Free)
            </p>
            <p className="text-[10px] text-zinc-500 font-mono pt-0.5 border-t border-zinc-800/80">
              National Emergency: <strong className="text-zinc-300">112</strong> | KIRAN: <strong className="text-zinc-300">1800-599-0019</strong>
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-800/60 bg-[#07080B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} MindReset AI. Evidence-based somatic wellness.
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/protocols" className="hover:text-zinc-200 transition-colors">Protocols</Link>
            <span>|</span>
            <Link href="/about" className="hover:text-zinc-200 transition-colors">The Science</Link>
            <span>|</span>
            <Link href="/account" className="hover:text-zinc-200 transition-colors">Streaks</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

