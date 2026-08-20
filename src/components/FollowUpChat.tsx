'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  Lightbulb,
  Copy,
  Check,
  Bot,
  User,
  Stethoscope,
  PenLine,
  HelpCircle,
} from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { useToast } from '@/hooks/use-toast';
import type { FollowUpThread } from '@/types';

interface FollowUpChatProps {
  proactiveQuestions?: string[];
  threads?: FollowUpThread[];
  onAskFollowUp: (question: string) => Promise<void>;
  isLoading?: boolean;
  title?: string;
  description?: string;
  sourceContext?: 'diagnosis' | 'slide';
  slideTitle?: string;
}

export function FollowUpChat({
  proactiveQuestions = [],
  threads = [],
  onAskFollowUp,
  isLoading = false,
  title = 'Clinical Inquiries & Case Consultation',
  description = 'Explore diagnostic blind spots, guideline updates, or ask custom clinical questions.',
  sourceContext = 'diagnosis',
  slideTitle,
}: FollowUpChatProps) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!customQuestion.trim() || isLoading) return;
    const q = customQuestion.trim();
    setCustomQuestion('');
    await onAskFollowUp(q);
  };

  const handleChipClick = async (question: string) => {
    if (isLoading) return;
    await onAskFollowUp(question);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied', description: 'Consultation note copied to clipboard.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  };

  return (
    <Card className="border border-border shadow-xs overflow-hidden bg-card rounded-2xl">
      {/* Top Subtle Journal Ruler Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-amber-400/40 to-blue-500/30" />

      <CardHeader className="bg-muted/30 border-b border-border/70 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="stamp-badge text-[9px] stamp-inquiry">
                CONSULTATION LOG
              </span>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                <MessageSquare className="h-4 w-4 text-primary" />
                {title}
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              {slideTitle ? `Teaching Slide Context: ${slideTitle}` : description}
            </CardDescription>
          </div>

          {threads.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground px-2.5 py-1 rounded-md border border-border bg-card">
              {threads.length} {threads.length === 1 ? 'Note' : 'Notes'}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Proactive Clinical Question Chips (Journal Sticky Prompts) */}
        {proactiveQuestions && proactiveQuestions.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Recommended Bedside Inquiries</span>
              </div>
              <span className="text-[11px] font-handwriting text-muted-foreground text-xs">
                tap to query preceptor
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {proactiveQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChipClick(q)}
                  disabled={isLoading}
                  className="text-left text-xs bg-background hover:bg-card text-foreground border border-border hover:border-primary/40 rounded-xl px-3.5 py-2 transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  <span className="text-primary font-mono text-xs">💡</span>
                  <span className="font-medium font-sans">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing Thread Q&As */}
        {threads.length > 0 && (
          <div className="space-y-4 pt-1">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              <span>Rounding Dialogue &amp; Notes</span>
            </div>

            <div className="space-y-4">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-3.5 shadow-2xs"
                >
                  {/* Doctor's Inquiry */}
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {thread.slideTitle ? `Question on [${thread.slideTitle}]` : 'Doctor Inquiry'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(thread.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 font-sans">
                        {thread.question}
                      </p>
                    </div>
                  </div>

                  {/* Consultant Attending Preceptor Response */}
                  <div className="flex items-start gap-3 pl-2 sm:pl-4 border-l-2 border-primary/40 pt-1">
                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary mt-0.5 shrink-0">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">
                          Clinical Synthesis &amp; Management Rationale
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopy(thread.answer, thread.id)}
                          aria-label="Copy response"
                        >
                          {copiedId === thread.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>

                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground text-xs sm:text-sm leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: formatText(thread.answer) }}
                      />

                      {thread.reasoning && (
                        <Accordion type="single" collapsible className="w-full pt-1">
                          <AccordionItem value="reasoning" className="border-none">
                            <AccordionTrigger className="py-1 text-xs font-semibold text-muted-foreground hover:text-primary">
                              <div className="flex items-center gap-1.5">
                                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                                <span>Evidence &amp; Clinical Guidelines</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div
                                className="mt-2 rounded-xl bg-muted/40 p-3 sm:p-3.5 text-xs leading-relaxed text-muted-foreground border border-border font-sans"
                                dangerouslySetInnerHTML={{ __html: formatText(thread.reasoning) }}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-primary">
                Preceptor AI consulting clinical evidence &amp; guidelines...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Analyzing drug interactions, renal adjustments, and management algorithms
              </p>
            </div>
          </div>
        )}

        {/* Input Bar with Voice Dictation */}
        <div className="space-y-2 pt-1">
          <div className="relative rounded-xl border border-border bg-background shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Textarea
              placeholder="Ask a custom follow-up (e.g. 2nd line therapy, dosing in renal failure, pediatric considerations)..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              className="w-full resize-none border-0 bg-transparent p-3 text-xs sm:text-sm focus-visible:ring-0 focus-visible:outline-hidden placeholder:text-muted-foreground/70"
            />
            <div className="flex items-center justify-between p-2 pt-0 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <VoiceInputButton
                  onTranscript={(text) => {
                    setCustomQuestion((prev) => (prev ? `${prev} ${text}` : text));
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                />
                <span className="text-[11px] font-handwriting text-muted-foreground hidden sm:inline text-xs">
                  mic dictation enabled
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleSend}
                disabled={isLoading || !customQuestion.trim()}
                className="h-8 px-3 text-xs gap-1.5 shadow-2xs font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Ask Preceptor</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

