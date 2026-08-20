'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
  FileText,
  Lightbulb,
  HelpCircle,
  Sparkles,
  Stethoscope,
  Heart,
  Brain,
  Users,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  Loader2,
  Bot,
  Pin,
  Bookmark,
  CheckCircle2,
  PenLine,
  Maximize2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import type { Slide, ContentItem } from '@/types';
import { ClientSideAiService } from '@/lib/ClientSideAiService';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/hooks/use-toast';

interface BoldRendererProps {
  text: string;
  bold?: string[];
  className?: string;
}

const BoldRenderer: React.FC<BoldRendererProps> = ({ text, bold = [], className = '' }) => {
  if (!text) return null;
  if (bold.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const boldEscaped = bold.map((b) => b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${boldEscaped.join('|')})`, 'g');
  const parts = text.split(regex).filter(Boolean);

  return (
    <span className={`${className} text-wrap`}>
      {parts.map((part, i) =>
        bold.includes(part) ? (
          <strong key={i} className="font-bold text-foreground underline decoration-primary/40 decoration-2 underline-offset-2">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

interface CompactSlideTableProps {
  tableItem: Extract<ContentItem, { type: 'table' }>;
  slideTitle: string;
}

const CompactSlideTable: React.FC<CompactSlideTableProps> = ({ tableItem, slideTitle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const headers = tableItem.headers || [];
  const rows = tableItem.rows || [];

  return (
    <>
      {/* Clickable Compact Table Card - Fits in one view */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(true);
          }
        }}
        title="Click to view enlarged table"
        className="group/table relative w-full my-1 rounded-lg border border-border/80 bg-card overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-xs transition-all"
      >
        <div className="absolute top-1 right-1 z-10 opacity-0 group-hover/table:opacity-100 transition-opacity bg-background/90 text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 rounded border border-border/60 flex items-center gap-1 shadow-2xs pointer-events-none">
          <Maximize2 className="h-2.5 w-2.5" />
          <span>Enlarge</span>
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/60 hover:bg-muted/60">
                {headers.map((header, i) => (
                  <TableHead
                    key={i}
                    className="text-foreground font-bold text-[11px] leading-tight border-border/40 px-2 py-1.5 h-auto whitespace-normal"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow
                  key={i}
                  className={`border-border/40 transition-colors ${
                    i % 2 === 1 ? 'bg-muted/20' : 'bg-card'
                  } group-hover/table:bg-primary/5`}
                >
                  {(row.cells || []).map((cell, j) => (
                    <TableCell
                      key={j}
                      className="text-foreground text-[11px] leading-snug border-border/30 px-2 py-1.5 break-words font-sans align-top"
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Enlarged Modal View */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-5 sm:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <span>{slideTitle}</span>
              <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded bg-muted">
                {headers.length} Columns • {rows.length} Rows
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enlarged scrollable table view.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto rounded-xl border border-border mt-2 bg-card">
            <Table className="min-w-full border-collapse">
              <TableHeader>
                <TableRow className="border-border bg-muted sticky top-0 z-10">
                  {headers.map((header, i) => (
                    <TableHead
                      key={i}
                      className="text-foreground font-bold text-xs sm:text-sm border-border px-4 py-3 bg-muted whitespace-nowrap"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className={`border-border/60 ${
                      i % 2 === 1 ? 'bg-muted/20' : 'bg-card'
                    } hover:bg-muted/40`}
                  >
                    {(row.cells || []).map((cell, j) => (
                      <TableCell
                        key={j}
                        className="text-foreground text-xs sm:text-sm border-border/40 px-4 py-3 break-words font-sans align-top"
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface ContentItemRendererProps {
  item: ContentItem;
  index: number;
  slideIndex: number;
  slideTitle: string;
  onUpdateItem?: (updatedItem: ContentItem) => void;
}

const ContentItemRenderer: React.FC<ContentItemRendererProps> = ({
  item,
  index,
  slideTitle,
  onUpdateItem,
}) => {
  return (
    <div className="group relative w-full max-w-full">
      {item.type === 'paragraph' && (
        <div className="p-3 sm:p-4 rounded-xl bg-card border border-border/80 shadow-2xs">
          <p className="text-foreground text-sm sm:text-base leading-relaxed font-sans break-words">
            <BoldRenderer text={item.text} bold={item.bold} />
          </p>
        </div>
      )}

      {item.type === 'bullet_list' && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2.5">
          <ul className="space-y-2 w-full">
            {(item.items || []).map((listItem, i) => (
              <li key={i} className="flex items-start gap-2.5 text-foreground w-full max-w-full">
                <span className="text-primary font-mono font-bold text-sm mt-0.5">•</span>
                <span className="text-sm sm:text-base leading-relaxed break-words flex-1 min-w-0 font-sans">
                  <BoldRenderer text={listItem.text} bold={listItem.bold} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.type === 'numbered_list' && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2.5">
          <ol className="space-y-2 w-full">
            {(item.items || []).map((listItem, i) => (
              <li key={i} className="flex items-start gap-2.5 text-foreground w-full max-w-full">
                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-sm sm:text-base leading-relaxed break-words flex-1 min-w-0 pt-0.5 font-sans">
                  <BoldRenderer text={listItem.text} bold={listItem.bold} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {item.type === 'table' && (
        <CompactSlideTable
          tableItem={item}
          slideTitle={slideTitle}
        />
      )}

      {item.type === 'note' && (
        <div className="sticky-note-yellow p-3.5 sm:p-4 rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
            <Pin className="h-3.5 w-3.5" />
            <span>Clinical Annotation</span>
          </div>
          <p className="text-xs sm:text-sm font-sans font-medium text-amber-950 dark:text-amber-100 leading-relaxed">
            {item.text.replace(/^Note:\s*/i, '')}
          </p>
        </div>
      )}
    </div>
  );
};

interface EnhancedSlideRendererProps {
  slide: Slide;
  index: number;
  presentationTopic?: string;
  isSelected?: boolean;
  isLoading?: boolean;
  onUpdateSlide?: (updatedSlide: Slide) => void;
}

export const EnhancedSlideRenderer: React.FC<EnhancedSlideRendererProps> = ({
  slide,
  index,
  presentationTopic = 'Medical Presentation',
  isSelected = false,
  isLoading = false,
  onUpdateSlide,
}) => {
  const { theme } = useTheme();
  const { apiKey, language, audienceMode } = useSettings();
  const { toast } = useToast();

  const handleUpdateContentItem = (contentIndex: number, updatedItem: ContentItem) => {
    if (!onUpdateSlide) return;
    const newContent = [...slide.content];
    newContent[contentIndex] = updatedItem;
    onUpdateSlide({
      ...slide,
      content: newContent,
    });
  };

  const [showPearls, setShowPearls] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showSlideChat, setShowSlideChat] = useState(false);

  // In-slide Q&A state
  const [slideQuestion, setSlideQuestion] = useState('');
  const [isAskingSlide, setIsAskingSlide] = useState(false);
  const [slideAnswers, setSlideAnswers] = useState<Array<{ q: string; a: string; reasoning?: string }>>([]);

  const handleAskSlideQuestion = async (questionText?: string) => {
    const q = (questionText || slideQuestion).trim();
    if (!q || !apiKey || isAskingSlide) return;

    setIsAskingSlide(true);
    try {
      const response = await ClientSideAiService.answerSlideFollowUp(apiKey, {
        presentationTopic,
        slideTitle: slide.title,
        slideContent: slide.content,
        slideSummary: slide.summary,
        userQuestion: q,
        language,
        audienceMode,
      });

      setSlideAnswers((prev) => [...prev, { q, a: response.answer, reasoning: response.reasoning }]);
      setSlideQuestion('');
      setShowSlideChat(true);
    } catch (e) {
      console.error('Slide Q&A error:', e);
      toast({ title: 'Error', description: 'Failed to answer slide question.', variant: 'destructive' });
    } finally {
      setIsAskingSlide(false);
    }
  };

  const showLoadingState = isLoading || !slide.content || slide.content.length === 0;

  if (showLoadingState) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-md w-full max-w-full p-6 min-h-[320px]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-8 bg-muted/80 rounded w-3/4"></div>
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-muted/50 rounded w-full"></div>
            <div className="h-4 bg-muted/50 rounded w-5/6"></div>
            <div className="h-4 bg-muted/50 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-card border transition-all duration-200 ${
        isSelected
          ? 'border-primary ring-2 ring-primary/40 shadow-md scale-[1.005]'
          : 'border-border shadow-xs hover:border-border/90 hover:shadow-sm'
      } w-full max-w-full`}
    >
      {/* Top Slide Header Notebook Ruler */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-amber-400/40 to-emerald-500/40" />

      <div className="p-5 sm:p-7 lg:p-8 min-h-[280px] w-full max-w-full space-y-5">
        {/* Slide Header with Index Stamping */}
        <div className="border-b border-border/70 pb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="stamp-badge text-[10px] stamp-confirmed">
                SLIDE #{index + 1}
              </span>
              {slide.summary && (
                <span className="text-xs font-handwriting text-muted-foreground hidden sm:inline truncate max-w-md">
                  — {slide.summary}
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-muted-foreground">
              Clinical Teaching Deck
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
            {slide.title}
          </h2>
        </div>

        {/* Content Items */}
        <div className="space-y-3.5 sm:space-y-4 w-full max-w-full">
          {slide.content.map((item, contentIndex) => (
            <ContentItemRenderer
              key={contentIndex}
              item={item}
              index={contentIndex}
              slideIndex={index}
              slideTitle={slide.title}
              onUpdateItem={(updated) => handleUpdateContentItem(contentIndex, updated)}
            />
          ))}
        </div>

        {/* High-Yield Clinical Pearls & Viva Questions Toolbar */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {slide.clinicalPearls && slide.clinicalPearls.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPearls(!showPearls)}
                className="h-7 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1.5 font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Clinical Pearls ({slide.clinicalPearls.length})</span>
                {showPearls ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}

            {slide.proactiveQuestions && slide.proactiveQuestions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuestions(!showQuestions)}
                className="h-7 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1.5 font-semibold"
              >
                <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Viva / Board Questions ({slide.proactiveQuestions.length})</span>
                {showQuestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSlideChat(!showSlideChat)}
              className="h-7 text-xs bg-muted/60 hover:bg-muted text-foreground border-border gap-1.5"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
              <span>Ask Slide Question</span>
              {showSlideChat ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Collapsible Clinical Pearls Section (Sticky Note Style) */}
        <AnimatePresence>
          {showPearls && slide.clinicalPearls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="sticky-note-green p-4 rounded-xl space-y-2 shadow-2xs">
                <div className="font-bold text-xs uppercase tracking-wider flex items-center justify-between text-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    High-Yield Clinical Pearls (PG &amp; MBBS Level)
                  </span>
                  <span className="font-handwriting normal-case text-emerald-800/80 dark:text-emerald-200/80 text-sm">
                    Must Know For Rounds
                  </span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm font-sans font-medium text-emerald-950 dark:text-emerald-100">
                  {slide.clinicalPearls.map((pearl, i) => (
                    <li key={i}>{pearl}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsible Board Questions Section */}
        <AnimatePresence>
          {showQuestions && slide.proactiveQuestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="sticky-note-blue p-4 rounded-xl space-y-2.5 shadow-2xs">
                <div className="font-bold text-xs uppercase tracking-wider flex items-center justify-between text-blue-900 dark:text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4" />
                    Interactive Viva &amp; Exam Questions
                  </span>
                  <span className="font-handwriting normal-case text-blue-800/80 dark:text-blue-200/80 text-sm">
                    Tap to Ask AI
                  </span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {slide.proactiveQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAskSlideQuestion(q)}
                      disabled={isAskingSlide}
                      className="text-left bg-background/80 hover:bg-background text-foreground p-3 rounded-lg border border-blue-300/40 text-xs transition-all active:scale-[0.99] flex items-center justify-between shadow-2xs"
                    >
                      <span className="font-medium font-sans">❓ {q}</span>
                      <span className="text-[11px] text-primary font-bold shrink-0 ml-2">
                        Analyze →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* In-Slide Question & Answer Journal Dialogue */}
        <AnimatePresence>
          {showSlideChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3 text-xs sm:text-sm shadow-2xs">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-primary" />
                    Slide Discussion &amp; Clarifications
                  </span>
                  <span className="text-[11px] font-handwriting text-muted-foreground text-xs">
                    Bedside Preceptor
                  </span>
                </div>

                {slideAnswers.map((item, i) => (
                  <div key={i} className="rounded-lg bg-card p-3 space-y-2 border border-border shadow-2xs">
                    <p className="font-bold text-foreground">Q: {item.q}</p>
                    <div className="text-muted-foreground text-xs leading-relaxed border-l-2 border-primary pl-2.5">
                      {item.a}
                    </div>
                  </div>
                ))}

                {isAskingSlide && (
                  <div className="flex items-center gap-2 text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Analyzing slide teaching context...</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Ask a specific question about this slide..."
                    value={slideQuestion}
                    onChange={(e) => setSlideQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskSlideQuestion();
                    }}
                    className="h-8 text-xs bg-background border-border text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAskSlideQuestion()}
                    disabled={isAskingSlide || !slideQuestion.trim()}
                    className="h-8 text-xs shrink-0 px-3 font-semibold"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedSlideRenderer;

