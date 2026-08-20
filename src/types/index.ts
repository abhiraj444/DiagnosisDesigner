'use client';

// For structured slide content
export interface ParagraphContent {
    type: 'paragraph';
    text: string;
    bold?: string[];
}

export interface ListItemContent {
    text: string;
    bold?: string[];
}

export interface BulletListContent {
    type: 'bullet_list';
    items: ListItemContent[];
}

export interface NumberedListContent {
    type: 'numbered_list';
    items: ListItemContent[];
}

export interface NoteContent {
    type: 'note';
    text: string;
}

export interface TableRowContent {
    cells: string[];
}

export interface TableContent {
    type: 'table';
    headers: string[];
    rows: TableRowContent[];
}

export type ContentItem = ParagraphContent | BulletListContent | NumberedListContent | NoteContent | TableContent;

export interface Slide {
    title: string;
    content: ContentItem[];
    summary?: string; // High-yield executive summary of the slide
    clinicalPearls?: string[]; // High-yield medical pearls / viva facts
    proactiveQuestions?: string[]; // Proactive board / deep-dive questions for this slide
}

export interface StructuredQuestion {
    summary: string;
    images: string[];
}

export interface FollowUpThread {
    id: string;
    question: string;
    answer: string;
    reasoning?: string;
    timestamp: number;
    source?: 'diagnosis' | 'slide';
    slideTitle?: string;
}

export interface DiagnosisItem {
    diagnosis: string;
    confidenceLevel: number;
    reasoning: string;
    missingInformation?: {
        information?: string[];
        tests?: string[];
    };
    lifeThreatCategory?: 'Emergent' | 'Urgent' | 'Secondary';
}

export interface ClinicalAnswerData {
    answer: string;
    reasoning?: string;
    topic?: string;
    keyTakeaways?: string[];
    proactiveQuestions?: string[];
    caseSummaryForPresentation?: string;
}

interface BaseCase {
    id: string;
    userId: string;
    title: string;
    createdAt: number;
}

export interface DiagnosisCase extends BaseCase {
    type: 'diagnosis';
    inputData: {
        patientData?: string;
        supportingDocuments?: string[];
        structuredQuestion?: StructuredQuestion;
    };
    outputData: {
        diagnoses: DiagnosisItem[];
        clinicalAnswer: ClinicalAnswerData | null;
        proactiveQuestions?: string[];
        caseSummaryForPresentation?: string;
        followUpThreads?: FollowUpThread[];
    };
}

export interface ContentCase extends BaseCase {
    type: 'content-generator';
    inputData: {
        mode: 'question' | 'topic';
        question?: string;
        images?: string[];
        topic?: string;
        structuredQuestion?: StructuredQuestion;
        fromDiagnosisCaseId?: string;
    };
    outputData: {
        result: any;
        slides: Slide[] | null;
        outline?: string[];
        selectedTopics?: string[];
        usedTopics?: string[];
        suggestedTopics?: string[];
        followUpThreads?: FollowUpThread[];
        structuredQuestion?: StructuredQuestion;
    };
}

export type Case = DiagnosisCase | ContentCase;

export type AiProvider = 'gemini' | 'custom';

export interface AiConfig {
    provider: AiProvider;
    apiKey?: string;
    geminiApiKey?: string;
    geminiModel?: string;
    customEndpoint?: string;
    customApiKey?: string;
    customModel?: string;
}

