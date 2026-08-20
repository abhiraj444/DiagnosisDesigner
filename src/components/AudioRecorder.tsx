'use client';

import React, { useState } from 'react';
import { Mic, Square, Trash2, Check, AlertCircle, Radio, Volume2, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useAudioRecorder, RecordedAudio } from '@/hooks/useAudioRecorder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface AudioRecorderProps {
  onAudioRecorded: (audio: RecordedAudio) => void;
  className?: string;
  buttonText?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AudioRecorder({
  onAudioRecorded,
  className = '',
  buttonText = 'Record Voice Note',
  size = 'sm',
}: AudioRecorderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isRecording,
    recordingTime,
    audioLevel,
    error,
    lastRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    clearLastRecording,
  } = useAudioRecorder({
    onRecordingComplete: (audio) => {
      // Audio is stored in lastRecording for preview
    },
  });

  const formatTime = (secs: number | undefined | null) => {
    if (secs === undefined || secs === null || isNaN(secs) || !Number.isFinite(secs) || secs < 0) {
      return '0:00';
    }
    const safeSecs = Math.max(0, Math.floor(secs));
    const m = Math.floor(safeSecs / 60);
    const s = Math.floor(safeSecs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStart = async () => {
    setIsOpen(true);
    await startRecording();
  };

  const handleConfirmAttach = () => {
    if (lastRecording) {
      onAudioRecorded(lastRecording);
      clearLastRecording();
      setIsOpen(false);
    }
  };

  const handleDiscard = () => {
    cancelRecording();
    clearLastRecording();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size={size}
              onClick={handleStart}
              className={`gap-1.5 text-xs font-medium border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 shrink-0 ${className}`}
            >
              <Mic className="h-3.5 w-3.5 text-primary" />
              <span>{buttonText}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Record a spoken clinical case or question to send to Gemini</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`p-3 rounded-lg border bg-card text-card-foreground shadow-sm space-y-3 w-full max-w-full overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isRecording ? (
            <div className="flex items-center gap-1.5 text-red-500 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider truncate">Recording Audio Note</span>
            </div>
          ) : lastRecording ? (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 min-w-0">
              <Volume2 className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold truncate">Audio Memo Ready ({formatTime(lastRecording.duration)})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Radio className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium truncate">Ready to record</span>
            </div>
          )}
        </div>

        <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded shrink-0">
          {formatTime(isRecording ? recordingTime : lastRecording?.duration || 0)}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Audio Wave Meter during active recording */}
      {isRecording && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1 h-8 bg-muted/40 rounded-md px-2 overflow-hidden">
            {Array.from({ length: 16 }).map((_, i) => {
              const heightMultiplier = Math.sin((i / 16) * Math.PI) * (audioLevel * 100);
              const barHeight = Math.max(4, Math.min(28, heightMultiplier + Math.random() * 6));
              return (
                <div
                  key={i}
                  className="w-1 sm:w-1.5 bg-red-500 rounded-full transition-all duration-75 shrink-0"
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-center text-muted-foreground animate-pulse">
            Speak clearly into your microphone...
          </p>
        </div>
      )}

      {/* Playback Audio element when recording is stopped */}
      {lastRecording && !isRecording && (
        <div className="space-y-2 w-full max-w-full overflow-hidden">
          <audio controls src={lastRecording.url} className="w-full h-9 rounded" />
          <p className="text-[11px] text-muted-foreground">
            Listen to verify your voice note before attaching it to the case.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleDiscard}
          className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Discard
        </Button>

        {isRecording ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop & Preview
          </Button>
        ) : lastRecording ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleStart}
              className="h-8 text-xs gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-record
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={handleConfirmAttach}
              className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              Attach Audio to Prompt
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
