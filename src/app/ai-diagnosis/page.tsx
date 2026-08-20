'use client';

import { useState, type ChangeEvent, type ClipboardEvent, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DiagnosisCard } from '@/components/DiagnosisCard';
import {
  FileText,
  Loader2,
  Upload,
  PlusCircle,
  BrainCircuit,
  Lightbulb,
  Copy,
  X,
  Settings,
  Presentation,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/context/SettingsContext';
import { ModeLanguageSelector } from '@/components/ModeLanguageSelector';
import { LocalDataService, type LocalCase } from '@/lib/LocalDataService';
import { ClientSideAiService } from '@/lib/ClientSideAiService';
import type { StructuredQuestion, DiagnosisItem, ClinicalAnswerData, FollowUpThread } from '@/types';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AudioPlayerCard } from '@/components/AudioPlayerCard';
import { FollowUpChat } from '@/components/FollowUpChat';
import type { RecordedAudio } from '@/hooks/useAudioRecorder';
import Link from 'next/link';

function AiDiagnosisContent() {
  const [patientData, setPatientData] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [results, setResults] = useState<DiagnosisItem[] | null>(null);
  const [clinicalAnswer, setClinicalAnswer] = useState<ClinicalAnswerData | null>(null);
  const [proactiveQuestions, setProactiveQuestions] = useState<string[]>([]);
  const [audioDurations, setAudioDurations] = useState<Record<number, number>>({});
  const [caseSummaryForPresentation, setCaseSummaryForPresentation] = useState<string>('');
  const [followUpThreads, setFollowUpThreads] = useState<FollowUpThread[]>([]);
  const [structuredQuestion, setStructuredQuestion] = useState<StructuredQuestion | null>(null);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const loadedCaseIdRef = useRef<string | null>(null);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { aiConfig, isConfigured, language, audienceMode } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const caseId = searchParams.get('caseId');
    if (caseId && user && loadedCaseIdRef.current !== caseId) {
      loadedCaseIdRef.current = caseId;
      const loadCase = async () => {
        setIsLoading(true);
        try {
          const caseData = await LocalDataService.getCase(caseId);
          if (caseData && caseData.userId === user.id) {
            setPatientData(caseData.inputData?.patientData || '');
            if (caseData.inputData?.structuredQuestion) {
              setStructuredQuestion({
                ...caseData.inputData.structuredQuestion,
                images: caseData.inputData.supportingDocuments || [],
              });
            } else {
              setStructuredQuestion(null);
            }
            setFilePreviews(caseData.inputData?.supportingDocuments || []);
            setResults(caseData.outputData?.diagnoses || null);
            setClinicalAnswer(caseData.outputData?.clinicalAnswer || null);
            setProactiveQuestions(caseData.outputData?.proactiveQuestions || []);
            setCaseSummaryForPresentation(caseData.outputData?.caseSummaryForPresentation || '');
            setFollowUpThreads(caseData.outputData?.followUpThreads || []);
            setCurrentCaseId(caseId);
            toast({ title: 'Case Loaded', description: `Loaded: ${caseData.title}` });
          } else {
            toast({ title: 'Error', description: 'Could not find case.', variant: 'destructive' });
            router.push('/ai-diagnosis');
          }
        } catch (error) {
          console.error('Failed to load case:', error);
          toast({ title: 'Error', description: 'Failed to load case.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      loadCase();
    }
  }, [searchParams, user, router, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleAudioRecorded = (audio: RecordedAudio) => {
    const newIndex = files.length;
    setFiles((prev) => [...prev, audio.file]);
    setFilePreviews((prev) => [...prev, audio.dataUri || audio.url]);
    if (audio.duration && audio.duration > 0) {
      setAudioDurations((prev) => ({ ...prev, [newIndex]: Math.round(audio.duration) }));
    }
    toast({
      title: 'Voice Memo Attached',
      description: `Attached ${audio.fileName} (${audio.duration}s). Ready to send to Gemini!`,
    });
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setFilePreviews(filePreviews.filter((_, index) => index !== indexToRemove));
  };

  const isAudioItem = (item: File | string, index?: number) => {
    if (index !== undefined && files[index]) {
      return files[index].type.startsWith('audio/') || /\.(webm|mp3|wav|m4a|ogg|aac|flac)$/i.test(files[index].name);
    }
    if (typeof item === 'string') {
      return item.startsWith('data:audio') || /\.(webm|mp3|wav|m4a|ogg|aac|flac)(\?.*)?$/i.test(item);
    }
    return item.type.startsWith('audio/') || /\.(webm|mp3|wav|m4a|ogg|aac|flac)$/i.test(item.name);
  };

  const getFileName = (item: File | string, index: number) => {
    if (files[index]?.name) return files[index].name;
    return `Audio Note ${index + 1}`;
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setFiles((prev) => [...prev, file]);
          setFilePreviews((prev) => [...prev, URL.createObjectURL(file)]);
          toast({ title: 'Image Pasted', description: 'Pasted image from clipboard.' });
          break;
        }
      }
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!isConfigured) {
      const missingKeyMsg = 'Google Gemini API Key is missing. Please add your key in Settings or set GEMINI_API_KEY in your deployment environment variables.';
      setErrorMessage(missingKeyMsg);
      toast({
        title: 'API Key Missing',
        description: 'Please set your Gemini API Key in Settings.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const imageUrls = await Promise.all(
        files.map((file) => LocalDataService.saveFile(file, user.id))
      );
      const images = await Promise.all(files.map(fileToDataUri));

      // Single comprehensive clinical call
      const analysis = await ClientSideAiService.generateComprehensiveDiagnosis(
        aiConfig,
        patientData.trim() || undefined,
        images,
        { language, audienceMode }
      );

      setResults(analysis.diagnoses);
      setClinicalAnswer(analysis.clinicalAnswer);
      setProactiveQuestions(analysis.proactiveQuestions);
      setCaseSummaryForPresentation(analysis.caseSummaryForPresentation);
      setFollowUpThreads([]);

      const newStructuredQuestion = { summary: analysis.summary, images: imageUrls };
      setStructuredQuestion(newStructuredQuestion);
      setFilePreviews(imageUrls);

      const caseData: Partial<LocalCase> = {
        id: currentCaseId || undefined,
        userId: user.id,
        type: 'diagnosis',
        title: analysis.summary || 'Clinical Diagnosis Case',
        inputData: {
          patientData: patientData.trim() || null,
          supportingDocuments: imageUrls,
          structuredQuestion: newStructuredQuestion,
        },
        outputData: {
          diagnoses: analysis.diagnoses,
          clinicalAnswer: analysis.clinicalAnswer,
          proactiveQuestions: analysis.proactiveQuestions,
          caseSummaryForPresentation: analysis.caseSummaryForPresentation,
          followUpThreads: [],
        },
      };

      const savedId = await LocalDataService.saveCase(caseData);
      if (!currentCaseId) setCurrentCaseId(savedId);
      toast({ title: 'Diagnosis Generated', description: 'Clinical case analysis and differential saved.' });
    } catch (error: any) {
      console.error('Diagnosis failed:', error);
      const msg = error?.message || (typeof error === 'string' ? error : 'Failed to generate diagnosis.');
      setErrorMessage(msg);
      toast({ title: 'AI Diagnosis Error', description: msg, variant: 'destructive', duration: 9000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskFollowUp = async (question: string) => {
    if (!isConfigured || isAskingFollowUp || !user) return;
    setIsAskingFollowUp(true);
    try {
      const conversationHistory = followUpThreads.map((t) => ({
        question: t.question,
        answer: t.answer,
      }));

      const diagnosesSummary = results ? results.map((r) => `${r.diagnosis} (${Math.round(r.confidenceLevel * 100)}%)`).join(', ') : '';

      const followUpRes = await ClientSideAiService.answerClinicalFollowUp(aiConfig, {
        originalQuestion: patientData || structuredQuestion?.summary,
        originalAnswer: clinicalAnswer?.answer,
        diagnosesSummary,
        userFollowUp: question,
        conversationHistory,
        language,
        audienceMode,
      });

      const newThread: FollowUpThread = {
        id: Date.now().toString(),
        question,
        answer: followUpRes.answer,
        reasoning: followUpRes.reasoning,
        timestamp: Date.now(),
        source: 'diagnosis',
      };

      const updatedThreads = [...followUpThreads, newThread];
      setFollowUpThreads(updatedThreads);

      if (followUpRes.suggestedFollowUps && followUpRes.suggestedFollowUps.length > 0) {
        setProactiveQuestions(followUpRes.suggestedFollowUps);
      }

      // Persist in DB
      if (currentCaseId) {
        const existingCase = await LocalDataService.getCase(currentCaseId);
        if (existingCase) {
          await LocalDataService.saveCase({
            ...existingCase,
            outputData: {
              ...existingCase.outputData,
              followUpThreads: updatedThreads,
              proactiveQuestions: followUpRes.suggestedFollowUps || proactiveQuestions,
            },
          });
        }
      }

      toast({ title: 'Answer Received', description: 'Clinical consultant updated response.' });
    } catch (e) {
      console.error('Follow-up failed:', e);
      toast({ title: 'Error', description: 'Failed to get follow-up answer.', variant: 'destructive' });
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleCreatePresentationBridge = () => {
    if (!currentCaseId && !caseSummaryForPresentation && !patientData) return;
    // Route to content generator with case reference
    if (currentCaseId) {
      router.push(`/content-generator?fromCaseId=${currentCaseId}`);
    } else {
      router.push(`/content-generator?topic=${encodeURIComponent(structuredQuestion?.summary || 'Clinical Case Study')}`);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${type} copied to clipboard.` });
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  };

  const handleNewCase = () => {
    loadedCaseIdRef.current = null;
    setPatientData('');
    setFiles([]);
    setFilePreviews([]);
    setAudioDurations({});
    setResults(null);
    setClinicalAnswer(null);
    setProactiveQuestions([]);
    setCaseSummaryForPresentation('');
    setFollowUpThreads([]);
    setStructuredQuestion(null);
    setCurrentCaseId(null);
    router.push('/ai-diagnosis');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-8 space-y-6 w-full max-w-full overflow-x-hidden">
      {errorMessage && (
        <Card className="border-destructive/60 bg-destructive/10 text-destructive shadow-xs animate-in fade-in slide-in-from-top-2">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-destructive">
                  Diagnosis Generation Issue
                </h4>
                <p className="text-xs text-destructive/90 break-words leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setErrorMessage(null)}
                className="h-8 text-xs border-destructive/30 hover:bg-destructive/15 text-destructive"
              >
                Dismiss
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Link href="/settings">Check Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isConfigured && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-yellow-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-200 text-sm sm:text-base">
                    Gemini API Key Required
                  </h3>
                  <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                    To activate postgraduate medical analysis and follow-up engines, configure your Gemini API key.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-yellow-600 text-yellow-800 hover:bg-yellow-100 dark:text-yellow-200">
                <Link href="/settings">Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Input & Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-full">
        <div className="lg:col-span-5 space-y-6 w-full max-w-full min-w-0">
          <Card className="border shadow-sm w-full max-w-full overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="stamp-badge text-[9px] stamp-inquiry">
                      CASE SHEET #VIG-01
                    </span>
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    Clinical Diagnosis &amp; Workup
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Enter patient vignette, symptoms, lab reports, or upload medical imaging.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleNewCase} title="New Case" className="h-8 w-8 rounded-lg hover:bg-muted">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
              <ModeLanguageSelector />
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="patientData" className="text-xs font-semibold">
                      Patient Notes / Case Presentation
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <VoiceInputButton
                        onTranscript={(text) => {
                          setPatientData((prev) => (prev ? `${prev} ${text}` : text));
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7"
                      />
                    </div>
                  </div>
                  <Textarea
                    id="patientData"
                    placeholder="e.g. 54yo male with acute retrosternal chest pain radiating to back, BP 180/100, asymmetric pulses, elevated D-dimer and troponin..."
                    value={patientData}
                    onChange={(e) => setPatientData(e.target.value)}
                    onPaste={handlePaste}
                    className="min-h-[150px] resize-none text-xs sm:text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dictate live speech with the mic icon above, or record / upload an audio memo below to send directly to Gemini.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-xs font-semibold">
                      Supporting Files & Audio Memos (ECG, X-Ray, Audio Dictation, Labs)
                    </Label>
                    <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                  </div>

                  {/* Audio Attachments List */}
                  {filePreviews.some((preview, i) => isAudioItem(preview, i)) && (
                    <div className="space-y-2 pt-1 w-full max-w-full overflow-hidden">
                      {filePreviews.map((preview, index) => {
                        if (!isAudioItem(preview, index)) return null;
                        return (
                          <AudioPlayerCard
                            key={index}
                            src={preview}
                            fileName={getFileName(preview, index)}
                            duration={audioDurations[index]}
                            onRemove={() => handleRemoveFile(index)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Image and Document Previews */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {filePreviews.map((preview, index) => {
                      if (isAudioItem(preview, index)) return null;
                      return (
                        <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg border shadow-xs">
                          <img src={preview} alt={`Report ${index}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed hover:bg-muted/60 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-0.5">Upload</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf,audio/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-xs sm:text-sm font-semibold shadow-xs"
                  disabled={isLoading || (!patientData.trim() && files.length === 0)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Clinical Workup...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="mr-2 h-4 w-4" />
                      Generate Diagnosis & Guideline Plan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Token-Efficient Bridge to Slide Presentation */}
          {(results || caseSummaryForPresentation) && (
            <Card className="border border-primary/30 bg-primary/5 shadow-xs overflow-hidden w-full max-w-full">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase">
                    <Presentation className="h-4 w-4 shrink-0" />
                    <span>Presentation Deck Bridge</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Convert this case&apos;s clinical synthesis into a full slide deck without re-uploading images.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleCreatePresentationBridge}
                  className="h-9 px-3 text-xs gap-1.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                >
                  <span>Build Slides</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {structuredQuestion && (
            <QuestionDisplay
              summary={structuredQuestion.summary}
              images={structuredQuestion.images}
            />
          )}
        </div>

        {/* Diagnostic Results & Differential Diagnoses */}
        <div className="lg:col-span-7 space-y-6 w-full max-w-full min-w-0">
          {results && results.length > 0 && (
            <div className="space-y-4 w-full max-w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Ranked Differential Diagnoses & Pre-Test Likelihood
                </h3>
                <span className="text-xs text-muted-foreground shrink-0">{results.length} Conditions Analyzed</span>
              </div>
              <div className="space-y-3 w-full max-w-full">
                {results.map((diag, index) => (
                  <DiagnosisCard key={index} diagnosis={diag} />
                ))}
              </div>
            </div>
          )}

          {/* Clinical Synthesis & Guideline Protocols */}
          {clinicalAnswer && (
            <Card className="border shadow-sm overflow-hidden w-full max-w-full">
              <CardHeader className="bg-primary/5 border-b p-4 sm:p-6 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <span>Guideline-Directed Management & Synthesis</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(clinicalAnswer.answer, 'Synthesis')}
                    className="h-7 w-7 shrink-0"
                    aria-label="Copy synthesis"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 w-full max-w-full overflow-hidden">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-xs sm:text-sm leading-relaxed break-words overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: formatText(clinicalAnswer.answer) }}
                />

                {clinicalAnswer.reasoning && (
                  <Accordion type="single" collapsible className="mt-4 pt-2 border-t w-full">
                    <AccordionItem value="reasoning" className="border-none">
                      <AccordionTrigger className="py-1 text-xs font-semibold text-muted-foreground hover:text-primary">
                        <div className="flex items-center gap-2 min-w-0 text-left">
                          <Lightbulb className="h-4 w-4 shrink-0" />
                          <span>Detailed Diagnostic & Pathophysiology Breakdown</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-muted-foreground break-words overflow-x-auto">
                          <div
                            dangerouslySetInnerHTML={{ __html: formatText(clinicalAnswer.reasoning) }}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interactive Follow-up Q&A and Proactive Question Engine */}
          {(results || clinicalAnswer) && (
            <FollowUpChat
              proactiveQuestions={proactiveQuestions}
              threads={followUpThreads}
              onAskFollowUp={handleAskFollowUp}
              isLoading={isAskingFollowUp}
              title="Clinical Blind Spots & Interactive Q&A"
              description="Proactive questions generated for this case. Click any chip to ask, or type a custom question."
              sourceContext="diagnosis"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AiDiagnosisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AiDiagnosisContent />
    </Suspense>
  );
}
