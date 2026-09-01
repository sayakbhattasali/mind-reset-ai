"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenSession?: () => void;
}

export default function Navbar({ onOpenSession }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer if user triggers back gesture/button
  useEffect(() => {
    if (!mobileOpen) return;

    window.history.pushState({ menu: true }, "", window.location.href);

    const handleBack = () => {
      setMobileOpen(false);
    };

    window.addEventListener("popstate", handleBack, { once: true });
    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [mobileOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/protocols", label: "Protocols" },
    { href: "/about", label: "Science" },
    { href: "/account", label: "Streaks" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pointer-events-none">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full bg-[#16171D]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] pointer-events-auto">
        
        {/* 1. Left: Brand Lockup with Website Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 border border-white/15 flex items-center justify-center shadow-inner group-hover:border-amber-400/60 transition-all overflow-hidden relative">
            <Image
              src="/mind-reset-logo.png"
              alt="Mind Reset AI Logo"
              width={40}
              height={40}
              priority
              className="object-cover w-full h-full scale-125 group-hover:scale-[1.32] transition-transform duration-300"
            />
          </div>
          <span className="text-xs font-bold tracking-wider text-zinc-100 uppercase flex items-center gap-1.5 group-hover:text-white transition-colors whitespace-nowrap">
            MIND RESET AI
          </span>
        </Link>

        {/* 2. Center Menu: Capsule Dock */}
        <nav className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-900/40 border border-white/[0.04]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#282A36] text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. Right: Primary Action & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/session?trigger=Substance+Craving"
            className="hidden md:inline-flex bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-xs font-medium px-4 py-2 rounded-full transition-all active:scale-[0.98] whitespace-nowrap"
          >
            Start Reset
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden max-w-7xl mx-auto mt-2 px-6 py-4 rounded-3xl bg-[#16171D]/95 backdrop-blur-2xl border border-white/10 space-y-2 shadow-2xl pointer-events-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}




