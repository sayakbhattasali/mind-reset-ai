"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { unlockAudioEngine } from "@/lib/audioUnlock";
import { db, auth, signInAndClaimSession, logCompletedSession } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ArrowLeft, Flame, Activity, Smartphone, Play, LogIn, Clock, Sparkles } from "lucide-react";

interface SessionRecord {
  id: string;
  trigger: string;
  preScore: number;
  postScore: number;
  reductionPercent: number;
  completedAt?: any;
  userEmail?: string;
  userId?: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const fetchAllUserSessions = async (currentUser: User | null) => {
    setLoading(true);
    const recordsMap = new Map<string, SessionRecord>();

    // 1. Fetch from Firestore if user is authenticated (No composite index required)
    if (currentUser) {
      try {
        // Query by UID
        const qUid = query(
          collection(db, "sessions"),
          where("userId", "==", currentUser.uid)
        );
        const snapUid = await getDocs(qUid);
        snapUid.forEach((d) => {
          recordsMap.set(d.id, { id: d.id, ...(d.data() as any) });
        });

        // Query by Email as well in case sessions were logged with email
        if (currentUser.email) {
          const qEmail = query(
            collection(db, "sessions"),
            where("userEmail", "==", currentUser.email)
          );
          const snapEmail = await getDocs(qEmail);
          snapEmail.forEach((d) => {
            recordsMap.set(d.id, { id: d.id, ...(d.data() as any) });
          });
        }
      } catch (err) {
        console.warn("Firestore fetch error:", err);
      }
    }

    // 2. Fetch local storage sessions (guest sessions or local backup) with strict deduplication
    try {
      if (typeof window !== "undefined") {
        const localList: any[] = JSON.parse(localStorage.getItem("mindreset_sessions") || "[]");
        
        // Build set of existing firestore fingerprints to avoid duplicate local entries
        const existingFingerprints = new Set<string>();
        recordsMap.forEach((rec) => {
          const recTime = rec.completedAt?.seconds 
            ? Math.floor(rec.completedAt.seconds / 60) 
            : Math.floor(new Date(rec.completedAt || 0).getTime() / 60000);
          existingFingerprints.add(`${rec.trigger}_${rec.preScore}_${rec.postScore}_${recTime}`);
        });

        localList.forEach((item, index) => {
          // Only include verified completed sessions
          if (item.preScore === undefined || item.postScore === undefined) return;

          const localId = item.id || `local_${index}`;
          const itemTime = Math.floor(new Date(item.completedAt || 0).getTime() / 60000);
          const fingerprint = `${item.trigger}_${item.preScore}_${item.postScore}_${itemTime}`;

          if (!recordsMap.has(localId) && !existingFingerprints.has(fingerprint)) {
            existingFingerprints.add(fingerprint);
            recordsMap.set(localId, {
              id: localId,
              trigger: item.trigger || "General Reset",
              preScore: item.preScore,
              postScore: item.postScore,
              reductionPercent: item.reductionPercent !== undefined 
                ? item.reductionPercent 
                : Math.max(0, Math.round(((item.preScore - item.postScore) / (item.preScore || 1)) * 100)),
              completedAt: item.completedAt || new Date().toISOString(),
              userEmail: item.userEmail || currentUser?.email,
              userId: item.userId || currentUser?.uid,
            });

            // If user is authenticated, sync this local session to their Firestore account
            if (currentUser && !item.syncedToFirestore) {
              logCompletedSession({
                trigger: item.trigger || "General Reset",
                preScore: item.preScore,
                postScore: item.postScore,
                reductionPercent: item.reductionPercent || 50,
                userId: currentUser.uid,
                userEmail: currentUser.email,
              }).catch(() => {});
              item.syncedToFirestore = true;
            }
          }
        });
      }
    } catch (e) {
      console.warn("LocalStorage error:", e);
    }

    // 3. Sort all records by date descending (Client-side sorting avoids Firestore index locks)
    const sorted = Array.from(recordsMap.values()).sort((a, b) => {
      const getTime = (obj: any) => {
        if (!obj || !obj.completedAt) return 0;
        if (obj.completedAt.seconds) return obj.completedAt.seconds * 1000;
        if (obj.completedAt.toDate) return obj.completedAt.toDate().getTime();
        const parsed = new Date(obj.completedAt).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return getTime(b) - getTime(a);
    });

    setSessions(sorted);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchAllUserSessions(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthLoading(true);
    const loggedUser = await signInAndClaimSession(null);
    if (loggedUser) {
      setUser(loggedUser);
      await fetchAllUserSessions(loggedUser);
    }
    setAuthLoading(false);
  };

  const getTriggerIcon = (trigger: string) => {
    if (trigger.toLowerCase().includes("panic") || trigger.toLowerCase().includes("anxiety")) {
      return <Activity size={16} className="text-amber-400" />;
    }
    if (trigger.toLowerCase().includes("screen") || trigger.toLowerCase().includes("doomscroll")) {
      return <Smartphone size={16} className="text-amber-300" />;
    }
    return <Flame size={16} className="text-amber-400" />;
  };

  const totalSessions = sessions.length;
  const avgReduction = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.reductionPercent || 0), 0) / totalSessions)
    : 0;

  return (
    <div className="min-h-screen bg-[#0E0E11] text-zinc-100 font-sans selection:bg-amber-500/30">
      <Navbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">
              Verified Records
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
              Your Somatic Recovery Log
            </h1>
            <p className="text-zinc-400 text-sm">
              Live tracking of your acute urge reductions and de-escalation history.
            </p>
          </div>

          {!user ? (
            <button
              onClick={handleSignIn}
              disabled={authLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-100 transition-all w-fit"
            >
              <LogIn size={14} />
              <span>{authLoading ? "Signing In..." : "Sign In with Google"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="truncate max-w-[200px]">{user.email}</span>
            </div>
          )}
        </div>

        {/* Real Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-6 rounded-2xl bg-[#16161A] border border-zinc-800">
            <div className="text-xs font-mono text-zinc-500 uppercase">Logged Sessions</div>
            <div className="text-3xl font-extrabold text-zinc-100 mt-1 font-mono tracking-tight">{loading ? "..." : totalSessions}</div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">{user ? "Synced to Google Account" : "Guest / Local Mode"}</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#16161A] border border-zinc-800">
            <div className="text-xs font-mono text-zinc-500 uppercase">Average Urge Drop</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-1 font-mono tracking-tight">{loading ? "..." : `${avgReduction}%`}</div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">{totalSessions > 0 ? "Calculated from your sessions" : "No sessions logged yet"}</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#16161A] border border-zinc-800">
            <div className="text-xs font-mono text-zinc-500 uppercase">Target Intervention</div>
            <div className="text-3xl font-extrabold text-amber-300 mt-1 font-mono tracking-tight">90s</div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">Standard neuro-reset wave</div>
          </div>
        </div>

        {/* Real Session Feed or Clean Empty State */}
        <div className="rounded-3xl bg-[#16161A] border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">Completed De-Escalations</h3>
            <Link
              href="/session?trigger=Substance+Craving"
              onClick={() => unlockAudioEngine()}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            >
              <Play size={12} fill="currentColor" />
              <span>Start Reset</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-mono animate-pulse">
              Loading recovery logs...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 sm:p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1C1D22] border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <Clock size={22} />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-semibold text-zinc-100">No Sessions Logged Yet</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Complete your first 90-second voice de-escalation with Dr. Marcus to record your real physiological relief metrics.
                </p>
              </div>
              <Link
                href="/session?trigger=Substance+Craving"
                onClick={() => unlockAudioEngine()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              >
                <Play size={13} fill="currentColor" />
                <span>Begin First Session</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {sessions.map((log) => (
                <div key={log.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1C1D22] border border-zinc-800">
                      {getTriggerIcon(log.trigger)}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100 text-sm">{log.trigger}</div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">Verified Session</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <span className="text-zinc-500">PRE: </span>
                      <span className="text-rose-400 font-bold">{log.preScore}/10</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">POST: </span>
                      <span className="text-amber-400 font-bold">{log.postScore}/10</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                      -{log.reductionPercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
