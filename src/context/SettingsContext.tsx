'use client';

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { AiProvider, AiConfig } from '@/types';

export type TargetLanguage = 'english' | 'hinglish';
export type AudienceMode = 'doctor' | 'simplified';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash';

interface SettingsContextType {
    // AI Provider Configuration
    aiProvider: AiProvider;
    setAiProvider: (provider: AiProvider) => void;
    
    // Gemini Settings
    apiKey: string; // alias for geminiApiKey for backwards compatibility
    setApiKey: (key: string) => void;
    geminiApiKey: string;
    setGeminiApiKey: (key: string) => void;
    geminiModel: string;
    setGeminiModel: (model: string) => void;
    
    // Custom LLM / Endpoint Settings
    customEndpoint: string;
    setCustomEndpoint: (endpoint: string) => void;
    customApiKey: string;
    setCustomApiKey: (key: string) => void;
    customModel: string;
    setCustomModel: (model: string) => void;

    // Derived AI state
    activeModel: string;
    aiConfig: AiConfig;
    isConfigured: boolean;
    hasServerKey: boolean;

    // Language & Audience Preferences
    language: TargetLanguage;
    setLanguage: (lang: TargetLanguage) => void;
    audienceMode: AudienceMode;
    setAudienceMode: (mode: AudienceMode) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [aiProvider, setAiProviderInternal] = useState<AiProvider>('gemini');
    const [geminiApiKey, setGeminiApiKeyInternal] = useState<string>('');
    const [geminiModel, setGeminiModelInternal] = useState<string>(DEFAULT_GEMINI_MODEL);
    const [hasServerKey, setHasServerKey] = useState<boolean>(false);

    const [customEndpoint, setCustomEndpointInternal] = useState<string>('');
    const [customApiKey, setCustomApiKeyInternal] = useState<string>('');
    const [customModel, setCustomModelInternal] = useState<string>('gpt-4o');

    const [language, setLanguageInternal] = useState<TargetLanguage>('english');
    const [audienceMode, setAudienceModeInternal] = useState<AudienceMode>('doctor');

    useEffect(() => {
        // Check if server-side environment variable is configured
        fetch('/api/ai/status')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.hasServerKey) {
                    setHasServerKey(true);
                }
            })
            .catch(() => {
                // Ignore background fetch failure
            });

        // Load Provider
        const savedProvider = localStorage.getItem('app_ai_provider') as AiProvider | null;
        if (savedProvider === 'gemini' || savedProvider === 'custom') {
            setAiProviderInternal(savedProvider);
        }

        // Load Gemini Config
        const savedGeminiKey = localStorage.getItem('gemini_api_key');
        if (savedGeminiKey) {
            setGeminiApiKeyInternal(savedGeminiKey);
        } else if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            setGeminiApiKeyInternal(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        }

        const savedGeminiModel = localStorage.getItem('app_gemini_model');
        if (savedGeminiModel) {
            setGeminiModelInternal(savedGeminiModel);
        } else {
            setGeminiModelInternal(DEFAULT_GEMINI_MODEL);
        }

        // Load Custom LLM Endpoint Config
        const savedEndpoint = localStorage.getItem('app_custom_endpoint');
        if (savedEndpoint) {
            setCustomEndpointInternal(savedEndpoint);
        }
        const savedCustomKey = localStorage.getItem('app_custom_api_key');
        if (savedCustomKey) {
            setCustomApiKeyInternal(savedCustomKey);
        }
        const savedCustomModel = localStorage.getItem('app_custom_model');
        if (savedCustomModel) {
            setCustomModelInternal(savedCustomModel);
        }

        // Load Language & Audience
        const savedLang = localStorage.getItem('app_target_language') as TargetLanguage | null;
        if (savedLang === 'english' || savedLang === 'hinglish') {
            setLanguageInternal(savedLang);
        }

        const savedMode = localStorage.getItem('app_audience_mode') as AudienceMode | null;
        if (savedMode === 'doctor' || savedMode === 'simplified') {
            setAudienceModeInternal(savedMode);
        }
    }, []);

    const setAiProvider = (provider: AiProvider) => {
        localStorage.setItem('app_ai_provider', provider);
        setAiProviderInternal(provider);
    };

    const setGeminiApiKey = (key: string) => {
        localStorage.setItem('gemini_api_key', key);
        setGeminiApiKeyInternal(key);
    };

    // Alias for backwards compatibility
    const setApiKey = (key: string) => {
        setGeminiApiKey(key);
    };

    const setGeminiModel = (model: string) => {
        const sanitized = model.trim() || DEFAULT_GEMINI_MODEL;
        localStorage.setItem('app_gemini_model', sanitized);
        setGeminiModelInternal(sanitized);
    };

    const setCustomEndpoint = (endpoint: string) => {
        localStorage.setItem('app_custom_endpoint', endpoint);
        setCustomEndpointInternal(endpoint);
    };

    const setCustomApiKey = (key: string) => {
        localStorage.setItem('app_custom_api_key', key);
        setCustomApiKeyInternal(key);
    };

    const setCustomModel = (model: string) => {
        localStorage.setItem('app_custom_model', model);
        setCustomModelInternal(model);
    };

    const setLanguage = (lang: TargetLanguage) => {
        localStorage.setItem('app_target_language', lang);
        setLanguageInternal(lang);
    };

    const setAudienceMode = (mode: AudienceMode) => {
        localStorage.setItem('app_audience_mode', mode);
        setAudienceModeInternal(mode);
    };

    // Derived values
    const isConfigured =
        aiProvider === 'gemini'
            ? (!!geminiApiKey || hasServerKey)
            : !!customEndpoint.trim() && !!customModel.trim();

    const activeModel =
        aiProvider === 'gemini'
            ? geminiModel || DEFAULT_GEMINI_MODEL
            : customModel || 'Custom Model';

    const aiConfig: AiConfig = useMemo(() => ({
        provider: aiProvider,
        apiKey: geminiApiKey,
        geminiApiKey,
        geminiModel: geminiModel || DEFAULT_GEMINI_MODEL,
        customEndpoint,
        customApiKey,
        customModel,
    }), [aiProvider, geminiApiKey, geminiModel, customEndpoint, customApiKey, customModel]);

    return (
        <SettingsContext.Provider
            value={{
                aiProvider,
                setAiProvider,
                apiKey: geminiApiKey,
                setApiKey,
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
                activeModel,
                aiConfig,
                isConfigured,
                hasServerKey,
                language,
                setLanguage,
                audienceMode,
                setAudienceMode,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

