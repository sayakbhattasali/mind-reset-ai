"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function useVoiceTherapist(onUserSpoke?: (text: string) => void) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isConfirmedMaleRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>("");
  const accumulatedFinalsRef = useRef<string>("");
  const isFinalizedRef = useRef<boolean>(false);
  const wantListeningRef = useRef<boolean>(false);
  const onUserSpokeRef = useRef(onUserSpoke);

  // Audio queue for stream-to-sentence continuous playback
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);
  const isStreamCompleteRef = useRef<boolean>(false);
  const onQueueFinishedRef = useRef<(() => void) | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const prefetchCacheRef = useRef<Map<string, Promise<string | null>>>(new Map());

  // Keep callback ref fresh across state changes
  useEffect(() => {
    onUserSpokeRef.current = onUserSpoke;
  }, [onUserSpoke]);

  // Helper to fetch server-side high-fidelity male audio stream (OpenAI onyx / ElevenLabs)
  const fetchServerAudioUrl = useCallback(async (text: string): Promise<string | null> => {
    try {
      const cachedPromise = prefetchCacheRef.current.get(text);
      if (cachedPromise) {
        return await cachedPromise;
      }

      const fetchPromise = (async () => {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) return null;
        const contentType = res.headers.get("Content-Type") || "";
        if (!contentType.includes("audio")) return null;

        const blob = await res.blob();
        return URL.createObjectURL(blob);
      })();

      prefetchCacheRef.current.set(text, fetchPromise);
      return await fetchPromise;
    } catch {
      return null;
    }
  }, []);

  // 1. Voice selector: Exhaustive detection & ranking for natural, deep male clinical voices
  const selectTherapistVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Strict female keywords to disqualify from male voice matching
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

    // Priority ranked male voice patterns across Android Chrome, iOS Safari, macOS, Windows
    const RANKED_MALE_PATTERNS = [
      // Top Android Google Speech Services Male Voices
      { key: "google uk english male", score: 1000 },
      { key: "google us english male", score: 990 },
      { key: "en-gb-x-rjs", score: 980 }, // Android Google UK Male 1
      { key: "en-gb-x-gba", score: 970 }, // Android Google UK Male 2
      { key: "en-us-x-iom", score: 960 }, // Android Google US Male 1
      { key: "en-us-x-iol", score: 950 }, // Android Google US Male 2
      { key: "en-us-x-tpd", score: 940 }, // Android Google US Male 3
      { key: "en-au-x-aub", score: 930 }, // Android Google AU Male
      { key: "en-in-x-cxx", score: 920 }, // Android Google IN Male
      { key: "en-in-x-end", score: 910 }, // Android Google IN Male 2
      { key: "en-ng-x-tpd", score: 900 }, // Android Google NG Male
      { key: "#male", score: 890 },        // Android tag #male_1 / #male_2
      { key: "_male", score: 880 },
      { key: "-male", score: 870 },
      { key: " male", score: 860 },
      { key: "(male)", score: 850 },
      { key: "en_us_male", score: 840 },
      { key: "en_gb_male", score: 830 },
      { key: "smt english male", score: 820 },
      { key: "samsung english (male)", score: 810 },

      // Top Desktop / iOS Male Voices
      { key: "daniel", score: 800 },       // Apple / Windows UK Male (Deep, clear)
      { key: "david", score: 790 },        // Windows US Male (Microsoft David)
      { key: "george", score: 780 },       // Windows UK Male (Microsoft George)
      { key: "guy", score: 770 },          // Microsoft Guy
      { key: "arthur", score: 760 },       // Apple UK Male
      { key: "oliver", score: 750 },       // Apple UK Male
      { key: "aaron", score: 740 },        // Apple US Male
      { key: "alex", score: 730 },         // Apple US Male
      { key: "fred", score: 720 },
      { key: "eddy", score: 710 },
      { key: "reed", score: 700 },
      { key: "rocko", score: 690 },
      { key: "ralph", score: 680 },
      { key: "rishi", score: 670 },
      { key: "gordon", score: 660 },
      { key: "mark", score: 650 },         // Windows Mark
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

    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) {
      isConfirmedMaleRef.current = false;
      return;
    }

    const nameLower = (v: SpeechSynthesisVoice) =>
      (v.name + " " + (v.voiceURI || "") + " " + (v.lang || "")).toLowerCase();

    // Score all available voices
    const scoredVoices = voices.map((v) => {
      const fullStr = nameLower(v);
      const isEnglish = v.lang ? v.lang.toLowerCase().startsWith("en") : fullStr.includes("en");
      const isStrictFemale = STRICT_FEMALE_KEYWORDS.some((kw) => fullStr.includes(kw));

      if (isStrictFemale) {
        return { voice: v, score: -1000, isMale: false };
      }

      // Check against ranked male patterns
      for (const pattern of RANKED_MALE_PATTERNS) {
        if (fullStr.includes(pattern.key)) {
          return { voice: v, score: pattern.score, isMale: true };
        }
      }

      // If voice contains generic 'male' without female
      if (fullStr.includes("male") && !fullStr.includes("female")) {
        return { voice: v, score: 500, isMale: true };
      }

      // General English voice without female indicators
      if (isEnglish) {
        return { voice: v, score: 50, isMale: false };
      }

      return { voice: v, score: 0, isMale: false };
    });

    // Sort descending by score
    scoredVoices.sort((a, b) => b.score - a.score);

    const top = scoredVoices[0];
    if (top && top.score > 0) {
      selectedVoiceRef.current = top.voice;
      isConfirmedMaleRef.current = top.isMale;
    } else if (voices.length > 0) {
      selectedVoiceRef.current = voices[0];
      isConfirmedMaleRef.current = false;
    }
  }, []);

  // Helper to apply male therapist acoustic parameters (Pitch, Rate, Lang)
  const applyTherapistAcoustics = useCallback((utterance: SpeechSynthesisUtterance) => {
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const isAndroid =
      typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.lang = "en-US";
    utterance.volume = 1.0;

    if (isConfirmedMaleRef.current) {
      // Confirmed male voice detected on system
      if (isAndroid || isMobile) {
        utterance.pitch = 0.86; // Deep, calm therapist tone for phone speakers
        utterance.rate = 0.90;
      } else {
        utterance.pitch = 0.92; // Natural, warm baritone on desktop/laptop
        utterance.rate = 0.92;
      }
    } else {
      // Fallback / Default / Unconfirmed voice (Default is female on Android & iOS)
      // Dropping pitch to 0.72 - 0.74 acoustically shifts any voice into a deep male baritone!
      utterance.pitch = isAndroid ? 0.72 : 0.74;
      utterance.rate = 0.88;
    }
  }, []);

  // Mobile voice initializers: Mobile Chrome and Safari often populate getVoices() on first touch/interaction
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    selectTherapistVoice();
    window.speechSynthesis.onvoiceschanged = selectTherapistVoice;

    const handleUserInteraction = () => {
      selectTherapistVoice();
    };

    window.addEventListener("touchstart", handleUserInteraction, { passive: true });
    window.addEventListener("touchend", handleUserInteraction, { passive: true });
    window.addEventListener("click", handleUserInteraction, { passive: true });
    window.addEventListener("pointerdown", handleUserInteraction, { passive: true });

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
        window.removeEventListener("touchstart", handleUserInteraction);
        window.removeEventListener("touchend", handleUserInteraction);
        window.removeEventListener("click", handleUserInteraction);
        window.removeEventListener("pointerdown", handleUserInteraction);
      }
    };
  }, [selectTherapistVoice]);

  // 2. Hardware mic permission
  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone access denied:", err);
      setHasMicPermission(false);
      return false;
    }
  };

  // 3. Stop active recognition instance safely
  const stopRecognitionInternal = useCallback(() => {
    wantListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);


  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;

    // Clean up previous instance
    stopRecognitionInternal();

    const permitted = hasMicPermission ?? (await requestMicAccess());
    if (!permitted) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setTranscript("");
    lastTranscriptRef.current = "";
    accumulatedFinalsRef.current = "";
    isFinalizedRef.current = false;
    wantListeningRef.current = true;

    // Detect mobile: mobile Chrome kills continuous recognition randomly
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const recognition = new SpeechRecognition();
    // On mobile: use non-continuous mode and auto-restart to avoid garbled submissions
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      isFinalizedRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let currentFinal = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          currentFinal += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (currentFinal) {
        accumulatedFinalsRef.current += currentFinal;
      }

      const combinedText = (accumulatedFinalsRef.current + " " + interimTranscript).replace(/\s+/g, " ").trim();
      if (!combinedText) return;

      setTranscript(combinedText);
      lastTranscriptRef.current = combinedText;

      // Clear previous timer on every detected vocal sound/word
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Silence detection: 2s on mobile (more forgiving), 1.2s on desktop
      const silenceMs = isMobile ? 2000 : 1200;
      silenceTimerRef.current = setTimeout(() => {
        const textToSubmit = lastTranscriptRef.current.trim();
        if (textToSubmit.length >= 2 && !isFinalizedRef.current) {
          isFinalizedRef.current = true;
          wantListeningRef.current = false;
          stopRecognitionInternal();
          setTranscript("");
          if (onUserSpokeRef.current) {
            onUserSpokeRef.current(textToSubmit);
          }
        }
      }, silenceMs);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setIsListening(false);
        wantListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      // On mobile, recognition ends randomly mid-sentence.
      // Instead of submitting partial garbage, silently restart if we still want to listen.
      if (wantListeningRef.current && !isFinalizedRef.current) {
        try {
          setTimeout(() => {
            if (wantListeningRef.current && !isFinalizedRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (restartErr) {
                setIsListening(false);
                wantListeningRef.current = false;
              }
            }
          }, 100);
        } catch (e) {
          setIsListening(false);
          wantListeningRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn("Recognition start exception:", err);
    }
  }, [hasMicPermission, stopRecognitionInternal]);

  const stopListening = useCallback(() => {
    stopRecognitionInternal();
  }, [stopRecognitionInternal]);

  // Client speech synthesis fallback helper
  const fallbackClientSpeak = useCallback((sentence: string, onEnd: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentence);
    if (!selectedVoiceRef.current || !isConfirmedMaleRef.current) {
      selectTherapistVoice();
    }
    applyTherapistAcoustics(utterance);
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
    window.speechSynthesis.speak(utterance);
  }, [applyTherapistAcoustics, selectTherapistVoice]);

  // 5. Audio Queue Dispatcher for Streamed Sentences (Server-Side TTS + Client Fallback)
  const playNextInQueue = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (audioQueueRef.current.length === 0) {
      if (isStreamCompleteRef.current) {
        isPlayingQueueRef.current = false;
        setIsSpeaking(false);
        if (onQueueFinishedRef.current) {
          const cb = onQueueFinishedRef.current;
          onQueueFinishedRef.current = null;
          cb();
        }
      } else {
        isPlayingQueueRef.current = false;
      }
      return;
    }

    const sentenceToSpeak = audioQueueRef.current.shift()!;
    isPlayingQueueRef.current = true;
    setIsSpeaking(true);

    // Pre-fetch next sentences in parallel for instant zero-latency transitions
    if (audioQueueRef.current.length > 0) {
      for (const nextSentence of audioQueueRef.current.slice(0, 2)) {
        fetchServerAudioUrl(nextSentence);
      }
    }

    // Try server-side audio first (OpenAI onyx / ElevenLabs)
    const audioUrl = await fetchServerAudioUrl(sentenceToSpeak);

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
        };

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          playNextInQueue();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          fallbackClientSpeak(sentenceToSpeak, () => playNextInQueue());
        };

        await audio.play();
        return;
      } catch (audioErr) {
        console.warn("Audio playback error, falling back to speech synthesis:", audioErr);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
      }
    }

    // Fallback: Enhanced Client-Side Male Speech Synthesis
    fallbackClientSpeak(sentenceToSpeak, () => {
      playNextInQueue();
    });
  }, [fallbackClientSpeak, fetchServerAudioUrl]);

  const enqueueSentence = useCallback((sentence: string) => {
    const clean = sentence.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "").trim();
    if (!clean) return;

    // Immediately start prefetching audio in background
    fetchServerAudioUrl(clean);

    audioQueueRef.current.push(clean);
    if (!isPlayingQueueRef.current) {
      playNextInQueue();
    }
  }, [fetchServerAudioUrl, playNextInQueue]);

  // 6. Stream-to-Sentence Reader & Immediate Playback
  const speakStream = useCallback(async (
    stream: ReadableStream<Uint8Array>,
    onUpdateText: (accumulatedText: string) => void,
    onFinish: (fullText: string, shouldEnd: boolean) => void
  ) => {
    if (typeof window === "undefined") return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();

    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    isStreamCompleteRef.current = false;

    let fullAccumulatedText = "";
    let sentenceBuffer = "";
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    onQueueFinishedRef.current = () => {
      const shouldEnd = fullAccumulatedText.includes("[END_SESSION]");
      const cleanFull = fullAccumulatedText.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "").trim();
      onFinish(cleanFull, shouldEnd);
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullAccumulatedText += chunk;
        sentenceBuffer += chunk;

        const cleanDisplay = fullAccumulatedText.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "");
        onUpdateText(cleanDisplay);

        // Detect sentence and clause boundaries (. ? ! , ; \n) to trigger audio within milliseconds
        let match;
        while ((match = sentenceBuffer.match(/([.?!])(?:\s+|$)|([,;])\s+/))) {
          const endIdx = match.index! + 1;
          const completeChunk = sentenceBuffer.slice(0, endIdx).trim();
          sentenceBuffer = sentenceBuffer.slice(match.index! + match[0].length);

          if (completeChunk) {
            enqueueSentence(completeChunk);
          }
        }
      }

      if (sentenceBuffer.trim()) {
        enqueueSentence(sentenceBuffer.trim());
      }
    } catch (err) {
      console.error("Stream reading error:", err);
    } finally {
      isStreamCompleteRef.current = true;
      if (!isPlayingQueueRef.current && audioQueueRef.current.length === 0) {
        setIsSpeaking(false);
        if (onQueueFinishedRef.current) {
          const cb = onQueueFinishedRef.current;
          onQueueFinishedRef.current = null;
          cb();
        }
      }
    }
  }, [enqueueSentence, stopListening]);

  // 7. Static Speak Function (Server-Side TTS + Client Fallback)
  const speak = useCallback(async (text: string, onFinish?: () => void) => {
    if (typeof window === "undefined") return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();

    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    isStreamCompleteRef.current = true;

    const clean = text.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "").trim();
    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    setIsSpeaking(true);

    // Try server-side audio first
    const audioUrl = await fetchServerAudioUrl(clean);
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          setIsSpeaking(false);
          if (onFinish) onFinish();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          fallbackClientSpeak(clean, () => {
            setIsSpeaking(false);
            if (onFinish) onFinish();
          });
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn("Server audio playback failed, using client TTS fallback:", err);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
      }
    }

    // Client TTS fallback
    fallbackClientSpeak(clean, () => {
      setIsSpeaking(false);
      if (onFinish) onFinish();
    });
  }, [fallbackClientSpeak, fetchServerAudioUrl, stopListening]);

  // 8. Immediate Audio & Mic Termination
  const stopSpeaking = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    isStreamCompleteRef.current = true;
    onQueueFinishedRef.current = null;
    setIsSpeaking(false);
  }, []);

  const terminateAllAudio = useCallback(() => {
    stopSpeaking();
    stopListening();
  }, [stopSpeaking, stopListening]);

  return {
    isSpeaking,
    isListening,
    transcript,
    hasMicPermission,
    requestMicAccess,
    startListening,
    stopListening,
    speak,
    speakStream,
    stopSpeaking,
    terminateAllAudio,
  };
}


