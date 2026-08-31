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
  const isFinalizedRef = useRef<boolean>(false);
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

  // 1. Preload and lock consistent deep, calm male voice
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const selectTherapistVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const maleVoice =
        voices.find((v) => v.lang.startsWith("en") && (v.name.includes("David") || v.name.includes("Guy") || v.name.includes("George") || v.name.includes("Male") || v.name.includes("Natural (Male)"))) ||
        voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google UK English Male")) ||
        voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Daniel") || v.name.includes("Alex") || v.name.includes("Aaron"))) ||
        voices.find((v) => v.lang.startsWith("en-US")) ||
        voices[0];

      selectedVoiceRef.current = maleVoice;
    };

    selectTherapistVoice();
    window.speechSynthesis.onvoiceschanged = selectTherapistVoice;
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

  // 3. Stop active recognition instance safely
  const stopRecognitionInternal = useCallback(() => {
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

  // 4. Start fresh recognition instance for the active turn
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
    isFinalizedRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      isFinalizedRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let currentText = "";
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }

      const trimmed = currentText.trim();
      setTranscript(trimmed);
      lastTranscriptRef.current = trimmed;

      // Clear previous timer on every detected vocal sound/word
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Natural 1400ms silence detection: gives user ample time to finish sentences/thoughts
      silenceTimerRef.current = setTimeout(() => {
        const textToSubmit = lastTranscriptRef.current.trim();
        if (textToSubmit.length >= 2 && !isFinalizedRef.current) {
          isFinalizedRef.current = true;
          stopRecognitionInternal();
          setTranscript("");
          if (onUserSpokeRef.current) {
            onUserSpokeRef.current(textToSubmit);
          }
        }
      }, 1400);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // If recognition stopped unexpectedly before timer finalized speech, submit if valid
      if (!isFinalizedRef.current && lastTranscriptRef.current.trim().length >= 2) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        isFinalizedRef.current = true;
        const textToSubmit = lastTranscriptRef.current.trim();
        stopRecognitionInternal();
        setTranscript("");
        if (onUserSpokeRef.current) {
          onUserSpokeRef.current(textToSubmit);
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
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.pitch = 0.88;
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
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.pitch = 0.88;
    utterance.rate = 0.90;

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


