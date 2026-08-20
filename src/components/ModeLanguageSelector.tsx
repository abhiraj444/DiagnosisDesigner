'use client';

import React from 'react';
import { useSettings, type TargetLanguage, type AudienceMode } from '@/context/SettingsContext';
import { Stethoscope, Sparkles, Globe, BookOpen, Info } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ModeLanguageSelectorProps {
  className?: string;
  compact?: boolean;
  onModeChange?: (mode: AudienceMode) => void;
  onLanguageChange?: (lang: TargetLanguage) => void;
}

export function ModeLanguageSelector({
  className = '',
  compact = false,
  onModeChange,
  onLanguageChange,
}: ModeLanguageSelectorProps) {
  const { language, setLanguage, audienceMode, setAudienceMode } = useSettings();

  const handleModeSelect = (mode: AudienceMode) => {
    setAudienceMode(mode);
    if (onModeChange) onModeChange(mode);
  };

  const handleLanguageSelect = (lang: TargetLanguage) => {
    setLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  if (compact) {
    return (
      <div className={cn('w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2', className)}>
        {/* Audience Mode Toggle */}
        <div className="grid grid-cols-2 w-full sm:w-auto rounded-lg border bg-muted/50 p-0.5 shadow-2xs">
          <Button
            type="button"
            variant={audienceMode === 'doctor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeSelect('doctor')}
            className={cn(
              'h-8 px-2 text-xs font-semibold gap-1.5 rounded-md transition-all justify-center',
              audienceMode === 'doctor'
                ? 'shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Doctor</span>
              <span className="hidden sm:inline">Doctor (Clinical)</span>
            </span>
          </Button>
          <Button
            type="button"
            variant={audienceMode === 'simplified' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeSelect('simplified')}
            className={cn(
              'h-8 px-2 text-xs font-semibold gap-1.5 rounded-md transition-all justify-center',
              audienceMode === 'simplified'
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Simplified</span>
              <span className="hidden sm:inline">Simplified</span>
            </span>
          </Button>
        </div>

        {/* Language Toggle */}
        <div className="grid grid-cols-2 w-full sm:w-auto rounded-lg border bg-muted/50 p-0.5 shadow-2xs">
          <Button
            type="button"
            variant={language === 'english' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLanguageSelect('english')}
            className={cn(
              'h-8 px-2 text-xs font-semibold gap-1 rounded-md transition-all justify-center',
              language === 'english'
                ? 'shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Globe className="h-3 w-3 shrink-0" />
            <span>English</span>
          </Button>
          <Button
            type="button"
            variant={language === 'hinglish' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLanguageSelect('hinglish')}
            className={cn(
              'h-8 px-2 text-xs font-semibold gap-1 rounded-md transition-all justify-center',
              language === 'hinglish'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>🇮🇳 Hinglish</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl border bg-gradient-to-r from-card to-muted/30 p-3 sm:p-4 shadow-2xs space-y-3 overflow-hidden',
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Audience Mode Section */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Presentation & Tone</span>
          </div>
          <div className="grid grid-cols-2 w-full rounded-lg border bg-background/90 p-1 shadow-2xs gap-1">
            <Button
              type="button"
              variant={audienceMode === 'doctor' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeSelect('doctor')}
              className={cn(
                'h-9 px-2 text-xs font-semibold gap-1.5 rounded-md transition-all justify-center w-full min-w-0',
                audienceMode === 'doctor'
                  ? 'shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                <span className="inline lg:hidden">Doctor</span>
                <span className="hidden lg:inline">Doctor / Clinical</span>
              </span>
            </Button>
            <Button
              type="button"
              variant={audienceMode === 'simplified' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeSelect('simplified')}
              className={cn(
                'h-9 px-2 text-xs font-semibold gap-1.5 rounded-md transition-all justify-center w-full min-w-0',
                audienceMode === 'simplified'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                <span className="inline lg:hidden">Simplified</span>
                <span className="hidden lg:inline">Simplified / Patient</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Output Language Section */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Output Language</span>
          </div>
          <div className="grid grid-cols-2 w-full rounded-lg border bg-background/90 p-1 shadow-2xs gap-1">
            <Button
              type="button"
              variant={language === 'english' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLanguageSelect('english')}
              className={cn(
                'h-9 px-2 text-xs font-semibold gap-1.5 rounded-md transition-all justify-center w-full min-w-0',
                language === 'english'
                  ? 'shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>🇬🇧</span>
              <span className="truncate">English</span>
            </Button>
            <Button
              type="button"
              variant={language === 'hinglish' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLanguageSelect('hinglish')}
              className={cn(
                'h-9 px-2 text-xs font-semibold gap-1.5 rounded-md transition-all justify-center w-full min-w-0',
                language === 'hinglish'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>🇮🇳</span>
              <span className="truncate">
                <span className="inline lg:hidden">Hinglish</span>
                <span className="hidden lg:inline">Hinglish (Roman)</span>
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Explanatory Context Note */}
      <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-[11px] sm:text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5 min-w-0 flex-1">
          {audienceMode === 'doctor' ? (
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Doctor Mode:</span> Academic clinical precision, exact pathophysiology, standard guideline citations (ACC/AHA, ESC, KDIGO, GOLD), and PG pearls in{' '}
              <span className="font-semibold text-foreground">{language === 'english' ? 'English' : 'fluent Hinglish'}</span>.
            </p>
          ) : (
            <p className="leading-relaxed">
              <span className="font-semibold text-amber-600 dark:text-amber-400">First-Principles Mode:</span> Deconstructs conditions from fundamental biology & physics using intuitive analogies to demystify health in{' '}
              <span className="font-semibold text-foreground">{language === 'english' ? 'English' : 'conversational Hinglish'}</span>.
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/80">
            * Strict language enforcement: Output will strictly match {language.toUpperCase()} regardless of input language.
          </p>
        </div>
      </div>
    </div>
  );
}

