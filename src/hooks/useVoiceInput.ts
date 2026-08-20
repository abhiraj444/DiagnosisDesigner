'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceInputOptions {
  onResult?: (text: string) => void;
  lang?: string;
  continuous?: boolean;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onResult, lang = 'en-US', continuous = true } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [lastTranscribedWordCount, setLastTranscribedWordCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'listening' | 'completed' | 'error'>('idle');
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const onResultRef = useRef(onResult);
  const accumulatedTextRef = useRef('');
  const currentSessionWordsRef = useRef(0);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalSegment = '';
      let interimSegment = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const piece = item[0].transcript;
        if (item.isFinal) {
          finalSegment += piece;
        } else {
          interimSegment += piece;
        }
      }

      if (finalSegment) {
        const trimmed = finalSegment.trim();
        accumulatedTextRef.current = accumulatedTextRef.current
          ? `${accumulatedTextRef.current} ${trimmed}`
          : trimmed;
        setTranscript(accumulatedTextRef.current);
        setInterimText('');
        const words = trimmed.split(/\s+/).filter(Boolean).length;
        currentSessionWordsRef.current += words;
        onResultRef.current?.(trimmed);
      } else if (interimSegment) {
        setInterimText(interimSegment);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      if (event.error === 'no-speech') {
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
        setStatus('error');
        shouldListenRef.current = false;
        setIsListening(false);
      } else {
        setError(`Voice error: ${event.error}`);
        setStatus('error');
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.warn('Auto-restart recognition note:', err);
              setIsListening(false);
              shouldListenRef.current = false;
              setStatus('idle');
            }
          }
        }, 150);
      } else {
        setIsListening(false);
        if (statusRef.current !== 'error') {
          if (currentSessionWordsRef.current > 0) {
            setLastTranscribedWordCount(currentSessionWordsRef.current);
            setStatus('completed');
          } else {
            setStatus('idle');
          }
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, continuous]);

  const startListening = useCallback(async () => {
    setError(null);
    accumulatedTextRef.current = '';
    currentSessionWordsRef.current = 0;
    setTranscript('');
    setInterimText('');
    setSessionSeconds(0);
    shouldListenRef.current = true;
    setStatus('listening');

    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // CRITICAL for Android / Mobile Chrome: release media tracks immediately so speech recognition engine can capture mic
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.warn('Audio permission request:', err);
        setError('Microphone permission denied. Please allow microphone access in browser settings.');
        setStatus('error');
        shouldListenRef.current = false;
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        return;
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        if (e?.name !== 'InvalidStateError') {
          console.error('Failed to start speech recognition:', e);
          setError('Could not start voice recognition.');
          setStatus('error');
          shouldListenRef.current = false;
          if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        }
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    setIsListening(false);
    setInterimText('');

    if (currentSessionWordsRef.current > 0) {
      setLastTranscribedWordCount(currentSessionWordsRef.current);
      setStatus('completed');
    } else {
      setStatus('idle');
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Failed to stop speech recognition:', e);
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (shouldListenRef.current || isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearStatus = useCallback(() => {
    setStatus('idle');
    setLastTranscribedWordCount(0);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimText,
    sessionSeconds,
    lastTranscribedWordCount,
    status,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearStatus,
  };
}
