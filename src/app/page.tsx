'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BrainCircuit,
  Wand2,
  BookOpen,
  ArrowRight,
  Mic,
  FileCheck2,
  Lightbulb,
  Stethoscope,
  Layers,
  Sparkles,
  ClipboardList,
  Flame,
  BookmarkCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Top Clinical Case Desk Header */}
      <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs overflow-hidden">
        {/* Subtle top washi tape accent */}
        <div className="washi-tape-strip h-3 w-32 mx-auto rounded-xs -mt-6 mb-4 opacity-70" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="stamp-badge text-[10px] stamp-confirmed">
                [ CLINICAL FIELD NOTES ]
              </span>
              <span className="text-xs font-handwriting text-primary text-base sm:text-lg">
                ✍️ Rounds, Morning Report &amp; Teaching Deck
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Clinical Pocket-Book &amp; Slide Studio
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Synthesize complex patient cases, generate differential diagnoses with pre-test likelihoods, extract high-yield clinical pearls, and build multi-slide teaching decks with instant PowerPoint/PDF export.
            </p>
          </div>

          {/* Handwritten Sticky Note - Daily Pearl Callout */}
          <div className="sticky-note-green p-3.5 rounded-xl text-xs max-w-xs shadow-xs border rotate-1 sm:rotate-2 self-stretch sm:self-auto flex flex-col justify-between">
            <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 mb-1 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>High-Yield PG Tip</span>
            </div>
            <p className="font-handwriting text-base text-emerald-950 dark:text-emerald-100 leading-snug">
              &quot;Never diagnose acute appendicitis on ultrasound alone if clinical signs are overwhelming — clinical exam always trumps equivocal imaging.&quot;
            </p>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-2 font-mono text-right">
              — Surgical Rounds
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Cards Styled as Medical Notebook Sheets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Diagnosis Card */}
        <div
          className="cursor-pointer group relative rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between"
          onClick={() => handleNavigate('/ai-diagnosis')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <span className="stamp-badge text-[9px] stamp-inquiry">
                Vignette
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                AI Clinical Diagnosis
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Enter patient symptoms, labs, or dictations. Receive evidence-based differentials ranked by confidence, missing workup checklists, and emergent flags.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
            <span>Open Case Sheet</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Content & Slide Generator Card */}
        <div
          className="cursor-pointer group relative rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          onClick={() => handleNavigate('/content-generator')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Wand2 className="h-6 w-6" />
              </div>
              <span className="stamp-badge text-[9px] stamp-confirmed">
                Slide Studio
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Slide &amp; Content Studio
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Transform clinical topics into multi-slide teaching decks with high-yield pearls, viva questions, and 1-click PowerPoint/PDF/Word export.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Build Presentation</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* History Archives Card */}
        <div
          className="cursor-pointer group relative rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-purple-500/50 transition-all flex flex-col justify-between"
          onClick={() => handleNavigate(user ? '/history' : '/login')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="stamp-badge text-[9px] border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/5">
                Archived
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Case Files &amp; Archives
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Access past evaluations, Q&amp;A consultation threads, and saved decks offline with local Dexie database storage.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
            <span>Browse Case Files</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Clinical Toolset Overview Grid */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span>High-Yield Clinical Trainee Toolkit</span>
          </h3>
          <span className="text-[11px] font-handwriting text-muted-foreground text-sm">
            USMLE • NEET-PG • Next Exam Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1 shadow-2xs">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground">Voice Dictation</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              1-tap clinical dictation for case intake, lab readings, and bedside queries.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1 shadow-2xs">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h4 className="text-xs font-bold text-foreground">Proactive Inquiries</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              AI surfaces diagnostic blind spots, missed atypical features, and guidelines.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1 shadow-2xs">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <h4 className="text-xs font-bold text-foreground">Diagnosis-to-Deck</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Bridge evaluated cases directly into multi-slide teaching presentations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1 shadow-2xs">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-foreground">PowerPoint &amp; PDF</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Export pixel-perfect PowerPoint (.pptx), formatted PDF, and Word docs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

