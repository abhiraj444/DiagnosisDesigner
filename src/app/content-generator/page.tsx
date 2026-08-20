'use client';

import { useState, type ChangeEvent, type ClipboardEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Wand2,
  BrainCircuit,
  PlusCircle,
  X,
  Settings,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { SlideEditor } from '@/components/SlideEditor';
import type { Slide } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/context/SettingsContext';
import { ModeLanguageSelector } from '@/components/ModeLanguageSelector';
import { LocalDataService, type LocalCase } from '@/lib/LocalDataService';
import { ClientSideAiService } from '@/lib/ClientSideAiService';
import type { StructuredQuestion, FollowUpThread } from '@/types';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AudioPlayerCard } from '@/components/AudioPlayerCard';
import { FollowUpChat } from '@/components/FollowUpChat';
import type { RecordedAudio } from '@/hooks/useAudioRecorder';
import Link from 'next/link';

function ContentGeneratorContent() {
  const [mode, setMode] = useState<'question' | 'topic'>('question');
  const [question, setQuestion] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

  const [result, setResult] = useState<any | null>(null);
  const [proactiveQuestions, setProactiveQuestions] = useState<string[]>([]);
  const [followUpThreads, setFollowUpThreads] = useState<FollowUpThread[]>([]);
  const [structuredQuestion, setStructuredQuestion] = useState<StructuredQuestion | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [presentationOutline, setPresentationOutline] = useState<string[] | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [usedTopics, setUsedTopics] = useState<string[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [audioDurations, setAudioDurations] = useState<Record<number, number>>({});

  const processedFromCaseRef = useRef<string | null>(null);
  const loadedCaseIdRef = useRef<string | null>(null);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { apiKey, aiConfig, isConfigured, language, audienceMode } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load case from history or bridge from AI Diagnosis
  useEffect(() => {
    const caseId = searchParams.get('caseId');
    const fromCaseId = searchParams.get('fromCaseId');
    const topicParam = searchParams.get('topic');

    if (caseId && user && loadedCaseIdRef.current !== caseId) {
      loadedCaseIdRef.current = caseId;
      const loadCase = async () => {
        setIsLoading(true);
        try {
          const caseData = await LocalDataService.getCase(caseId);
          if (caseData && caseData.userId === user.id) {
            setMode(caseData.inputData?.mode || 'question');
            if (caseData.inputData?.mode === 'question') {
              setQuestion(caseData.inputData?.question || '');
            } else {
              setTopic(caseData.inputData?.topic || '');
            }
            setImagePreviews(caseData.inputData?.images || []);
            setResult(caseData.outputData?.result || null);
            setSlides(caseData.outputData?.slides || null);
            setPresentationOutline(caseData.outputData?.outline || null);
            setSelectedTopics(caseData.outputData?.selectedTopics || []);
            setUsedTopics(caseData.outputData?.usedTopics || []);
            setSuggestedTopics(caseData.outputData?.suggestedTopics || []);
            setFollowUpThreads(caseData.outputData?.followUpThreads || []);

            if (caseData.outputData?.structuredQuestion) {
              setStructuredQuestion(caseData.outputData.structuredQuestion);
            }

            setCurrentCaseId(caseId);
            toast({ title: 'Case Loaded', description: `Loaded: ${caseData.title}` });
          }
        } catch (error) {
          console.error('Failed to load case:', error);
          toast({ title: 'Error', description: 'Failed to load case.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      loadCase();
    } else if (fromCaseId && user && isConfigured && processedFromCaseRef.current !== fromCaseId) {
      // Guard against multiple bridge executions
      processedFromCaseRef.current = fromCaseId;

      const bridgeFromDiagnosis = async () => {
        setIsLoading(true);
        try {
          const diagCase = await LocalDataService.getCase(fromCaseId);
          if (diagCase) {
            const diagSummary = diagCase.outputData?.caseSummaryForPresentation || diagCase.title || 'Clinical Case Presentation';
            const diagTopic = diagCase.title || 'Clinical Case Study';
            setTopic(diagTopic);
            setQuestion(diagSummary);
            setMode('topic');

            // Generate outline & slides directly using token-efficient bridge
            const bridgeResult = await ClientSideAiService.generatePresentationFromCaseSummary(
              aiConfig,
              diagSummary,
              diagTopic,
              diagCase.outputData?.clinicalAnswer?.answer,
              { language, audienceMode }
            );

            setPresentationOutline(bridgeResult.outline);
            setSelectedTopics(bridgeResult.outline);
            setSlides(bridgeResult.slides);
            setUsedTopics(bridgeResult.slides.map(s => s.title));
            setSuggestedTopics(bridgeResult.outline);
            setResult({
              topic: diagTopic,
              answer: `Teaching presentation generated directly from Diagnosis Case #${fromCaseId.slice(0, 6)}.`,
            });

            // Save new presentation case
            const newCaseData: Partial<LocalCase> = {
              userId: user.id,
              type: 'content-generator',
              title: `Presentation: ${diagTopic}`,
              inputData: {
                mode: 'topic',
                topic: diagTopic,
                fromDiagnosisCaseId: fromCaseId,
              },
              outputData: {
                result: { topic: diagTopic, answer: 'Case presentation synthesized.' },
                slides: bridgeResult.slides,
                outline: bridgeResult.outline,
                selectedTopics: bridgeResult.outline,
                usedTopics: bridgeResult.slides.map(s => s.title),
                suggestedTopics: bridgeResult.outline,
                followUpThreads: [],
              },
            };

            const savedId = await LocalDataService.saveCase(newCaseData);
            setCurrentCaseId(savedId);
            loadedCaseIdRef.current = savedId;
            // Clean URL query param so re-renders don't trigger the bridge again
            router.replace(`/content-generator?caseId=${savedId}`);
            toast({ title: 'Presentation Ready', description: 'Generated slide deck from diagnosis summary.' });
          }
        } catch (e) {
          console.error('Bridge generation error:', e);
          toast({ title: 'Error', description: 'Failed to bridge presentation.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      bridgeFromDiagnosis();
    } else if (topicParam && !topic && !fromCaseId && !caseId) {
      setTopic(topicParam);
      setMode('topic');
    }
  }, [searchParams, user, isConfigured, aiConfig, router, toast, topic, language, audienceMode]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setImageFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleAudioRecorded = (audio: RecordedAudio) => {
    const newIndex = imageFiles.length;
    setImageFiles((prev) => [...prev, audio.file]);
    setImagePreviews((prev) => [...prev, audio.dataUri || audio.url]);
    if (audio.duration && audio.duration > 0) {
      setAudioDurations((prev) => ({ ...prev, [newIndex]: Math.round(audio.duration) }));
    }
    toast({
      title: 'Voice Note Attached',
      description: `Attached ${audio.fileName} (${audio.duration}s). Ready to send to Gemini!`,
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviews(imagePreviews.filter((_, index) => index !== indexToRemove));
  };

  const isAudioItem = (item: File | string, index?: number) => {
    if (index !== undefined && imageFiles[index]) {
      return imageFiles[index].type.startsWith('audio/') || /\.(webm|mp3|wav|m4a|ogg|aac|flac)$/i.test(imageFiles[index].name);
    }
    if (typeof item === 'string') {
      return item.startsWith('data:audio') || /\.(webm|mp3|wav|m4a|ogg|aac|flac)(\?.*)?$/i.test(item);
    }
    return item.type.startsWith('audio/') || /\.(webm|mp3|wav|m4a|ogg|aac|flac)$/i.test(item.name);
  };

  const getAudioFileName = (item: File | string, index: number) => {
    if (imageFiles[index]?.name) return imageFiles[index].name;
    return `Audio Note ${index + 1}`;
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setImageFiles((prev) => [...prev, file]);
          setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
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

  const handleQuestionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!isConfigured) {
      toast({
        title: 'API Key Missing',
        description: 'Please set your Gemini API Key in Settings.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const imageUrls = await Promise.all(
        imageFiles.map((file) => LocalDataService.saveFile(file, user.id))
      );
      const images = await Promise.all(imageFiles.map(fileToDataUri));

      const [response, summaryResponse] = await Promise.all([
        ClientSideAiService.answerClinicalQuestion(aiConfig, question.trim() || undefined, images, { language, audienceMode }),
        ClientSideAiService.summarizeQuestion(aiConfig, question.trim() || undefined, images, { language, audienceMode }),
      ]);

      setResult(response);
      setProactiveQuestions(response.proactiveQuestions || []);
      const newStructuredQuestion = { summary: summaryResponse.summary, images: imageUrls };
      setStructuredQuestion(newStructuredQuestion);

      const existingCase = currentCaseId ? await LocalDataService.getCase(currentCaseId) : null;
      const caseData: Partial<LocalCase> = {
        id: currentCaseId || undefined,
        userId: user.id,
        type: 'content-generator',
        title: response.topic || summaryResponse.summary,
        inputData: {
          mode: 'question',
          question: question.trim() || null,
          images: imageUrls,
          structuredQuestion: newStructuredQuestion,
        },
        outputData: {
          ...(existingCase?.outputData || {}),
          result: response,
          structuredQuestion: newStructuredQuestion,
          proactiveQuestions: response.proactiveQuestions || [],
          followUpThreads: [],
        },
      };

      const savedId = await LocalDataService.saveCase(caseData);
      if (!currentCaseId) setCurrentCaseId(savedId);
      toast({ title: 'Answer Generated', description: 'Clinical question analyzed successfully.' });
    } catch (error) {
      console.error('Question submission failed:', error);
      toast({ title: 'Error', description: 'Failed to answer question.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!isConfigured) {
      toast({
        title: 'API Key Missing',
        description: 'Please set your Gemini API Key in Settings.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const data = await ClientSideAiService.generatePresentationOutline(aiConfig, {
        topic: topic.trim(),
        language,
        audienceMode,
      });
      setPresentationOutline(data.outline);
      setSelectedTopics(data.outline);
      setSuggestedTopics(data.outline);
      setResult({
        answer: `Comprehensive outline generated for: **${topic}**. Review topic selections and click "Generate Presentation" below.`,
        topic: topic,
      });

      const existingCase = currentCaseId ? await LocalDataService.getCase(currentCaseId) : null;
      const caseData: Partial<LocalCase> = {
        id: currentCaseId || undefined,
        userId: user.id,
        type: 'content-generator',
        title: topic,
        inputData: {
          mode: 'topic',
          topic: topic.trim(),
        },
        outputData: {
          ...(existingCase?.outputData || {}),
          outline: data.outline,
          selectedTopics: data.outline,
          suggestedTopics: data.outline,
          result: {
            answer: `Comprehensive outline generated for: **${topic}**.`,
            topic: topic.trim(),
          },
        },
      };

      const savedId = await LocalDataService.saveCase(caseData);
      if (!currentCaseId) setCurrentCaseId(savedId);
    } catch (error) {
      console.error('Topic submission failed:', error);
      toast({ title: 'Error', description: 'Failed to generate outline.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!user || !isConfigured) return;
    setIsLoading(true);
    try {
      const data = await ClientSideAiService.generatePresentationOutline(aiConfig, {
        question: question,
        answer: result?.answer,
        reasoning: result?.reasoning,
        topic: result?.topic || topic,
        language,
        audienceMode,
      });
      setPresentationOutline(data.outline);
      setSelectedTopics(data.outline);
      setSuggestedTopics(data.outline);

      if (currentCaseId) {
        const caseData = await LocalDataService.getCase(currentCaseId);
        if (caseData) {
          caseData.outputData = {
            ...caseData.outputData,
            outline: data.outline,
            selectedTopics: data.outline,
            suggestedTopics: data.outline,
            structuredQuestion: structuredQuestion,
          };
          await LocalDataService.saveCase(caseData);
        }
      }
    } catch (error) {
      console.error('Outline generation failed:', error);
      toast({ title: 'Error', description: 'Failed to generate outline.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (!user || !isConfigured || selectedTopics.length === 0) return;
    setIsLoading(true);
    try {
      const placeholders = selectedTopics.map((t) => ({ title: t, content: [] }));
      setSlides(placeholders);

      const generatedSlides = await ClientSideAiService.generateSlideContent(aiConfig, {
        topic: result?.topic || topic,
        selectedTopics,
        fullQuestion: question,
        fullAnswer: result?.answer,
        caseSummaryForPresentation: question,
        language,
        audienceMode,
      });

      setSlides(generatedSlides);
      setUsedTopics(selectedTopics);

      if (currentCaseId) {
        const caseData = await LocalDataService.getCase(currentCaseId);
        if (caseData) {
          caseData.outputData = {
            ...caseData.outputData,
            slides: generatedSlides,
            outline: presentationOutline,
            selectedTopics: selectedTopics,
            usedTopics: selectedTopics,
            suggestedTopics: suggestedTopics.length > 0 ? suggestedTopics : presentationOutline,
            structuredQuestion: structuredQuestion,
          };
          await LocalDataService.saveCase(caseData);
        }
      }
      toast({ title: 'Presentation Generated', description: 'Your slide deck has been saved locally.' });
    } catch (error) {
      console.error('Presentation generation failed:', error);
      toast({ title: 'Error', description: 'Failed to generate slides.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskFollowUp = async (q: string) => {
    if (!isConfigured || isAskingFollowUp || !user) return;
    setIsAskingFollowUp(true);
    try {
      const conversationHistory = followUpThreads.map((t) => ({
        question: t.question,
        answer: t.answer,
      }));

      const followUpRes = await ClientSideAiService.answerClinicalFollowUp(aiConfig, {
        originalQuestion: question || topic,
        originalAnswer: result?.answer,
        diagnosesSummary: result?.topic,
        userFollowUp: q,
        conversationHistory,
        language,
        audienceMode,
      });

      const newThread: FollowUpThread = {
        id: Date.now().toString(),
        question: q,
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

      if (currentCaseId) {
        const caseData = await LocalDataService.getCase(currentCaseId);
        if (caseData) {
          caseData.outputData = {
            ...caseData.outputData,
            followUpThreads: updatedThreads,
            proactiveQuestions: followUpRes.suggestedFollowUps || proactiveQuestions,
          };
          await LocalDataService.saveCase(caseData);
        }
      }
    } catch (e) {
      console.error('Follow-up error:', e);
      toast({ title: 'Error', description: 'Failed to answer follow-up.', variant: 'destructive' });
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleNewCase = () => {
    processedFromCaseRef.current = null;
    loadedCaseIdRef.current = null;
    setMode('question');
    setQuestion('');
    setImageFiles([]);
    setImagePreviews([]);
    setTopic('');
    setResult(null);
    setSlides(null);
    setCurrentCaseId(null);
    setStructuredQuestion(null);
    setPresentationOutline(null);
    setSelectedTopics([]);
    setUsedTopics([]);
    setSuggestedTopics([]);
    setFollowUpThreads([]);
    router.push('/content-generator');
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  };

  if (authLoading || (!user && !searchParams.get('caseId'))) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-8 space-y-6">
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
                    To generate postgraduate slide decks and clinical outlines, configure your Gemini API key.
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

      {/* Input Mode Tabs Card */}
      {!result && !isLoading && (
        <Card className="border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Medical Content & Slide Generator
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Generate clinical presentations, viva outlines, or deep answers for medical topics.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
            <ModeLanguageSelector />
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="question" className="text-xs sm:text-sm">
                  Clinical Question & Case
                </TabsTrigger>
                <TabsTrigger value="topic" className="text-xs sm:text-sm">
                  Medical Topic & Outline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="question" className="space-y-4">
                <form onSubmit={handleQuestionSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clinical-question" className="text-xs font-semibold">
                        Clinical Question or Case Details
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <VoiceInputButton
                          onTranscript={(text) => {
                            setQuestion((prev) => (prev ? `${prev} ${text}` : text));
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7"
                        />
                      </div>
                    </div>
                    <Textarea
                      id="clinical-question"
                      placeholder="Enter a clinical inquiry, ECG interpretation question, or case vignette..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onPaste={handlePaste}
                      className="min-h-[120px] text-xs sm:text-sm resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dictate live speech with the mic icon above, or record / upload an audio memo below to send directly to Gemini.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-xs font-semibold">Attached Images, Audio Memos & Reports</Label>
                      <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                    </div>

                    {/* Audio Attachments List */}
                    {imagePreviews.some((preview, i) => isAudioItem(preview, i)) && (
                      <div className="space-y-2 pt-1 w-full max-w-full overflow-hidden">
                        {imagePreviews.map((preview, index) => {
                          if (!isAudioItem(preview, index)) return null;
                          return (
                            <AudioPlayerCard
                              key={index}
                              src={preview}
                              fileName={getAudioFileName(preview, index)}
                              duration={audioDurations[index]}
                              onRemove={() => handleRemoveImage(index)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Images and Documents */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {imagePreviews.map((preview, index) => {
                        if (isAudioItem(preview, index)) return null;
                        return (
                          <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg border shadow-xs">
                            <img src={preview} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                      <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed hover:bg-muted/60 transition-colors">
                        <span className="text-[10px] text-muted-foreground font-medium">+ Add File</span>
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
                    disabled={isLoading || (!question.trim() && imageFiles.length === 0)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Analyze & Generate Clinical Answer
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="topic" className="space-y-4">
                <form onSubmit={handleTopicSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="medical-topic" className="text-xs font-semibold">
                        Medical Presentation Topic
                      </Label>
                      <VoiceInputButton
                        onTranscript={(text) => {
                          setTopic((prev) => (prev ? `${prev} ${text}` : text));
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7"
                      />
                    </div>
                    <Input
                      id="medical-topic"
                      placeholder="e.g. Acute Aortic Syndromes, ARDS Berlin Criteria & Mechanical Ventilation, Diabetic Nephropathy"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 text-xs sm:text-sm font-semibold shadow-xs"
                    disabled={isLoading || !topic.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Outline...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Presentation Outline
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !result && !slides && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Consultant AI analyzing clinical guidelines & generating content...
          </p>
        </div>
      )}

      {/* Result Display & Outline / Presentation Flow */}
      {result && (
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    {result.topic || 'Clinical Topic'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Medical content analysis and presentation builder.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleNewCase} className="text-xs shrink-0">
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> New Case
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {structuredQuestion && (
                <QuestionDisplay
                  summary={structuredQuestion.summary}
                  images={structuredQuestion.images}
                />
              )}

              <div
                className="prose prose-sm max-w-none dark:prose-invert text-xs sm:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatText(result.answer) }}
              />

              {/* Generate Outline Button (if not yet generated) */}
              {!slides && !presentationOutline && !isLoading && (
                <Button onClick={handleGenerateOutline} className="h-10 text-xs sm:text-sm gap-2 font-semibold shadow-xs">
                  <Layers className="h-4 w-4" />
                  Generate Multi-Slide Presentation Outline
                </Button>
              )}

              {/* Skeleton loading for outline */}
              {isLoading && !presentationOutline && (
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              )}

              {/* Topic Selection Checklist */}
              {presentationOutline && (!slides || slides.length === 0) && (
                <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Select Topics to Build Presentation Deck
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Select which high-yield modules you wish to render as full presentation slides.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedTopics.length === presentationOutline.length) {
                          setSelectedTopics([]);
                        } else {
                          setSelectedTopics(presentationOutline);
                        }
                      }}
                      className="text-xs"
                    >
                      {selectedTopics.length === presentationOutline.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {presentationOutline.map((t, i) => {
                      const isUsed = usedTopics.includes(t);
                      const isChecked = selectedTopics.includes(t);
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs sm:text-sm transition-all ${
                            isUsed ? 'bg-muted/50 opacity-60' : 'bg-background hover:bg-accent/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`outline-topic-${i}`}
                            checked={isUsed || isChecked}
                            disabled={isUsed}
                            onChange={() =>
                              setSelectedTopics((prev) =>
                                prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                              )
                            }
                            className="rounded h-4 w-4 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={`outline-topic-${i}`}
                            className={`cursor-pointer flex-1 font-medium ${
                              isUsed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {t} {isUsed && <span className="text-[10px] text-muted-foreground font-normal">(Generated)</span>}
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleGeneratePresentation}
                    disabled={isLoading || selectedTopics.length === 0}
                    className="w-full sm:w-auto h-10 text-xs sm:text-sm font-semibold gap-2 shadow-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating {selectedTopics.length} Slide(s)...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Generate Presentation ({selectedTopics.length} Slides)
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Render Full Interactive Slide Presentation Deck */}
              {slides && slides.length > 0 && (
                <SlideEditor
                  initialSlides={slides}
                  topic={result.topic || topic}
                  caseId={currentCaseId}
                  questionContext={question}
                  outline={presentationOutline || []}
                  initialSuggestedTopics={suggestedTopics}
                  initialUsedTopics={usedTopics}
                  onRefresh={() => handleGeneratePresentation()}
                  onNewCase={handleNewCase}
                  onUpdate={async (data) => {
                    if (!currentCaseId) return;
                    const caseData = await LocalDataService.getCase(currentCaseId);
                    if (!caseData) return;

                    const updatedOutputData = { ...caseData.outputData };

                    if (data.slides) {
                      setSlides(data.slides);
                      updatedOutputData.slides = data.slides;
                    }
                    if (data.suggestedTopics) {
                      setSuggestedTopics(data.suggestedTopics);
                      updatedOutputData.suggestedTopics = data.suggestedTopics;
                    }
                    if (data.usedTopics) {
                      setUsedTopics(data.usedTopics);
                      updatedOutputData.usedTopics = data.usedTopics;
                    }

                    caseData.outputData = updatedOutputData;
                    await LocalDataService.saveCase(caseData);
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Interactive Follow-Up Engine */}
          <FollowUpChat
            proactiveQuestions={proactiveQuestions}
            threads={followUpThreads}
            onAskFollowUp={handleAskFollowUp}
            isLoading={isAskingFollowUp}
            title="Clinical Inquiries & Q&A"
            description="Explore guidelines, pathophysiology mechanisms, or ask custom questions regarding this topic."
            sourceContext="slide"
          />
        </div>
      )}
    </div>
  );
}

export default function ContentGeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ContentGeneratorContent />
    </Suspense>
  );
}
