"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function useVoiceTherapist(onUserSpoke?: (text: string) => void) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
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

  // Keep callback ref fresh across state changes
  useEffect(() => {
    onUserSpokeRef.current = onUserSpoke;
  }, [onUserSpoke]);

  // 1. Voice selector: Ranked preference for natural, high-fidelity male voices
  const selectTherapistVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Highest quality male voices in priority order across Android, iOS, macOS, Windows
    const RANKED_MALE_VOICES = [
      "google uk english male",
      "daniel",
      "david",
      "george",
      "guy",
      "arthur",
      "oliver",
      "aaron",
      "alex",
      "en-gb-x-rjs",
      "en-gb-x-gba",
      "en-us-x-iom",
      "en-us-x-iol",
      "en-us-x-tpd",
      "en-au-x-aub",
      "en_us_male",
      "english united states male",
      "english (united states, male)",
      "james",
      "mark",
      "thomas",
      "richard",
      "paul",
      "uk english male",
      "male"
    ];

    const KNOWN_FEMALE_KEYWORDS = [
      "female", "woman", "samantha", "karen", "victoria", "fiona", "moira", "tessa",
      "zira", "susan", "hazel", "linda", "catherine", "ava", "allison",
      "siri", "google uk english female", "google us english",
      "en-us-x-sfg", "en-us-x-tpc", "en-us-x-iob", "en-gb-x-gbb",
      "zoe", "kate", "nicky", "stephanie"
    ];

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    const nameLower = (v: SpeechSynthesisVoice) => (v.name + " " + (v.voiceURI || "")).toLowerCase();

    // 1. Find the highest ranked explicit male voice available on this device
    for (const keyword of RANKED_MALE_VOICES) {
      const match = enVoices.find((v) => nameLower(v).includes(keyword));
      if (match) {
        selectedVoiceRef.current = match;
        return;
      }
    }

    // 2. Fallback: Any English voice that is definitely not in the female blacklist
    const notFemale = enVoices.filter((v) =>
      !KNOWN_FEMALE_KEYWORDS.some((kw) => nameLower(v).includes(kw))
    );
    if (notFemale.length) {
      selectedVoiceRef.current = notFemale[0];
      return;
    }

    // 3. Last resort fallback
    if (enVoices.length) {
      selectedVoiceRef.current = enVoices[0];
      return;
    }

    selectedVoiceRef.current = voices[0];
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    selectTherapistVoice();
    window.speechSynthesis.onvoiceschanged = selectTherapistVoice;
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
          // Small delay to avoid rapid restart loops
          setTimeout(() => {
            if (wantListeningRef.current && !isFinalizedRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (restartErr) {
                // If restart fails, give up gracefully
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

  // 5. Audio Queue Dispatcher for Streamed Sentences
  const playNextInQueue = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

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

    const utterance = new SpeechSynthesisUtterance(sentenceToSpeak);
    if (!selectedVoiceRef.current) {
      selectTherapistVoice();
    }
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.pitch = 1.0;
    utterance.rate = 0.92;

    utterance.onend = () => {
      playNextInQueue();
    };

    utterance.onerror = () => {
      playNextInQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const enqueueSentence = useCallback((sentence: string) => {
    const clean = sentence.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "").trim();
    if (!clean) return;

    audioQueueRef.current.push(clean);
    if (!isPlayingQueueRef.current) {
      playNextInQueue();
    }
  }, [playNextInQueue]);

  // 6. Stream-to-Sentence Reader & Immediate Playback
  const speakStream = useCallback(async (
    stream: ReadableStream<Uint8Array>,
    onUpdateText: (accumulatedText: string) => void,
    onFinish: (fullText: string, shouldEnd: boolean) => void
  ) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
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

  // 7. Static Speak Function
  const speak = useCallback((text: string, onFinish?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    stopListening();
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    isStreamCompleteRef.current = true;

    const clean = text.replace(/\[END_SESSION\]/g, "").replace(/[*_#`]/g, "").trim();
    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    if (!selectedVoiceRef.current) {
      selectTherapistVoice();
    }
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.pitch = 1.0;
    utterance.rate = 0.92;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onFinish) onFinish();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onFinish) onFinish();
    };

    window.speechSynthesis.speak(utterance);
  }, [stopListening]);

  // 8. Immediate Audio & Mic Termination
  const stopSpeaking = useCallback(() => {
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


