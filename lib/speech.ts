// Voice synthesis utility using Web Speech API

class SpeechEngine {
  private isMuted: boolean = false;

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (this.isMuted || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88; // Gentle, soothing cadence
      utterance.pitch = 0.98; // Relaxing, grounded tone
      utterance.volume = 1.0;

      // Select a natural sounding English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Jenny")))
      ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // Fallback silently if speech synthesis encounters error
    }
  }
}

export const speechEngine = new SpeechEngine();
