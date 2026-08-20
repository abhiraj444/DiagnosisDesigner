'use client';

import React, { useEffect, useState } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  disabled?: boolean;
  showFeedbackBadge?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  className = '',
  size = 'icon',
  variant = 'outline',
  disabled = false,
  showFeedbackBadge = true,
}: VoiceInputButtonProps) {
  const [lastNotification, setLastNotification] = useState<{
    words: number;
    timestamp: number;
  } | null>(null);

  const {
    isListening,
    isSupported,
    toggleListening,
    interimText,
    sessionSeconds,
    lastTranscribedWordCount,
    status,
    error,
    clearStatus,
  } = useVoiceInput({
    onResult: (text) => {
      onTranscript(text);
    },
    continuous: true,
  });

  useEffect(() => {
    if (status === 'completed' && lastTranscribedWordCount > 0) {
      setLastNotification({
        words: lastTranscribedWordCount,
        timestamp: Date.now(),
      });

      // Auto-hide feedback after 6 seconds
      const timer = setTimeout(() => {
        setLastNotification(null);
        clearStatus();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [status, lastTranscribedWordCount, clearStatus]);

  if (!isSupported) {
    return null;
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isListening ? 'destructive' : variant}
              size={size}
              onClick={toggleListening}
              disabled={disabled}
              className={`relative transition-all duration-200 ${
                isListening
                  ? 'animate-pulse ring-2 ring-red-500/50 shadow-md shadow-red-500/30'
                  : ''
              } ${className}`}
              aria-label={isListening ? 'Stop Voice Dictation' : 'Start Voice Dictation'}
            >
              {isListening ? (
                <>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <MicOff className="h-4 w-4 text-white shrink-0" />
                </>
              ) : (
                <Mic className="h-4 w-4 shrink-0" />
              )}
              <span className="sr-only">{isListening ? 'Stop dictation' : 'Voice dictation'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {error ? (
              <p className="flex items-center gap-1 text-red-400">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            ) : isListening ? (
              <p className="font-semibold text-red-500">Listening ({formatSeconds(sessionSeconds)})... Click to stop</p>
            ) : (
              <p>Click to dictate clinical notes/questions into prompt</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Live Active Dictation Floating Wave & Interim Preview */}
      {isListening && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-xs shadow-xs animate-in fade-in zoom-in-95 duration-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-mono font-semibold">{formatSeconds(sessionSeconds)}</span>
          <span className="text-[11px] font-medium hidden sm:inline">
            {interimText ? `"${interimText.slice(0, 30)}..."` : 'Listening...'}
          </span>
        </div>
      )}

      {/* Post-Recording Confirmation Badge */}
      {!isListening && showFeedbackBadge && lastNotification && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs shadow-xs animate-in fade-in slide-in-from-left-2 duration-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">
            Transcribed {lastNotification.words} {lastNotification.words === 1 ? 'word' : 'words'} into prompt
          </span>
          <button
            type="button"
            onClick={() => {
              setLastNotification(null);
              clearStatus();
            }}
            className="hover:opacity-75 p-0.5"
            title="Dismiss notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
