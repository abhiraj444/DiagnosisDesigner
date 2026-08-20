'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSettings, DEFAULT_GEMINI_MODEL } from '@/context/SettingsContext';
import { ClientSideAiService } from '@/lib/ClientSideAiService';
import type { AiProvider, AiConfig } from '@/types';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Cpu,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  RotateCcw,
  Activity,
  Sliders,
} from 'lucide-react';

import { ModeLanguageSelector } from '@/components/ModeLanguageSelector';

const GEMINI_MODEL_PRESETS = [
  {
    id: 'gemini-3.7-flash',
    label: 'gemini-3.7-flash',
    tag: 'Latest & Recommended',
    desc: 'Cutting-edge reasoning, fast response times, high clinical accuracy.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'gemini-3.1-pro-preview',
    tag: 'Deep Reasoning',
    desc: 'Complex clinical cases, multi-step pathophysiology, academic rigor.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'gemini-3.1-flash-lite',
    tag: 'Ultra-Fast',
    desc: 'Instant slide generation and lightweight clinical lookups.',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'gemini-2.5-flash',
    tag: 'Stable Legacy',
    desc: 'Previous generation standard flash model.',
  },
];

const CUSTOM_PROVIDER_PRESETS = [
  {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    notes: 'Requires OpenAI API Key',
  },
  {
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-r1',
    notes: 'Access any open source or commercial model',
  },
  {
    name: 'Groq Cloud',
    endpoint: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    notes: 'Ultra-high speed inference',
  },
  {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    notes: 'DeepSeek reasoning & general models',
  },
  {
    name: 'Ollama (Local)',
    endpoint: 'http://localhost:11434/v1',
    defaultModel: 'llama3.3',
    notes: 'Self-hosted local model, API key optional',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    aiProvider,
    setAiProvider,
    geminiApiKey,
    setGeminiApiKey,
    geminiModel,
    setGeminiModel,
    customEndpoint,
    setCustomEndpoint,
    customApiKey,
    setCustomApiKey,
    customModel,
    setCustomModel,
  } = useSettings();

  // Local form state
  const [provider, setLocalProvider] = useState<AiProvider>(aiProvider);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
  const [localGeminiModel, setLocalGeminiModel] = useState(geminiModel || DEFAULT_GEMINI_MODEL);

  const [localCustomEndpoint, setLocalCustomEndpoint] = useState(customEndpoint);
  const [localCustomKey, setLocalCustomKey] = useState(customApiKey);
  const [localCustomModel, setLocalCustomModel] = useState(customModel || 'gpt-4o');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);

  // Connection Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    modelUsed: string;
    latencyMs?: number;
  } | null>(null);

  const handleApplyPreset = (preset: (typeof CUSTOM_PROVIDER_PRESETS)[0]) => {
    setLocalCustomEndpoint(preset.endpoint);
    setLocalCustomModel(preset.defaultModel);
    setTestResult(null);
    toast({
      title: `${preset.name} Preset Selected`,
      description: `Endpoint set to ${preset.endpoint} with model ${preset.defaultModel}`,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const testConfig: AiConfig = {
      provider,
      apiKey: provider === 'gemini' ? localGeminiKey : localCustomKey,
      geminiApiKey: localGeminiKey,
      geminiModel: localGeminiModel.trim() || DEFAULT_GEMINI_MODEL,
      customEndpoint: localCustomEndpoint.trim(),
      customApiKey: localCustomKey.trim(),
      customModel: localCustomModel.trim(),
    };

    try {
      const res = await ClientSideAiService.testConnection(testConfig);
      setTestResult(res);
      if (res.success) {
        toast({
          title: 'Connection Successful',
          description: `AI model (${res.modelUsed}) responded in ${res.latencyMs}ms.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: res.message,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to reach AI service.',
        modelUsed: provider === 'gemini' ? localGeminiModel : localCustomModel,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setAiProvider(provider);
    setGeminiApiKey(localGeminiKey.trim());
    setGeminiModel(localGeminiModel.trim() || DEFAULT_GEMINI_MODEL);

    setCustomEndpoint(localCustomEndpoint.trim());
    setCustomApiKey(localCustomKey.trim());
    setCustomModel(localCustomModel.trim() || 'gpt-4o');

    toast({
      title: 'Settings Saved',
      description: `Active AI Provider: ${provider === 'gemini' ? 'Google Gemini' : 'Custom LLM'} (${
        provider === 'gemini' ? localGeminiModel || DEFAULT_GEMINI_MODEL : localCustomModel
      })`,
    });
    router.back();
  };

  const handleResetDefaults = () => {
    setLocalProvider('gemini');
    setLocalGeminiModel(DEFAULT_GEMINI_MODEL);
    setLocalCustomEndpoint('');
    setLocalCustomKey('');
    setLocalCustomModel('gpt-4o');
    setTestResult(null);
    toast({
      title: 'Reset to Defaults',
      description: `Default Gemini model restored to ${DEFAULT_GEMINI_MODEL}.`,
    });
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="h-9 px-3 gap-2 rounded-xl text-xs font-semibold hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Journal</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="stamp-badge text-[10px] stamp-inquiry">
            PREFERENCES &amp; AI ENGINE
          </span>
        </div>
      </div>

      {/* Presentation Style & Language Preferences */}
      <Card className="border border-border shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-amber-400/50 via-primary/40 to-blue-500/40" />
        <CardHeader className="bg-muted/20 border-b border-border/70 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                <Sliders className="h-4 w-4 text-primary" />
                Teaching Style &amp; Language Directives
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Configure your target audience perspective and bilingual clinical vocabulary.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <ModeLanguageSelector />
        </CardContent>
      </Card>

      {/* AI Model & Provider Architecture */}
      <Card className="border border-border shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-blue-500/50 to-emerald-500/50" />
        <CardHeader className="bg-muted/20 border-b border-border/70 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                <Cpu className="h-4 w-4 text-primary" />
                AI Inference Engine &amp; Model Selection
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Choose between Google Gemini or configure a custom OpenAI-compatible LLM endpoint (e.g. OpenRouter, Groq, DeepSeek, Ollama).
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Provider Selection Tabs */}
          <Tabs
            value={provider}
            onValueChange={(val) => {
              setLocalProvider(val as AiProvider);
              setTestResult(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border h-11">
              <TabsTrigger
                value="gemini"
                className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Google Gemini</span>
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <Server className="h-3.5 w-3.5 text-blue-500" />
                <span>Custom LLM / Endpoint</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: GOOGLE GEMINI */}
            <TabsContent value="gemini" className="space-y-6 pt-4">
              {/* API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gemini-key" className="text-xs font-bold text-foreground">
                    Google Gemini API Key
                  </Label>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Get Key from Google AI Studio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="gemini-key"
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={localGeminiKey}
                    onChange={(e) => {
                      setLocalGeminiKey(e.target.value);
                      setTestResult(null);
                    }}
                    className="pr-10 rounded-xl font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showGeminiKey ? 'Hide key' : 'Show key'}
                  >
                    {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your key is stored only in your local browser sandbox and never shared with 3rd parties.
                </p>
              </div>

              {/* Gemini Model Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gemini-model-name" className="text-xs font-bold text-foreground">
                    Gemini Model Name / Identifier
                  </Label>
                  <span className="text-[11px] font-mono text-primary font-semibold">
                    Active: {localGeminiModel || DEFAULT_GEMINI_MODEL}
                  </span>
                </div>

                {/* Model Quick Select Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GEMINI_MODEL_PRESETS.map((preset) => {
                    const isSelected = localGeminiModel === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setLocalGeminiModel(preset.id);
                          setTestResult(null);
                        }}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs'
                            : 'border-border bg-background hover:bg-card hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {preset.label}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {preset.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Exact Model Name Input */}
                <div className="pt-2 space-y-1.5">
                  <Label htmlFor="custom-gemini-model-input" className="text-xs font-medium text-muted-foreground">
                    Or specify exact model name:
                  </Label>
                  <Input
                    id="custom-gemini-model-input"
                    type="text"
                    placeholder="e.g. gemini-3.7-flash, gemini-3.1-pro-preview, gemini-flash-latest"
                    value={localGeminiModel}
                    onChange={(e) => {
                      setLocalGeminiModel(e.target.value);
                      setTestResult(null);
                    }}
                    className="font-mono text-xs rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Default model is set to <strong>{DEFAULT_GEMINI_MODEL}</strong> for state-of-the-art diagnostic synthesis.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: CUSTOM LLM ENDPOINT */}
            <TabsContent value="custom" className="space-y-6 pt-4">
              {/* Quick Provider Preset Chips */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  Quick Provider Presets
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_PROVIDER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-card hover:border-primary/40 text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5 text-foreground"
                    >
                      <span>⚡</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Endpoint URL */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-endpoint" className="text-xs font-bold text-foreground">
                  Base Endpoint URL (OpenAI-compatible)
                </Label>
                <Input
                  id="custom-endpoint"
                  type="url"
                  placeholder="https://api.openai.com/v1 or https://openrouter.ai/api/v1"
                  value={localCustomEndpoint}
                  onChange={(e) => {
                    setLocalCustomEndpoint(e.target.value);
                    setTestResult(null);
                  }}
                  className="font-mono text-xs rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground">
                  The service automatically formats standard <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">/chat/completions</code> routes.
                </p>
              </div>

              {/* Custom Model Name */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-model-id" className="text-xs font-bold text-foreground">
                  Model Identifier / Name
                </Label>
                <Input
                  id="custom-model-id"
                  type="text"
                  placeholder="e.g. gpt-4o, deepseek/deepseek-r1, llama-3.3-70b-versatile, claude-3-7-sonnet"
                  value={localCustomModel}
                  onChange={(e) => {
                    setLocalCustomModel(e.target.value);
                    setTestResult(null);
                  }}
                  className="font-mono text-xs rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground">
                  Enter the exact model string required by your provider endpoint.
                </p>
              </div>

              {/* Custom API Key */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-api-key" className="text-xs font-bold text-foreground">
                  Endpoint API Key
                </Label>
                <div className="relative">
                  <Input
                    id="custom-api-key"
                    type={showCustomKey ? 'text' : 'password'}
                    placeholder="sk-... or Bearer Token (leave empty for local Ollama)"
                    value={localCustomKey}
                    onChange={(e) => {
                      setLocalCustomKey(e.target.value);
                      setTestResult(null);
                    }}
                    className="pr-10 rounded-xl font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomKey(!showCustomKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showCustomKey ? 'Hide key' : 'Show key'}
                  >
                    {showCustomKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sent securely in the <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Authorization: Bearer</code> header.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Connection Test Action & Diagnostics */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="gap-2 text-xs font-bold rounded-xl h-9 border-border hover:border-primary/40 shadow-2xs"
              >
                {isTesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Activity className="h-3.5 w-3.5 text-primary" />
                )}
                <span>Test Model Connection</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetDefaults}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Default (gemini-3.7-flash)</span>
              </Button>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      {testResult.success ? 'Model Verified & Ready' : 'Connection Error'}
                    </span>
                    {testResult.latencyMs && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border">
                        {testResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed break-words opacity-90">
                    {testResult.message}
                  </p>
                  <p className="text-[10px] font-mono opacity-75">
                    Model: {testResult.modelUsed}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 border-t border-border p-4 sm:p-5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-handwriting hidden sm:inline">
            configurations saved to local journal storage
          </span>
          <Button onClick={handleSave} className="w-full sm:w-auto px-6 h-10 rounded-xl text-xs font-bold gap-2 shadow-xs">
            <Save className="h-4 w-4" />
            <span>Save &amp; Apply Model Settings</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
