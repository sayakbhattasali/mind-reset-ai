const STRICT_FEMALE_KEYWORDS = [
  "female", "woman", "girl", "samantha", "karen", "victoria", "fiona", "moira", "tessa",
  "zira", "susan", "hazel", "linda", "catherine", "ava", "allison",
  "siri", "google uk english female", "google us english female", "google us english",
  "google uk english", "en-us-x-sfg", "en-us-x-tpc", "en-us-x-iob", "en-gb-x-gbb",
  "en-gb-x-fis", "en-in-x-cfa", "en-in-x-cga", "en-au-x-afh",
  "zoe", "kate", "nicky", "stephanie", "flo", "shelley", "sandy", "grandma", "jenny",
  "aria", "sonia", "natasha", "libby", "clara", "mia", "neerja", "prabhat", "ananya",
  "aditi", "veena", "leila", "ayanda", "heera", "kyoko", "yuna", "ting-ting", "mei-jia"
];

const RANKED_MALE_PATTERNS = [
  { key: "google uk english male", score: 1000 },
  { key: "google us english male", score: 990 },
  { key: "en-gb-x-rjs", score: 980 },
  { key: "en-gb-x-gba", score: 970 },
  { key: "en-us-x-iom", score: 960 },
  { key: "en-us-x-iol", score: 950 },
  { key: "en-us-x-tpd", score: 940 },
  { key: "en-au-x-aub", score: 930 },
  { key: "en-in-x-cxx", score: 920 },
  { key: "en-in-x-end", score: 910 },
  { key: "en-ng-x-tpd", score: 900 },
  { key: "#male", score: 890 },
  { key: "_male", score: 880 },
  { key: "-male", score: 870 },
  { key: " male", score: 860 },
  { key: "(male)", score: 850 },
  { key: "en_us_male", score: 840 },
  { key: "en_gb_male", score: 830 },
  { key: "smt english male", score: 820 },
  { key: "samsung english (male)", score: 810 },
  { key: "daniel", score: 800 },
  { key: "david", score: 790 },
  { key: "george", score: 780 },
  { key: "guy", score: 770 },
  { key: "arthur", score: 760 },
  { key: "oliver", score: 750 },
  { key: "aaron", score: 740 },
  { key: "alex", score: 730 },
  { key: "fred", score: 720 },
  { key: "eddy", score: 710 },
  { key: "reed", score: 700 },
  { key: "rocko", score: 690 },
  { key: "ralph", score: 680 },
  { key: "rishi", score: 670 },
  { key: "gordon", score: 660 },
  { key: "mark", score: 650 },
  { key: "christopher", score: 640 },
  { key: "eric", score: 630 },
  { key: "brian", score: 620 },
  { key: "ryan", score: 610 },
  { key: "andrew", score: 600 },
  { key: "steffan", score: 590 },
  { key: "thomas", score: 580 },
  { key: "richard", score: 570 },
  { key: "paul", score: 560 },
  { key: "james", score: 550 },
  { key: "michael", score: 540 }
];

class SpeechEngine {
  private isMuted: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isConfirmedMale: boolean = false;
  private activeAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.refreshVoice();
      window.speechSynthesis.onvoiceschanged = () => this.refreshVoice();
      window.addEventListener("touchstart", () => this.refreshVoice(), { passive: true });
      window.addEventListener("touchend", () => this.refreshVoice(), { passive: true });
      window.addEventListener("click", () => this.refreshVoice(), { passive: true });
    }
  }

  private refreshVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) {
      this.isConfirmedMale = false;
      return;
    }

    const nameLower = (v: SpeechSynthesisVoice) =>
      (v.name + " " + (v.voiceURI || "") + " " + (v.lang || "")).toLowerCase();

    const scoredVoices = voices.map((v) => {
      const fullStr = nameLower(v);
      const isEnglish = v.lang ? v.lang.toLowerCase().startsWith("en") : fullStr.includes("en");
      const isStrictFemale = STRICT_FEMALE_KEYWORDS.some((kw) => fullStr.includes(kw));

      if (isStrictFemale) {
        return { voice: v, score: -1000, isMale: false };
      }

      for (const pattern of RANKED_MALE_PATTERNS) {
        if (fullStr.includes(pattern.key)) {
          return { voice: v, score: pattern.score, isMale: true };
        }
      }

      if (fullStr.includes("male") && !fullStr.includes("female")) {
        return { voice: v, score: 500, isMale: true };
      }

      if (isEnglish) {
        return { voice: v, score: 50, isMale: false };
      }

      return { voice: v, score: 0, isMale: false };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    const top = scoredVoices[0];
    if (top && top.score > 0) {
      this.selectedVoice = top.voice;
      this.isConfirmedMale = top.isMale;
    } else if (voices.length > 0) {
      this.selectedVoice = voices[0];
      this.isConfirmedMale = false;
    }
  }

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
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.src = "";
      this.activeAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public async speak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (this.isMuted || typeof window === "undefined") {
      return;
    }

    this.stop();

    const cleanText = text.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "").trim();
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // 1. Attempt server-side neural male TTS (/api/tts)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });

      if (res.ok) {
        const contentType = res.headers.get("Content-Type") || "";
        if (contentType.includes("audio")) {
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;

          audio.onplay = () => {
            if (onStart) onStart();
          };

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (this.activeAudio === audio) {
              this.activeAudio = null;
            }
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            if (this.activeAudio === audio) {
              this.activeAudio = null;
            }
            this.fallbackClientSpeak(cleanText, onStart, onEnd);
          };

          await audio.play();
          return;
        }
      }
    } catch {
      // Ignore network error and fall back to client speech
    }

    // 2. Client speech synthesis fallback with male acoustic tuning
    this.fallbackClientSpeak(cleanText, onStart, onEnd);
  }

  private fallbackClientSpeak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const isMobile =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const isAndroid =
        typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

      if (!this.selectedVoice || !this.isConfirmedMale) {
        this.refreshVoice();
      }

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.lang = "en-US";
      utterance.volume = 1.0;

      utterance.pitch = 0.75; // Mathematical down-sampling into resonant 110Hz-140Hz male clinician register
      utterance.rate = 0.90;

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }
}

export const speechEngine = new SpeechEngine();
