'use client';

import type { DiagnosisItem } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  FileQuestion,
  TestTubeDiagonal,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckSquare,
  ArrowUpRight,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DiagnosisCardProps {
  diagnosis: DiagnosisItem;
  onExploreTopic?: (topic: string) => void;
}

export function DiagnosisCard({ diagnosis, onExploreTopic }: DiagnosisCardProps) {
  const confidencePercent = Math.round(diagnosis.confidenceLevel * 100);

  const getConfidenceColor = (level: number) => {
    if (level >= 75) return 'bg-emerald-600';
    if (level >= 50) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  const hasMissingInfo =
    (diagnosis.missingInformation?.information && diagnosis.missingInformation.information.length > 0) ||
    (diagnosis.missingInformation?.tests && diagnosis.missingInformation.tests.length > 0);

  const isEmergent = diagnosis.lifeThreatCategory === 'Emergent';
  const isUrgent = diagnosis.lifeThreatCategory === 'Urgent';

  return (
    <Card
      className={`relative overflow-hidden rounded-xl border bg-card shadow-xs hover:shadow-md transition-all duration-200 ${
        isEmergent
          ? 'border-red-500/50 bg-red-500/5 dark:bg-red-950/20'
          : isUrgent
          ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20'
          : 'border-border'
      }`}
    >
      {/* Top index card color strip */}
      <div
        className={`h-1 w-full ${
          isEmergent
            ? 'bg-red-500'
            : isUrgent
            ? 'bg-amber-500'
            : 'bg-primary/50'
        }`}
      />

      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                {diagnosis.diagnosis}
              </CardTitle>

              {isEmergent && (
                <span className="stamp-badge stamp-emergent text-[10px] animate-pulse">
                  <ShieldAlert className="h-3 w-3" /> CAN&apos;T MISS / EMERGENT
                </span>
              )}
              {isUrgent && (
                <span className="stamp-badge stamp-urgent text-[10px]">
                  <AlertTriangle className="h-3 w-3" /> URGENT
                </span>
              )}
              {!isEmergent && !isUrgent && (
                <span className="stamp-badge stamp-confirmed text-[9px]">
                  DIFFERENTIAL
                </span>
              )}
            </div>

            <p className="text-[11px] font-handwriting text-muted-foreground text-sm">
              Pre-test clinical probability estimate
            </p>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="font-mono font-bold text-sm sm:text-base text-foreground bg-muted/60 px-2.5 py-0.5 rounded-md border border-border">
              {confidencePercent}%
            </div>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Likelihood
            </span>
          </div>
        </div>

        {/* Progress Gauge */}
        <div className="pt-1">
          <Progress
            value={confidencePercent}
            className={`h-2 [&>div]:${getConfidenceColor(confidencePercent)} bg-muted`}
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-1 space-y-3">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary">
                <Lightbulb className="h-4 w-4" />
                <span>Clinical Reasoning &amp; Investigative Workup</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pt-2 space-y-4">
              {/* Pathophysiology Note (Styled like a handwritten physician sticky card) */}
              <div className="sticky-note-yellow p-3.5 sm:p-4 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pathophysiology &amp; Diagnostic Rationale
                  </span>
                  <span className="text-[10px] font-handwriting normal-case text-amber-900/80 dark:text-amber-200/80 text-xs">
                    Clinical Pearls
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-sans font-medium">
                  {diagnosis.reasoning}
                </p>
              </div>

              {/* Missing Information & Guideline Workup Checklists */}
              {hasMissingInfo && (
                <div className="rounded-xl border border-border bg-muted/30 p-3.5 sm:p-4 space-y-3.5">
                  {diagnosis.missingInformation?.information &&
                    diagnosis.missingInformation.information.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <FileQuestion className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Clarifying Clinical Features to Elicit:</span>
                        </h4>
                        <ul className="space-y-1 pl-1 text-xs text-muted-foreground">
                          {diagnosis.missingInformation.information.map((info, i) => (
                            <li key={`info-${i}`} className="flex items-start gap-2">
                              <span className="text-blue-500 font-mono font-bold mt-0.5">•</span>
                              <span className="leading-relaxed">{info}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {diagnosis.missingInformation?.tests &&
                    diagnosis.missingInformation.tests.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-border/60">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <TestTubeDiagonal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Guideline-Directed Diagnostic Investigations:</span>
                        </h4>
                        <ul className="space-y-1 pl-1 text-xs text-muted-foreground">
                          {diagnosis.missingInformation.tests.map((test, i) => (
                            <li key={`test-${i}`} className="flex items-start gap-2">
                              <span className="text-emerald-500 font-mono font-bold mt-0.5">✓</span>
                              <span className="leading-relaxed">{test}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

