/**
 * Audio Engine Unlock Helper
 * Bypasses mobile & desktop browser autoplay policies by synchronously playing
 * a tiny silent audio buffer and priming the reusable Audio instance during user tap/click gestures.
 */

// 44-byte silent base64 WAV buffer
export const SILENT_AUDIO_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

let sharedAudioElement: HTMLAudioElement | null = null;

export function getSharedAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioElement) {
    sharedAudioElement = new Audio();
  }
  return sharedAudioElement;
}

/**
 * Synchronously warms up the browser audio engine and primes the reusable Audio instance.
 * Call this in user gesture handlers (button clicks, touches, trigger selections).
 */
export function unlockAudioEngine(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Instantly play silent buffer synchronously to unlock audio permissions on user tap
    const silentAudio = new Audio(SILENT_AUDIO_URI);
    silentAudio.play().then(() => {
      silentAudio.pause();
    }).catch(() => {
      // Ignore error, just warming up the browser audio policy
    });

    // 2. Prime the shared Audio element
    const shared = getSharedAudio();
    if (shared) {
      shared.play().then(() => {
        shared.pause();
      }).catch(() => {});
    }

    // 3. Resume Web Speech Synthesis if suspended
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }

    return shared;
  } catch (err) {
    console.warn("[AudioUnlock] Audio priming notice:", err);
    return null;
  }
}
