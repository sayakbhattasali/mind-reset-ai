"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HumanAvatarProps {
  isSpeaking: boolean;
  statusText?: string;
  hideBadge?: boolean;
}

export default function HumanAvatar({ isSpeaking, statusText, hideBadge = true }: HumanAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [pupilShift, setPupilShift] = useState({ x: 0, y: 0 });

  // 1. Natural Organic Blinking with Double-Blink Chance
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const scheduleBlink = () => {
      const nextDelay = 2400 + Math.random() * 2800;
      timer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          // 30% probability of natural quick double-blink
          if (Math.random() < 0.30) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => {
                setIsBlinking(false);
                scheduleBlink();
              }, 110);
            }, 130);
          } else {
            scheduleBlink();
          }
        }, 130);
      }, nextDelay);
    };

    scheduleBlink();
    return () => clearTimeout(timer);
  }, []);

  // 2. Subtle Attentive Eye Gaze Shifts
  useEffect(() => {
    const gazeInterval = setInterval(() => {
      const randX = (Math.random() - 0.5) * 2.4;
      const randY = (Math.random() - 0.5) * 1.5;
      setPupilShift({ x: randX, y: randY });
    }, 3400);
    return () => clearInterval(gazeInterval);
  }, []);

  const badgeLabel = statusText || (isSpeaking ? "Dr. Marcus (Speaking)" : "Dr. Marcus (Online)");

  return (
    <div className="relative w-full h-full min-h-0 flex items-center justify-center overflow-hidden select-none">

      {/* Clinic Badge (Only if hideBadge is false) */}
      {!hideBadge && (
        <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md">
          <span className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-amber-400 animate-pulse" : "bg-amber-500"}`} />
          <span className="text-[11px] font-medium text-zinc-300">
            {badgeLabel}
          </span>
        </div>
      )}

      {/* Layered Avatar Frame */}
      <div className="relative w-full h-full flex items-center justify-center">

        {/* 1. LAYER (BEHIND): Head, Face, Glasses, Eyes & Attentive Tilts */}
        <div className="absolute inset-0 flex items-center justify-center animate-doctor-head z-10 pointer-events-none">
          <svg viewBox="0 0 400 450" className="h-full w-auto max-h-full max-w-full drop-shadow-lg object-contain">
            <defs>
              <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e3b593" />
                <stop offset="100%" stopColor="#c99873" />
              </linearGradient>
              <linearGradient id="skinShadeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c99873" stopOpacity="0" />
                <stop offset="100%" stopColor="#a97a58" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8e9eb" />
                <stop offset="55%" stopColor="#c3c6cb" />
                <stop offset="100%" stopColor="#9a9ea6" />
              </linearGradient>
              <linearGradient id="beardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dfe1e4" />
                <stop offset="100%" stopColor="#aeb2b9" />
              </linearGradient>
            </defs>

            {/* Neck (Extends deep behind collar/tie) */}
            <rect x="178" y="258" width="44" height="135" rx="8" fill="url(#skinGrad)" />
            <path d="M 180 288 Q 200 302 220 288" stroke="#b8895f" strokeWidth="2" fill="none" opacity="0.5" />

            {/* Ears */}
            <ellipse cx="130" cy="212" rx="10" ry="16" fill="url(#skinGrad)" />
            <ellipse cx="270" cy="212" rx="10" ry="16" fill="url(#skinGrad)" />
            <path d="M 127 206 Q 133 212 127 220" stroke="#b8895f" strokeWidth="1.5" fill="none" opacity="0.6" />
            <path d="M 273 206 Q 267 212 273 220" stroke="#b8895f" strokeWidth="1.5" fill="none" opacity="0.6" />

            {/* Head / Face Shape */}
            <path
              d="M 200 122
                 C 240 122, 270 150, 270 196
                 C 270 226, 262 252, 246 272
                 C 232 290, 216 300, 200 300
                 C 184 300, 168 290, 154 272
                 C 138 252, 130 226, 130 196
                 C 130 150, 160 122, 200 122 Z"
              fill="url(#skinGrad)"
            />
            {/* Facial Shading Depth */}
            <path
              d="M 246 190 C 250 220, 244 252, 224 276 C 236 262, 246 240, 248 214 Z"
              fill="url(#skinShadeGrad)"
            />

            {/* Grey Hair */}
            <path
              d="M 133 176
                 C 128 128, 158 96, 200 96
                 C 242 96, 272 128, 267 176
                 C 264 150, 250 132, 232 126
                 C 240 138, 240 152, 232 160
                 C 224 138, 208 128, 200 128
                 C 192 128, 176 138, 168 160
                 C 160 152, 160 138, 168 126
                 C 150 132, 136 150, 133 176 Z"
              fill="url(#hairGrad)"
            />
            <path d="M 133 178 C 130 192, 131 202, 136 210 C 132 198, 132 188, 135 179 Z" fill="url(#hairGrad)" />
            <path d="M 267 178 C 270 192, 269 202, 264 210 C 268 198, 268 188, 265 179 Z" fill="url(#hairGrad)" />
            <path d="M 160 118 Q 200 106 240 118" stroke="#a3a7ae" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />

            {/* Forehead Expression Lines */}
            <path d="M 168 150 Q 200 144 232 150" stroke="#b8895f" strokeWidth="1" fill="none" opacity="0.35" />
            <path d="M 170 160 Q 200 155 230 160" stroke="#b8895f" strokeWidth="1" fill="none" opacity="0.3" />

            {/* Eyebrows (Micro-float with breathe) */}
            <g className="animate-doctor-eyebrow">
              <path d="M 150 190 Q 167 183 184 189" stroke="#8f9299" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 216 189 Q 233 183 250 190" stroke="#8f9299" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Fine Rectangular Professional Glasses */}
            <g stroke="#4b5563" strokeWidth="2" fill="none">
              <rect x="147" y="196" width="42" height="28" rx="6" fill="rgba(255,255,255,0.10)" />
              <rect x="211" y="196" width="42" height="28" rx="6" fill="rgba(255,255,255,0.10)" />
              <line x1="189" y1="208" x2="211" y2="208" strokeWidth="2.5" />
              <line x1="147" y1="205" x2="132" y2="200" />
              <line x1="253" y1="205" x2="268" y2="200" />
            </g>

            {/* Eyes & Gaze */}
            {isBlinking ? (
              <>
                <line x1="155" y1="211" x2="179" y2="211" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="221" y1="211" x2="245" y2="211" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Left Eye White */}
                <ellipse cx="167" cy="210" rx="7" ry="5" fill="#ffffff" />
                {/* Left Pupil */}
                <circle
                  cx={167 + pupilShift.x}
                  cy={210 + pupilShift.y}
                  r="3.6"
                  fill="#2f2a26"
                  className="transition-all duration-700 ease-out"
                />
                <circle cx={168.5 + pupilShift.x * 0.7} cy={208.5 + pupilShift.y * 0.7} r="1.1" fill="#ffffff" />

                {/* Right Eye White */}
                <ellipse cx="233" cy="210" rx="7" ry="5" fill="#ffffff" />
                {/* Right Pupil */}
                <circle
                  cx={233 + pupilShift.x}
                  cy={210 + pupilShift.y}
                  r="3.6"
                  fill="#2f2a26"
                  className="transition-all duration-700 ease-out"
                />
                <circle cx={234.5 + pupilShift.x * 0.7} cy={208.5 + pupilShift.y * 0.7} r="1.1" fill="#ffffff" />
              </>
            )}

            {/* Under-eye lines */}
            <path d="M 156 220 Q 167 224 178 220" stroke="#b8895f" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M 222 220 Q 233 224 244 220" stroke="#b8895f" strokeWidth="1" fill="none" opacity="0.3" />

            {/* Nose */}
            <path d="M 200 206 L 195 240 Q 200 246 205 240 L 200 206" stroke="#a97a58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* Moustache */}
            <path
              d="M 176 250 Q 188 244 200 248 Q 212 244 224 250 Q 214 254 200 253 Q 186 254 176 250 Z"
              fill="url(#beardGrad)"
            />

            {/* Talking Mouth vs. Resting Warmth */}
            {isSpeaking ? (
              <motion.path
                d="M 188 258 Q 200 264 212 258 Q 200 261 188 258 Z"
                fill="#6b2f2f"
                stroke="#5b2626"
                strokeWidth="1"
                animate={{
                  d: [
                    "M 189 258 Q 200 262 211 258 Q 200 260 189 258 Z",
                    "M 186 258 Q 200 272 214 258 Q 200 262 186 258 Z",
                    "M 188 258 Q 200 266 212 258 Q 200 261 188 258 Z",
                  ],
                }}
                transition={{ duration: 0.32, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : (
              <path
                d="M 190 259 Q 200 263 210 259"
                stroke="#5b2626"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Short Groomed Beard */}
            <path
              d="M 148 232
                 C 150 258, 160 280, 178 292
                 C 188 299, 212 299, 222 292
                 C 240 280, 250 258, 252 232
                 C 244 250, 232 264, 218 270
                 Q 224 258, 220 246
                 C 214 258, 206 266, 200 267
                 C 194 266, 186 258, 180 246
                 Q 176 258, 182 270
                 C 168 264, 156 250, 148 232 Z"
              fill="url(#beardGrad)"
            />
            <path d="M 168 258 Q 172 272 182 282" stroke="#9a9ea6" strokeWidth="1" fill="none" opacity="0.5" />
            <path d="M 232 258 Q 228 272 218 282" stroke="#9a9ea6" strokeWidth="1" fill="none" opacity="0.5" />
          </svg>
        </div>

        {/* 2. LAYER (IN FRONT): Torso & Shoulders Overlapping Collar */}
        <div className="absolute inset-0 flex items-center justify-center animate-doctor-torso z-20 pointer-events-none">
          <svg viewBox="0 0 400 450" className="h-full w-auto max-h-full max-w-full drop-shadow-md object-contain">
            <defs>
              <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E4E4E7" />
                <stop offset="100%" stopColor="#A1A1AA" />
              </linearGradient>
              <linearGradient id="vestGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#242834" />
                <stop offset="100%" stopColor="#141822" />
              </linearGradient>
            </defs>

            {/* Shoulders / Charcoal Vest */}
            <path d="M 112 328 L 58 450 L 342 450 L 288 328 Z" fill="url(#vestGrad)" />

            {/* Lab Coat Lapels - Harmonized Clinical Zinc */}
            <path d="M 112 328 L 58 450 L 162 450 L 162 358 Z" fill="url(#coatGrad)" />
            <path d="M 288 328 L 342 450 L 238 450 L 238 358 Z" fill="url(#coatGrad)" />
            <path d="M 162 358 L 200 400 L 200 368 L 178 340 Z" fill="#D4D4D8" opacity="0.4" />
            <path d="M 238 358 L 200 400 L 200 368 L 222 340 Z" fill="#D4D4D8" opacity="0.4" />

            {/* Shirt & Necktie */}
            <path d="M 168 330 L 200 372 L 232 330 Z" fill="#D4D4D8" />
            <polygon points="194,344 206,344 210,404 200,416 190,404" fill="#5b3a3a" />
            <polygon points="194,344 206,344 202,356 198,356" fill="#4a2f2f" />
          </svg>
        </div>

      </div>
    </div>
  );
}