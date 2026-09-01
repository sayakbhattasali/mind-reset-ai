"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { unlockAudioEngine } from "@/lib/audioUnlock";

interface ProtocolCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  category: string;
  description: string;
  points: string[];
  themeColor?: "amber" | "teal" | "indigo";
}

export default function ProtocolCard({
  id,
  icon,
  title,
  category,
  description,
  points,
}: ProtocolCardProps) {
  const sessionUrl = `/session?trigger=${encodeURIComponent(id)}`;

  return (
    <div className="group p-7 rounded-2xl flex flex-col justify-between bg-[#16161A] border border-zinc-800 hover:border-zinc-700 transition-all duration-300 shadow-xl shadow-black/40">
      <div>
        {/* Icon & Category Pill */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-11 h-11 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            {icon}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-amber-300/80">
            {category}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-zinc-100 mb-2 leading-snug tracking-tight">
          {title}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-5">
          {description}
        </p>

        {/* Protocol points */}
        <div className="space-y-2 text-xs text-zinc-400 font-mono border-t border-zinc-800/80 pt-4">
          {points.map((pt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle2 size={13} className="shrink-0 text-amber-400" />
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={sessionUrl}
        onClick={() => unlockAudioEngine()}
        className="mt-7 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 text-sm font-semibold transition-all flex items-center justify-center gap-2 group/btn active:scale-[0.99]"
      >
        <span>Begin Protocol</span>
        <ChevronRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
