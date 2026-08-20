'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, X, Music, Disc } from 'lucide-react';
import { Button } from './ui/button';

interface AudioPlayerCardProps {
  src: string; // url or dataUri
  fileName: string;
  duration?: number; // seconds
  onRemove?: () => void;
  className?: string;
  isCompact?: boolean;
}

export function AudioPlayerCard({
  src,
  fileName,
  duration,
  onRemove,
  className = '',
  isCompact = false,
}: AudioPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number>(() => {
    if (duration && Number.isFinite(duration) && duration > 0) {
      return Math.round(duration);
    }
    return 0;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (duration && Number.isFinite(duration) && duration > 0) {
      setAudioDuration(Math.round(duration));
    }
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
        setAudioDuration(Math.round(audio.duration));
      } else if (duration && Number.isFinite(duration) && duration > 0) {
        setAudioDuration(Math.round(duration));
      }
    };

    const handleTimeUpdate = () => {
      const cur = Math.round(audio.currentTime);
      setCurrentTime(cur);
      // In case duration metadata was Infinity (common with WebM recordings in Chrome), update audioDuration to max observed time
      if (cur > audioDuration) {
        setAudioDuration(cur);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, duration, audioDuration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio playback error:', e);
      });
    }
  };

  const formatTime = (secs: number | undefined | null) => {
    if (secs === undefined || secs === null || isNaN(secs) || !Number.isFinite(secs) || secs < 0) {
      return '0:00';
    }
    const safeSecs = Math.max(0, Math.floor(secs));
    const m = Math.floor(safeSecs / 60);
    const s = Math.floor(safeSecs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const safeDuration = audioDuration > 0 ? audioDuration : Math.max(1, currentTime);

  return (
    <div
      className={`relative flex items-center gap-2.5 sm:gap-3 rounded-lg border bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 p-2 sm:p-2.5 shadow-xs border-blue-200 dark:border-blue-800/60 w-full max-w-full overflow-hidden ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <Button
        type="button"
        size="icon"
        variant="default"
        onClick={togglePlay}
        className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Volume2 className={`h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 ${isPlaying ? 'animate-bounce' : ''}`} />
            <span className="text-xs font-semibold text-foreground truncate block" title={fileName}>
              {fileName}
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium text-muted-foreground whitespace-nowrap shrink-0">
            {formatTime(currentTime)} / {formatTime(audioDuration > 0 ? audioDuration : duration || 0)}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full">
          <input
            type="range"
            min="0"
            max={safeDuration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-muted/80 transition-colors shrink-0"
          title="Remove audio file"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
