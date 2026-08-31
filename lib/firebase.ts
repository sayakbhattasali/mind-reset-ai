// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Services
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (Browser-safe for Next.js SSR)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export interface SessionLogPayload {
  trigger: string;
  preScore: number;
  postScore: number;
  reductionPercent: number;
  durationSeconds?: number;
  userId?: string | null;
  userEmail?: string | null;
}

// Local storage helpers for instant feedback and backup
function saveLocalSession(data: SessionLogPayload) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem("mindreset_sessions") || "[]");
    existing.push({ ...data, completedAt: new Date().toISOString(), id: `local_${Date.now()}` });
    localStorage.setItem("mindreset_sessions", JSON.stringify(existing));
  } catch (e) {
    console.warn("Local storage write error:", e);
  }
}

function getLocalSessionsCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const existing = JSON.parse(localStorage.getItem("mindreset_sessions") || "[]");
    return existing.length;
  } catch {
    return 0;
  }
}

// Record User to 'users' collection on sign in
export async function recordUserSignIn(user: User) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      lastLogin: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn("Could not save user profile to Firestore (check Firestore Rules):", e);
  }
}

// 1. Initial anonymous session log (fires immediately upon evaluation)
export async function logCompletedSession(data: SessionLogPayload): Promise<string | null> {
  saveLocalSession(data);

  try {
    const currentAuthUser = auth.currentUser;
    const docRef = await addDoc(collection(db, "sessions"), {
      ...data,
      userId: currentAuthUser?.uid || data.userId || null,
      userEmail: currentAuthUser?.email || data.userEmail || null,
      completedAt: serverTimestamp(),
      platform: "web",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    });
    console.log("Session logged to Firestore:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.warn("Firestore session logging skipped or permission locked:", error);
    return `local_${Date.now()}`;
  }
}

// 2. Attach Google User if they choose "Sign in with Google" to claim their session
export async function signInAndClaimSession(sessionId: string | null): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Record user to users collection
    await recordUserSignIn(user);

    // If an anonymous session exists from this run, link it to the user account
    if (sessionId && !sessionId.startsWith("local_")) {
      const sessionRef = doc(db, "sessions", sessionId);
      await updateDoc(sessionRef, {
        userId: user.uid,
        userEmail: user.email,
        claimedAt: serverTimestamp(),
      });
    }

    return user;
  } catch (err) {
    console.error("Google sign-in error:", err);
    return null;
  }
}

// 3. Fetch real live counts from Firebase with local fallback
export async function getLiveFirebaseMetrics(): Promise<{ totalSessions: number; totalUsers: number }> {
  let firestoreSessions = 0;
  let firestoreUsers = 0;

  try {
    const [sessionsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, "sessions")),
      getDocs(collection(db, "users")),
    ]);

    const uniqueUserIds = new Set<string>();
    usersSnap.forEach((u) => uniqueUserIds.add(u.id));
    sessionsSnap.forEach((s) => {
      const data = s.data();
      if (data.userId) uniqueUserIds.add(data.userId);
    });

    firestoreSessions = sessionsSnap.size;
    firestoreUsers = uniqueUserIds.size;
  } catch (error) {
    console.warn("Live Firestore read restricted by rules, using local fallback metrics.");
  }

  const localCount = getLocalSessionsCount();
  const authUserCount = auth.currentUser ? 1 : 0;

  return {
    totalSessions: Math.max(firestoreSessions, localCount),
    totalUsers: Math.max(firestoreUsers, authUserCount),
  };
}
