"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function useVoiceTherapist(onUserSpoke?: (text: string) => void) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState("");

  const isSpeakingRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Synchronized state & ref updater for strict half-duplex lock
  const setSpeakingState = useCallback((speaking: boolean) => {
    isSpeakingRef.current = speaking;
    setIsSpeaking(speaking);
  }, []);

  // 1. Helper to fetch server-side male audio stream (/api/tts) with 3.5s timeout & 2.5s retry
  const fetchServerAudioUrl = useCallback(async (text: string, timeoutMs = 3500): Promise<string | null> => {
    try {
      const cachedPromise = prefetchCacheRef.current.get(text);
      if (cachedPromise) {
        return await cachedPromise;
      }

      const fetchPromise = (async () => {
        const executeFetch = async (currentTimeout: number): Promise<string | null> => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), currentTimeout);

          try {
            const res = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);
            if (!res.ok) return null;
            const contentType = res.headers.get("Content-Type") || "";
            if (!contentType.includes("audio")) return null;

            const blob = await res.blob();
            return URL.createObjectURL(blob);
          } catch {
            clearTimeout(timeoutId);
            return null;
          }
        };

        // Primary fetch attempt (3500ms)
        let url = await executeFetch(timeoutMs);
        if (!url) {
          // Retry once with 2500ms before giving up
          url = await executeFetch(2500);
        }
        return url;
      })();

      prefetchCacheRef.current.set(text, fetchPromise);
      return await fetchPromise;
    } catch {
      return null;
    }
  }, []);

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

  // 3. Stop active recognition instance safely and cancel all pending restart timers
  const stopRecognitionInternal = useCallback(() => {
    wantListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
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

  // 4. Start Speech Recognition (Strict Half-Duplex Lock)
  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    // STRICT HALF-DUPLEX LOCK: Abort immediately if audio is playing
    if (isSpeakingRef.current) {
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingState(false);
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;

    // Clean up previous instance and timers
    stopRecognitionInternal();

    const permitted = hasMicPermission ?? (await requestMicAccess());
    if (!permitted) return;

    // Re-verify speaking lock after async mic check
    if (isSpeakingRef.current) {
      return;
    }

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

      // Silence detection: 2s on mobile, 1.2s on desktop
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
      setIsListening(false);
      // STRICT HALF-DUPLEX: ONLY restart if actively requested, NOT speaking, and not finalized
      if (wantListeningRef.current && !isSpeakingRef.current && !isFinalizedRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (wantListeningRef.current && !isSpeakingRef.current && !isFinalizedRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (restartErr) {
              setIsListening(false);
              wantListeningRef.current = false;
            }
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn("Recognition start exception:", err);
    }
  }, [hasMicPermission, setSpeakingState, stopRecognitionInternal]);

  const stopListening = useCallback(() => {
    stopRecognitionInternal();
  }, [stopRecognitionInternal]);

  // 5. Audio Queue Dispatcher (Pure Server-Side Male Stream — Strict Speech Handshake)
  const playNextInQueue = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (audioQueueRef.current.length === 0) {
      if (isStreamCompleteRef.current) {
        isPlayingQueueRef.current = false;
        setSpeakingState(false);
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

    // Pre-fetch next sentence in background
    if (audioQueueRef.current.length > 0) {
      for (const nextSentence of audioQueueRef.current.slice(0, 2)) {
        fetchServerAudioUrl(nextSentence);
      }
    }

    // Fetch server audio with automatic retry
    const audioUrl = await fetchServerAudioUrl(sentenceToSpeak);

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        // LOCK SPEECH HANDSHAKE IMMEDIATELY BEFORE PLAY
        setSpeakingState(true);
        stopRecognitionInternal();

        audio.onplay = () => {
          setSpeakingState(true);
          stopRecognitionInternal();
        };

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          setSpeakingState(false);
          playNextInQueue();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          setSpeakingState(false);
          playNextInQueue();
        };

        await audio.play();
        return;
      } catch (audioErr) {
        console.warn("Audio playback error:", audioErr);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
      }
    }

    // If server audio failed after retry, advance queue cleanly
    setSpeakingState(false);
    playNextInQueue();
  }, [fetchServerAudioUrl, setSpeakingState, stopRecognitionInternal]);

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

  // 6. Stream-to-Sentence Reader (Full sentence chunking on [. ? !] only)
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

        // Only split on full sentence delimiters (. ? !) to avoid micro-fragmentation
        let match;
        while ((match = sentenceBuffer.match(/([.?!])(?:\s+|$)/))) {
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
        setSpeakingState(false);
        if (onQueueFinishedRef.current) {
          const cb = onQueueFinishedRef.current;
          onQueueFinishedRef.current = null;
          cb();
        }
      }
    }
  }, [enqueueSentence, setSpeakingState, stopListening]);

  // 7. Static Speak Function (Pure Server-Side Male TTS Stream with Controlled 400ms Handshake)
  const speak = useCallback(async (text: string, onFinish?: () => void) => {
    if (typeof window === "undefined") return;

    // Immediately stop any active recognition or playback
    stopListening();
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    isStreamCompleteRef.current = true;

    const clean = text.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "").trim();
    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    const audioUrl = await fetchServerAudioUrl(clean);
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        // LOCK SPEECH HANDSHAKE IMMEDIATELY BEFORE PLAY
        setSpeakingState(true);
        stopRecognitionInternal();

        audio.onplay = () => {
          setSpeakingState(true);
          stopRecognitionInternal();
        };

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          setSpeakingState(false);
          if (onFinish) {
            setTimeout(() => {
              if (!isSpeakingRef.current) {
                onFinish();
              }
            }, 400);
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          setSpeakingState(false);
          if (onFinish) {
            setTimeout(() => {
              if (!isSpeakingRef.current) {
                onFinish();
              }
            }, 400);
          }
        };

        await audio.play();
        return;
      } catch (err) {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
      }
    }

    setSpeakingState(false);
    if (onFinish) {
      setTimeout(() => onFinish(), 400);
    }
  }, [fetchServerAudioUrl, setSpeakingState, stopListening, stopRecognitionInternal]);

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
    setSpeakingState(false);
  }, [setSpeakingState]);

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
