'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordedAudio {
  blob: Blob;
  url: string;
  dataUri: string;
  duration: number; // in seconds
  fileName: string;
  mimeType: string;
  file: File;
}

interface UseAudioRecorderOptions {
  onRecordingComplete?: (audio: RecordedAudio) => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { onRecordingComplete } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // in seconds
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 1 for visualizer
  const [error, setError] = useState<string | null>(null);
  const [lastRecording, setLastRecording] = useState<RecordedAudio | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const onRecordingCompleteRef = useRef(onRecordingComplete);

  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const updateAudioMeter = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    // Normalize to 0 - 1
    const normalized = Math.min(1, avg / 128);
    setAudioLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(updateAudioMeter);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up AudioContext for real-time waveform / audio level feedback
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (err) {
        console.warn('AudioContext visualization setup note:', err);
      }

      // Pick best supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser use default
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const rawMimeType = mediaRecorder.mimeType || 'audio/webm';
        const actualMimeType = rawMimeType.split(';')[0].trim() || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const ext = actualMimeType.includes('mp4') ? 'mp4' : actualMimeType.includes('ogg') ? 'ogg' : 'webm';
        const fileName = `clinical-voice-memo-${timestamp}.${ext}`;
        const audioFile = new File([audioBlob], fileName, { type: actualMimeType });

        // Convert to data URI for Gemini multimodal API
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUri = reader.result as string;
          const recordedAudio: RecordedAudio = {
            blob: audioBlob,
            url: audioUrl,
            dataUri,
            duration: durationSec,
            fileName,
            mimeType: actualMimeType,
            file: audioFile,
          };
          setLastRecording(recordedAudio);
          onRecordingCompleteRef.current?.(recordedAudio);
        };
        reader.readAsDataURL(audioBlob);

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioLevel(0);
      };

      mediaRecorder.start(250); // Slice every 250ms
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start visualizer
      animationFrameRef.current = requestAnimationFrame(updateAudioMeter);
    } catch (err: any) {
      console.error('Failed to start audio recording:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser.'
          : 'Could not access microphone.'
      );
      setIsRecording(false);
    }
  }, [updateAudioMeter]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioLevel(0);
  }, []);

  const clearLastRecording = useCallback(() => {
    setLastRecording(null);
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    error,
    lastRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    clearLastRecording,
  };
}
