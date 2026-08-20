import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DiagnosisItem, ClinicalAnswerData, Slide, FollowUpThread, AiConfig } from '@/types';
import type { TargetLanguage, AudienceMode } from '@/context/SettingsContext';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash';

/**
 * Resolves full AI configuration either from an AiConfig object, a raw API key string,
 * or persistent localStorage preferences.
 */
export function resolveAiConfig(configOrKey?: string | AiConfig): AiConfig {
    if (!configOrKey || typeof configOrKey === 'string') {
        const storedProvider = (typeof window !== 'undefined' ? localStorage.getItem('app_ai_provider') : null) as 'gemini' | 'custom' | null;
        const storedGeminiKey = (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const storedGeminiModel = (typeof window !== 'undefined' ? localStorage.getItem('app_gemini_model') : null) || DEFAULT_GEMINI_MODEL;

        const storedCustomEndpoint = (typeof window !== 'undefined' ? localStorage.getItem('app_custom_endpoint') : '') || '';
        const storedCustomKey = (typeof window !== 'undefined' ? localStorage.getItem('app_custom_api_key') : '') || '';
        const storedCustomModel = (typeof window !== 'undefined' ? localStorage.getItem('app_custom_model') : '') || 'gpt-4o';

        const explicitKey = typeof configOrKey === 'string' ? configOrKey : '';

        if (storedProvider === 'custom' && storedCustomEndpoint) {
            return {
                provider: 'custom',
                customEndpoint: storedCustomEndpoint,
                customApiKey: storedCustomKey || explicitKey,
                customModel: storedCustomModel || 'gpt-4o',
                geminiApiKey: storedGeminiKey || explicitKey,
                geminiModel: storedGeminiModel,
            };
        }

        return {
            provider: 'gemini',
            apiKey: explicitKey || storedGeminiKey,
            geminiApiKey: explicitKey || storedGeminiKey,
            geminiModel: storedGeminiModel || DEFAULT_GEMINI_MODEL,
        };
    }

    return configOrKey;
}

/**
 * Normalizes and extracts clean MIME type and pure Base64 data from any media input (audio, image, PDF, blob URLs).
 */
export async function normalizeMediaForGemini(mediaInput: string): Promise<{ data: string; mimeType: string } | null> {
    if (!mediaInput || typeof mediaInput !== 'string') return null;
    let target = mediaInput.trim();

    // If Blob or HTTP(S) URL, resolve asynchronously
    if (target.startsWith('blob:') || target.startsWith('http://') || target.startsWith('https://')) {
        try {
            const response = await fetch(target);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
            );
            const rawType = blob.type || 'audio/webm';
            return { data: base64, mimeType: sanitizeMimeType(rawType) };
        } catch (e) {
            console.warn('Failed to resolve media URL:', e);
            return null;
        }
    }

    // If Data URI: data:[<mediatype>][;codecs=...][;base64],<data>
    if (target.startsWith('data:')) {
        const commaIdx = target.indexOf(',');
        if (commaIdx === -1) return null;

        const header = target.substring(5, commaIdx);
        const base64Data = target.substring(commaIdx + 1).trim();
        const rawMime = header.split(';')[0].trim().toLowerCase();

        return {
            data: base64Data,
            mimeType: sanitizeMimeType(rawMime),
        };
    }

    // Raw Base64 string
    return {
        data: target,
        mimeType: detectMimeFromBase64(target),
    };
}

function sanitizeMimeType(rawMime: string): string {
    const lower = rawMime.toLowerCase().split(';')[0].trim();

    if (lower === 'audio/webm' || lower.includes('webm')) return 'audio/webm';
    if (lower === 'audio/mp3' || lower === 'audio/mpeg' || lower.includes('mpeg')) return 'audio/mp3';
    if (lower === 'audio/wav' || lower === 'audio/x-wav' || lower === 'audio/wave') return 'audio/wav';
    if (lower === 'audio/ogg' || lower.includes('ogg') || lower === 'audio/opus') return 'audio/ogg';
    if (lower === 'audio/aac' || lower === 'audio/x-aac') return 'audio/aac';
    if (lower === 'audio/flac' || lower === 'audio/x-flac') return 'audio/flac';
    if (lower === 'audio/m4a' || lower === 'audio/x-m4a' || lower === 'audio/mp4' || lower === 'audio/mp4a-latm') return 'audio/mp4';

    if (lower === 'application/pdf' || lower.includes('pdf')) return 'application/pdf';

    if (lower === 'image/jpeg' || lower === 'image/jpg' || lower === 'image/pjpeg') return 'image/jpeg';
    if (lower === 'image/png') return 'image/png';
    if (lower === 'image/webp') return 'image/webp';
    if (lower === 'image/gif') return 'image/gif';
    if (lower === 'image/heic') return 'image/heic';
    if (lower === 'image/heif') return 'image/heif';

    if (lower.startsWith('audio/')) return 'audio/webm';
    if (lower.startsWith('image/')) return 'image/jpeg';

    return 'image/jpeg';
}

function detectMimeFromBase64(base64: string): string {
    if (base64.startsWith('JVBERi0')) return 'application/pdf';
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('GkXf')) return 'audio/webm';
    if (base64.startsWith('T2dnUw')) return 'audio/ogg';
    if (base64.startsWith('SUQz') || base64.startsWith('//+')) return 'audio/mp3';
    if (base64.startsWith('UklGR')) return 'audio/wav';
    if (base64.startsWith('AAAA') || base64.includes('ftyp')) return 'audio/mp4';
    if (base64.startsWith('fLaC') || base64.startsWith('ZkxhQw')) return 'audio/flac';

    return 'image/jpeg';
}

/**
 * Universal prompt executor supporting both Google Gemini models (default gemini-3.7-flash, custom Gemini names)
 * and Custom OpenAI-compatible endpoints (OpenAI, OpenRouter, Groq, Ollama, DeepSeek, Mistral, etc.).
 */
export async function executeAiPrompt(
    configOrKey: string | AiConfig | undefined,
    prompt: string,
    images?: string[]
): Promise<string> {
    const config = resolveAiConfig(configOrKey);

    if (config.provider === 'custom') {
        let endpoint = config.customEndpoint?.trim();
        if (!endpoint) {
            throw new Error('Custom LLM endpoint is not configured. Please set your endpoint URL in Settings.');
        }

        if (!endpoint.endsWith('/chat/completions')) {
            endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const key = config.customApiKey || config.apiKey;
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }

        const contentParts: any[] = [{ type: 'text', text: prompt }];
        if (images && images.length > 0) {
            for (const img of images) {
                const normalized = await normalizeMediaForGemini(img);
                if (normalized && normalized.data) {
                    if (normalized.mimeType.startsWith('image/')) {
                        contentParts.push({
                            type: 'image_url',
                            image_url: {
                                url: `data:${normalized.mimeType};base64,${normalized.data}`,
                            },
                        });
                    } else if (normalized.mimeType.startsWith('audio/')) {
                        contentParts.push({
                            type: 'input_audio',
                            input_audio: {
                                data: normalized.data,
                                format: normalized.mimeType.replace('audio/', ''),
                            },
                        });
                    }
                }
            }
        }

        const payload = {
            model: config.customModel || 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: contentParts.length === 1 ? prompt : contentParts,
                },
            ],
            temperature: 0.2,
        };

        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Custom AI Endpoint Error (${res.status}): ${err.slice(0, 300)}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }

    // Google Gemini Provider
    const apiKey =
        config.geminiApiKey ||
        config.apiKey ||
        (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '') ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        '';

    if (!apiKey) {
        throw new Error('Google Gemini API Key is missing. Please add your key in Settings.');
    }

    const modelName = config.geminiModel || DEFAULT_GEMINI_MODEL;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const parts: any[] = [prompt];
    if (images && images.length > 0) {
        for (const img of images) {
            const normalized = await normalizeMediaForGemini(img);
            if (normalized && normalized.data) {
                parts.push({
                    inlineData: {
                        data: normalized.data,
                        mimeType: normalized.mimeType,
                    },
                });
            }
        }
    }

    const result = await model.generateContent(parts);
    return result.response.text();
}

/**
 * Robust JSON extraction helper handling codeblocks and bracket extraction across LLMs.
 */
export function parseAiJson<T>(rawText: string, fallback: T): T {
    try {
        const clean = rawText.trim();
        return JSON.parse(clean);
    } catch {
        // Look for markdown code block ```json ... ```
        const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlock) {
            try {
                return JSON.parse(codeBlock[1].trim());
            } catch {
                // continue
            }
        }
        // Look for bracket matches
        const bracketMatch = rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (bracketMatch) {
            try {
                let jsonText = bracketMatch[0];
                jsonText = jsonText.replace(/\\n/g, ' ').replace(/\\t/g, ' ');
                return JSON.parse(jsonText);
            } catch (e) {
                console.error('Failed to parse matched JSON block:', e);
            }
        }
    }
    return fallback;
}

/**
 * Returns explicit prompt directives to strictly enforce the user's chosen output language,
 * regardless of the language or script used in the input (text, audio, documents, Hindi, etc.).
 */
export function getLanguageDirective(language: TargetLanguage = 'english'): string {
    if (language === 'hinglish') {
        return `
**MANDATORY LANGUAGE & SCRIPT DIRECTIVE (HINGLISH):**
- **User's Chosen Target Output Language**: **HINGLISH** (Conversational Hindi-English blend written strictly in Latin/Roman English alphabet).
- **ABSOLUTE LANGUAGE ENFORCEMENT**: Even if the input text, clinical vignette, user question, or attached audio dictation/voice memo is spoken or written in pure Hindi (Devanagari script), English, Marathi, Tamil, Bengali, or any other language, your ENTIRE JSON response (all text, titles, clinical reasoning, pathophysiology, proactive questions, summaries, bullet points, and pearls) MUST strictly and unconditionally be composed in **natural, fluent, conversational HINGLISH using the Roman/Latin alphabet**.
- **DO NOT** output Devanagari script (e.g. do NOT use "रोगी को..."). Always write phonetically in Roman script (e.g. "Patient ko acute chest pain hai...").
- Keep standard medical condition names, anatomical terms, drug names, and diagnostic test names in English (e.g., "Aortic Dissection", "Myocardial Infarction", "Echocardiogram", "Beta-blockers", "Troponin-I") while explaining concepts, mechanisms, and instructions in conversational Hinglish.
`;
    }

    return `
**MANDATORY LANGUAGE DIRECTIVE (ENGLISH):**
- **User's Chosen Target Output Language**: **ENGLISH**.
- **ABSOLUTE LANGUAGE ENFORCEMENT**: Even if the input text, clinical vignette, question, or attached audio dictation/voice memo is spoken or written in Hindi (Devanagari or Romanized), Hinglish, Marathi, Tamil, or any other regional language/accent, your ENTIRE JSON response (all titles, diagnoses, reasoning, summaries, proactive questions, bullet points, and pearls) MUST strictly and unconditionally be composed in clear, professional, authoritative **ENGLISH**.
- Do not mix random Hindi words into the response. Maintain pure English.
`;
}

/**
 * Returns explicit prompt directives for the selected Audience Mode:
 * - 'doctor': Standard clinical rigor for MBBS students, PG residents, and clinicians.
 * - 'simplified': First-principles, engaging breakdown for patients and curious learners to spark enthusiasm and independent research.
 */
export function getAudienceDirective(audienceMode: AudienceMode = 'doctor'): string {
    if (audienceMode === 'simplified') {
        return `
**TARGET AUDIENCE & TONE: SIMPLIFIED / FIRST-PRINCIPLES ENTHUSIAST (PATIENT & CURIOUS LEARNER)**
- **Core Educational Mission**: Explain this clinical diagnosis or medical topic from **FIRST PRINCIPLES** (fundamental physics, mechanics, plumbing, electricity, chemistry, and biology) so that any patient, high school or college student, or curious explorer can intuitively understand what is happening inside the human body.
- **Intuitive Real-World Analogies**: Use vivid, memorable metaphors (e.g., the heart as a high-pressure dual-chamber pump, blood vessels as elastic highways, the immune system as specialized security patrols, the kidneys as microscopic coffee filters, neurons as insulated fiber-optic wires).
- **Spark Curiosity & Self-Research**: Formulate explanations to spark genuine curiosity and excitement about human biology! Highlight fascinating "Did you know?" bio-mechanics insights that inspire the user to research the topic further on their own.
- **Accessible yet Scientifically Accurate**: Avoid overwhelming jargon. When introducing a real medical term (e.g., "Systolic Hypertension" or "Atherosclerosis"), immediately explain the root meaning simply in parentheses.
- **Empowering Next Steps**: Provide clear, reassuring, practical takeaways on what warning signs mean, how medications help restore balance in the body, and what smart questions to ask a doctor.
`;
    }

    return `
**TARGET AUDIENCE & TONE: CLINICAL / DOCTOR (MBBS, PG RESIDENTS & CLINICIANS - TECHNICAL)**
- **Core Clinical Mission**: Deliver rigorous, postgraduate-level evidence-based medicine and academic clinical precision.
- **Deep Pathophysiology**: Detail cellular/molecular pathophysiology, hemodynamic alterations, receptor kinetics, and biochemical cascades.
- **Guideline Citations**: Reference established clinical guidelines (ACC/AHA, ESC, KDIGO, GOLD, Surviving Sepsis, IDSA, ADA, NICE).
- **High-Yield Specifics**: Emphasize pre-test and post-test probabilities, likelihood ratios, "can't-miss" emergent life threats, pharmacotherapeutic drug classes, dosage contraindications, and high-yield board/viva pearls.
`;
}

export const ClientSideAiService = {
    /**
     * Legacy helper returning a Gemini model instance. Defaulted to gemini-3.7-flash.
     */
    async getGeminiModel(apiKey: string, customModelName?: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: customModelName || DEFAULT_GEMINI_MODEL });
    },

    /**
     * Diagnostic Ping to verify AI credentials and endpoint responsiveness
     */
    async testConnection(configOrKey?: string | AiConfig): Promise<{
        success: boolean;
        message: string;
        modelUsed: string;
        latencyMs: number;
    }> {
        const startTime = Date.now();
        const config = resolveAiConfig(configOrKey);
        const modelName =
            config.provider === 'custom'
                ? config.customModel || 'Custom Endpoint'
                : config.geminiModel || DEFAULT_GEMINI_MODEL;

        try {
            const reply = await executeAiPrompt(
                config,
                'Respond with the single word "READY" to verify clinical AI readiness and connectivity.'
            );
            const latencyMs = Date.now() - startTime;
            return {
                success: true,
                message: `Connection successful (${latencyMs}ms): ${reply.trim().slice(0, 80)}`,
                modelUsed: modelName,
                latencyMs,
            };
        } catch (err: any) {
            const latencyMs = Date.now() - startTime;
            return {
                success: false,
                message: err?.message || 'Connection test failed. Please verify API key, endpoint URL, and network access.',
                modelUsed: modelName,
                latencyMs,
            };
        }
    },

    /**
     * Master AI Diagnosis Generator:
     * Supports both Clinical/Doctor mode and Simplified First-Principles mode,
     * in English or Hinglish with strict language enforcement.
     */
    async generateComprehensiveDiagnosis(
        apiKeyOrConfig: string | AiConfig,
        patientData?: string,
        images?: string[],
        options?: {
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ): Promise<{
        diagnoses: DiagnosisItem[];
        clinicalAnswer: ClinicalAnswerData;
        summary: string;
        proactiveQuestions: string[];
        caseSummaryForPresentation: string;
    }> {
        const language = options?.language || 'english';
        const audienceMode = options?.audienceMode || 'doctor';

        const prompt = `
You are an expert Medical Consultant and Educator analyzing a medical case.

${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

Analyze the provided clinical notes, patient history, laboratory findings, attached audio dictations/voice memos, and medical imaging/documents. If audio files are attached, listen to the speaker's case presentation, auscultation audio, or symptoms described.

**Required Output Schema:**
Return a single, strictly valid JSON object matching this structure:
{
  "summary": "Concise 1-2 sentence summary of the case vignette / core bodily issue",
  "diagnoses": [
    {
      "diagnosis": "Condition Name",
      "confidenceLevel": 0.85,
      "lifeThreatCategory": "Emergent" | "Urgent" | "Secondary",
      "reasoning": "${
          audienceMode === 'simplified'
              ? 'First-principles explanation of how this condition affects the body, using intuitive real-world analogies so anyone can understand why this happens.'
              : 'Detailed pathophysiology and clinical evidence supporting or refuting this diagnosis based on findings.'
      }",
      "missingInformation": {
        "information": ["${
            audienceMode === 'simplified'
                ? 'Key questions or everyday symptoms to check with the patient / doctor'
                : 'Specific clinical history or physical exam findings to clarify'
        }"],
        "tests": ["${
            audienceMode === 'simplified'
                ? 'Simple explanation of what tests (e.g. Blood test, X-Ray, ECG) are needed and why'
                : 'Specific guideline-directed diagnostic test / biomarker / imaging with rationale'
        }"]
      }
    }
  ],
  "clinicalAnswer": {
    "answer": "${
        audienceMode === 'simplified'
            ? 'Engaging first-principles synthesis covering: 1. How this bodily system works normally vs what happened here, 2. Intuitive analogy explaining the root cause, 3. Immediate safe steps & what doctors look for, 4. How standard treatments help restore normal function, 5. Fascinating takeaways that spark curiosity for self-research.'
            : 'In-depth clinical synthesis covering: 1. Primary clinical impression & pathophysiology, 2. Immediate stabilization & triage protocols, 3. Step-by-step guideline-directed medical therapy (e.g. ACC/AHA, ESC, KDIGO, GOLD, Surviving Sepsis), 4. Key prognostic indicators and red flags.'
    }",
    "reasoning": "${
        audienceMode === 'simplified'
            ? 'The intuitive scientific explanation behind why these conclusions make sense.'
            : 'Comprehensive diagnostic breakdown and clinical judgment rationale.'
    }",
    "topic": "Primary Medical Specialty & Topic",
    "keyTakeaways": [
      "${audienceMode === 'simplified' ? 'Exciting first-principle takeaway 1' : 'Crucial clinical takeaway 1'}",
      "${audienceMode === 'simplified' ? 'Exciting first-principle takeaway 2' : 'Crucial clinical takeaway 2'}",
      "${audienceMode === 'simplified' ? 'Exciting first-principle takeaway 3' : 'Crucial clinical takeaway 3'}"
    ]
  },
  "proactiveQuestions": [
    "${
        audienceMode === 'simplified'
            ? 'Thought-provoking question 1 to spark curiosity about how the body adapts or compensates'
            : 'High-yield follow-up question 1 highlighting potential diagnostic blind spots or second-line management'
    }",
    "${
        audienceMode === 'simplified'
            ? 'Fascinating question 2 about the science behind why specific treatments work'
            : 'High-yield follow-up question 2 regarding atypical presentations or drug contraindications'
    }",
    "${
        audienceMode === 'simplified'
            ? 'Curiosity question 3 exploring related bodily systems or evolutionary biology'
            : 'High-yield follow-up question 3 regarding monitoring protocols or escalation triggers'
    }",
    "${
        audienceMode === 'simplified'
            ? 'Practical question 4 on what patients can research to better understand their health'
            : 'High-yield follow-up question 4 regarding board-relevant differential distinctions'
    }"
  ],
  "caseSummaryForPresentation": "A dense, structured synthesis combining presentation, key findings, provisional diagnoses, and mechanism. This will be used directly as text context to generate educational slide decks without re-sending raw image files."
}

${patientData ? `\nPatient Data & Clinical Notes:\n${patientData}` : ''}
`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt, images);

        const fallback = {
            diagnoses: [
                {
                    diagnosis: 'Provisional Clinical Differential',
                    confidenceLevel: 0.75,
                    reasoning: text,
                    missingInformation: { information: [], tests: [] },
                },
            ],
            clinicalAnswer: {
                answer: text,
                reasoning: 'Clinical reasoning generated.',
                topic: 'Clinical Analysis',
            },
            summary: 'Clinical Case Analysis',
            proactiveQuestions: [
                'What additional investigations should be prioritized?',
                'What are the physiological mechanisms involved?',
                'What are the guideline-directed treatment protocols?',
            ],
            caseSummaryForPresentation: patientData || 'Clinical Case',
        };

        const parsed = parseAiJson(text, fallback);

        return {
            diagnoses: parsed.diagnoses || fallback.diagnoses,
            clinicalAnswer: parsed.clinicalAnswer || fallback.clinicalAnswer,
            summary: parsed.summary || fallback.summary,
            proactiveQuestions: parsed.proactiveQuestions || fallback.proactiveQuestions,
            caseSummaryForPresentation:
                parsed.caseSummaryForPresentation || parsed.summary || patientData || 'Case study details',
        };
    },

    /**
     * Follow-up Q&A Engine for Clinical Cases:
     */
    async answerClinicalFollowUp(
        apiKeyOrConfig: string | AiConfig,
        params: {
            originalQuestion?: string;
            originalAnswer?: string;
            diagnosesSummary?: string;
            userFollowUp: string;
            conversationHistory?: Array<{ question: string; answer: string }>;
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ): Promise<{
        answer: string;
        reasoning?: string;
        suggestedFollowUps?: string[];
    }> {
        const language = params.language || 'english';
        const audienceMode = params.audienceMode || 'doctor';

        const prompt = `
You are an expert Medical Consultant and Educator answering a follow-up inquiry on a medical case.

${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

**Original Case Context:**
- Clinical Notes / Question: ${params.originalQuestion || 'N/A'}
- Primary Diagnoses / Summary: ${params.diagnosesSummary || 'N/A'}
- Initial Analysis: ${params.originalAnswer || 'N/A'}

${
    params.conversationHistory && params.conversationHistory.length > 0
        ? `**Previous Follow-up Thread:**\n${params.conversationHistory
              .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
              .join('\n\n')}\n`
        : ''
}

**User's Follow-up Question:**
"${params.userFollowUp}"

**Instructions:**
1. Provide a comprehensive answer tailored to the specified audience and language.
2. If in Simplified mode, break down the answer from first principles with intuitive analogies. If in Doctor mode, provide deep academic and guideline-cited precision.
3. Suggest 3 additional high-yield follow-up questions relevant to this thread.
4. Output MUST be a valid JSON object:
{
  "answer": "Clear, detailed answer with markdown formatting for bold headings and key points in the chosen language.",
  "reasoning": "Underlying biological mechanism or clinical rationale.",
  "suggestedFollowUps": ["Next question 1", "Next question 2", "Next question 3"]
}
`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt);

        return parseAiJson(text, {
            answer: text,
            reasoning: 'Clinical reasoning provided.',
            suggestedFollowUps: [],
        });
    },

    /**
     * Follow-up Q&A Engine for Individual Slides:
     */
    async answerSlideFollowUp(
        apiKeyOrConfig: string | AiConfig,
        params: {
            presentationTopic: string;
            slideTitle: string;
            slideContent: any;
            slideSummary?: string;
            userQuestion: string;
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ): Promise<{
        answer: string;
        reasoning?: string;
        clinicalPearls?: string[];
    }> {
        const language = params.language || 'english';
        const audienceMode = params.audienceMode || 'doctor';

        const prompt = `
You are an expert Medical Educator explaining a specific presentation slide.

${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

**Presentation Main Topic:** ${params.presentationTopic}
**Current Slide Title:** ${params.slideTitle}
**Slide Content:** ${JSON.stringify(params.slideContent)}
${params.slideSummary ? `**Slide Summary:** ${params.slideSummary}` : ''}

**User's Question on this Slide:**
"${params.userQuestion}"

**Instructions:**
1. Provide a clear, engaging answer specific to this slide's domain in the chosen language and audience style.
2. If in Simplified mode, explain the core concept from first principles with vivid analogies. If in Doctor mode, connect concepts to clinical practice, pathophysiology, and board exam pearls.
3. Output valid JSON:
{
  "answer": "Detailed answer explaining the concept with clear formatting.",
  "reasoning": "Deeper mechanism / biological context.",
  "clinicalPearls": [
    "${audienceMode === 'simplified' ? 'Fascinating first-principle insight 1' : 'High-yield clinical pearl 1'}",
    "${audienceMode === 'simplified' ? 'Fascinating first-principle insight 2' : 'High-yield clinical pearl 2'}"
  ]
}
`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt);

        return parseAiJson(text, {
            answer: text,
            reasoning: 'Educational rationale.',
            clinicalPearls: [],
        });
    },

    /**
     * Direct Clinical Question Answerer:
     */
    async answerClinicalQuestion(
        apiKeyOrConfig: string | AiConfig,
        question?: string,
        images?: string[],
        options?: {
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ) {
        const language = options?.language || 'english';
        const audienceMode = options?.audienceMode || 'doctor';

        let prompt = `
You are an expert Medical Consultant and Educator.

${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

Answer the clinical inquiry or case presentation in detail according to the selected audience mode and language. If audio dictations or voice recordings are attached, listen to the speaker's inquiry, findings, or case presentation.

**Constraints:**
1. Output MUST be a valid JSON object.
2. The object must have: "answer", "reasoning", "topic", "proactiveQuestions" (array of 3-4 high yield questions), and "keyTakeaways" (array of 3 points).
`;

        if (question) prompt += `\n\nQuestion: ${question}`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt, images);

        return parseAiJson(text, {
            answer: text,
            reasoning: 'Analysis performed by clinical AI model.',
            topic: 'Clinical Analysis',
            proactiveQuestions: [
                'What are the primary mechanisms for this condition?',
                'How to approach refractory cases?',
            ],
            keyTakeaways: [],
        });
    },

    async summarizeQuestion(
        apiKeyOrConfig: string | AiConfig,
        question?: string,
        images?: string[],
        options?: {
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ) {
        const language = options?.language || 'english';

        let prompt = `
${getLanguageDirective(language)}

Summarize the following clinical question or patient data into a concise 1-2 sentence title / summary.
`;
        if (question) prompt += `\n\nInput: ${question}`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt, images);
        return { summary: text.trim() };
    },

    /**
     * Presentation Outline Generator
     */
    async generatePresentationOutline(
        apiKeyOrConfig: string | AiConfig,
        input: {
            question?: string;
            answer?: string;
            reasoning?: string;
            topic?: string;
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ) {
        const language = input.language || 'english';
        const audienceMode = input.audienceMode || 'doctor';

        let prompt = `
${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}
`;

        if (input.topic) {
            prompt += `
Generate a structured medical presentation outline of 12-15 slide titles for the topic: **${input.topic}**.
${
    audienceMode === 'simplified'
        ? 'Structure the outline to introduce the topic from basic fundamentals and intuitive analogies up to practical understanding, exciting biology facts, and empowering lifestyle/treatment insights.'
        : 'Structure the outline covering introduction, pathophysiology, clinical presentation, diagnostic criteria/workup, management guidelines, special populations/complications, and high-yield board summary.'
}

Output a valid JSON object with a single key "outline" whose value is an array of strings in the target language.
`;
        } else {
            prompt += `
Generate a structured presentation outline of 10-12 topics based on this clinical case.
The VERY FIRST topic MUST be "${audienceMode === 'simplified' ? 'Case Story & Core Questions' : 'Clinical Case Summary and Key Questions'}".
Subsequent topics must cover Pathophysiology/Mechanisms, Differential Considerations, Diagnostic Workup, Evidence-Based Management, and Key Insights.

Output a valid JSON object with a single key "outline" containing an array of strings in the target language.

Case Details:
Question: ${input.question}
Answer: ${input.answer}
Reasoning: ${input.reasoning}
`;
        }

        const text = await executeAiPrompt(apiKeyOrConfig, prompt);

        return parseAiJson(text, {
            outline: [
                'Overview & First Principles',
                'Core Biological Mechanisms',
                'Signs, Symptoms & Bodily Signals',
                'Diagnostic Tests Explained',
                'Treatment Strategies & How Therapies Work',
                'Prevention & Long-Term Health',
                'Fascinating Insights & Key Takeaways',
            ],
        });
    },

    /**
     * Detailed Slide Content Generator with Per-Slide Pearls and Summaries:
     */
    async generateSlideContent(
        apiKeyOrConfig: string | AiConfig,
        input: {
            topic: string;
            selectedTopics: string[];
            fullQuestion?: string;
            fullAnswer?: string;
            caseSummaryForPresentation?: string;
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ): Promise<Slide[]> {
        const language = input.language || 'english';
        const audienceMode = input.audienceMode || 'doctor';

        const prompt = `
You are a Premier Medical Professor and Educational Director creating an exceptional slide deck.

${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

**Presentation Parameters:**
- **Main Topic:** ${input.topic}
${input.fullQuestion ? `- **Full Case / Question:** ${input.fullQuestion}` : ''}
${input.fullAnswer ? `- **Full Analysis:** ${input.fullAnswer}` : ''}
${input.caseSummaryForPresentation ? `- **Case Synthesis:** ${input.caseSummaryForPresentation}` : ''}

**Topics for Slide Generation:**
${input.selectedTopics.map((t: string) => `- ${t}`).join('\n')}

**Core Requirements:**
1. Generate one slide for EACH topic listed. Output MUST be a JSON array of slide objects.
2. For each slide, produce:
   - "title": Exact topic title from the list
   - "content": Array of rich content items (paragraph, bullet_list, numbered_list, note, table)
   - "summary": A 1-2 sentence high-yield summary of this slide's core message.
   - "clinicalPearls": 2-3 ${audienceMode === 'simplified' ? 'fascinating first-principles insights or "Did You Know?" bio facts that spark excitement' : 'high-yield viva / clinical pearl bullets for medical exams'}.
   - "proactiveQuestions": 2-3 proactive deep-dive questions related to this slide.
3. For ${audienceMode === 'simplified' ? 'Simplified First-Principles audience: Use intuitive real-world analogies, clear cause-and-effect explanations, and accessible tables comparing normal vs affected states.' : 'Doctor audience: Ensure dense, authoritative, guideline-cited medical content. Use formatted tables frequently for comparisons, criteria, differential diagnoses, lab reference ranges, or treatment algorithms.'}
4. Tables: Every table MUST be custom-tailored and distinct to that specific slide's topic with real, meaningful medical values and clear column headers (e.g., Parameter vs Normal vs Pathological, Drug vs Dosage vs Mechanism, Differential vs Diagnostic Feature). NEVER reuse or duplicate generic table data across slides. In tables, EVERY row's "cells" array length MUST EXACTLY EQUAL the "headers" array length.
5. For bolding, use the "bold" array with exact substring matches. DO NOT use markdown '**' in text strings.
6. The entire output MUST be in the chosen target language (${language.toUpperCase()}).

**Supported Content Types:**
- "paragraph": {"type": "paragraph", "text": "...", "bold": ["..."]}
- "bullet_list": {"type": "bullet_list", "items": [{"text": "...", "bold": ["..."]}]}
- "numbered_list": {"type": "numbered_list", "items": [{"text": "...", "bold": ["..."]}]}
- "note": {"type": "note", "text": "..."}
- "table": {"type": "table", "headers": ["Feature", "Finding / Range", "Clinical Significance"], "rows": [{"cells": ["Specific Criteria A", "Value / Observation", "Interpretation"]}]}

Produce ONLY the JSON array.
`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt);

        const fallback = input.selectedTopics.map((t: string) => ({
            title: t,
            content: [
                {
                    type: 'paragraph' as const,
                    text: `Key details and insights for ${t}.`,
                    bold: [t],
                },
            ],
            summary: `Overview of ${t}.`,
            clinicalPearls: [`Master the core concepts for ${t}.`],
            proactiveQuestions: [`What are the latest updates on ${t}?`],
        }));

        return parseAiJson<Slide[]>(text, fallback);
    },

    /**
     * Token-Efficient Bridge: Generate Slide Deck directly from Compact Diagnosis Case Summary
     */
    async generatePresentationFromCaseSummary(
        apiKeyOrConfig: string | AiConfig,
        caseSummary: string,
        topic: string,
        diagnosesText?: string,
        options?: {
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ): Promise<{ outline: string[]; slides: Slide[] }> {
        const language = options?.language || 'english';
        const audienceMode = options?.audienceMode || 'doctor';

        // Step 1: Generate outline
        const outlineData = await this.generatePresentationOutline(apiKeyOrConfig, {
            topic: topic,
            question: caseSummary,
            answer: diagnosesText,
            language: language,
            audienceMode: audienceMode,
        });

        const selectedTopics = outlineData.outline.slice(0, 10);

        // Step 2: Generate slide content using only compact text context
        const slides = await this.generateSlideContent(apiKeyOrConfig, {
            topic: topic,
            selectedTopics: selectedTopics,
            caseSummaryForPresentation: caseSummary,
            fullAnswer: diagnosesText,
            language: language,
            audienceMode: audienceMode,
        });

        return {
            outline: outlineData.outline,
            slides: slides,
        };
    },

    async suggestTopics(
        apiKeyOrConfig: string | AiConfig,
        input: {
            question?: string;
            topic?: string;
            existingTopics: string[];
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ) {
        const language = input.language || 'english';
        const audienceMode = input.audienceMode || 'doctor';

        const prompt = `
${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

Based on the following ${input.topic ? 'medical topic' : 'clinical case'}, suggest 6-8 new topics for additional presentation slides in ${language.toUpperCase()}.
Exclude existing topics: ${input.existingTopics.join(', ')}

Output a JSON object with a single key "topics" containing an array of strings in the target language.
${input.topic ? `Topic: ${input.topic}` : `Case: ${input.question}`}
`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt);
        return parseAiJson(text, { topics: [] });
    },

    async generateSingleSlide(
        apiKeyOrConfig: string | AiConfig,
        topic: string,
        options?: {
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ): Promise<Slide> {
        const language = options?.language || 'english';
        const audienceMode = options?.audienceMode || 'doctor';

        const prompt = `
You are an expert in medical education.

${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

Generate content for a single presentation slide on the topic: **${topic}**.

**Requirements:**
1. The slide's "title" must be "${topic}".
2. Rich content using bullet lists, tables, or numbered lists in ${language.toUpperCase()}.
3. Provide "summary", "clinicalPearls" (2-3 items), and "proactiveQuestions" (2-3 items).
4. Output a single JSON object.

Format:
{
  "title": "${topic}",
  "content": [
    {"type": "bullet_list", "items": [{"text": "...", "bold": ["..."]}]}
  ],
  "summary": "...",
  "clinicalPearls": ["..."],
  "proactiveQuestions": ["..."]
}
`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt);
        return parseAiJson(text, {
            title: topic,
            content: [{ type: 'paragraph', text: `Detailed information for ${topic}.` }],
            summary: `Summary of ${topic}`,
            clinicalPearls: [],
            proactiveQuestions: [],
        });
    },

    async modifySlides(
        apiKeyOrConfig: string | AiConfig,
        input: {
            slides: any[];
            selectedIndices: number[];
            action: string;
            language?: TargetLanguage;
            audienceMode?: AudienceMode;
        }
    ) {
        const language = input.language || 'english';
        const audienceMode = input.audienceMode || 'doctor';

        const prompt = `
${getLanguageDirective(language)}

${getAudienceDirective(audienceMode)}

Modify the following presentation slides based on the action: ${input.action}.
Selected indices: ${input.selectedIndices.join(', ')}
Current slides: ${JSON.stringify(input.slides)}

Output the COMPLETE array of all slides (modified and unmodified) in valid JSON in ${language.toUpperCase()}.
`;

        const text = await executeAiPrompt(apiKeyOrConfig, prompt);
        return parseAiJson(text, input.slides);
    },
};
