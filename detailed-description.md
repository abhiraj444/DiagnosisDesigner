# Medical AI Presentation & Clinical Workup System
## Comprehensive Architecture, Workflows, Schemas & Implementation Guide

This document contains the complete, reproduction-ready blueprint for the **Medical AI Presentation & Clinical Workup System**. Any AI agent, developer, or team can implement, build, test, and deploy the entire project from this file.

---

## 1. Executive Overview & System Purpose

The application is an AI-powered Clinical Diagnostic Workup and Medical Education Slide Deck Generator tailored for medical students (MBBS/PG residents), clinicians, educators, and curious learners/patients.

### Core Capabilities
1. **Multimodal Clinical Case Analysis & Differential Diagnosis (`/ai-diagnosis`)**:
   - Accepts clinical vignettes, laboratory values, vital signs, audio dictations (Web Audio Speech Recognition or file uploads), and diagnostic imaging/documents (ECGs, chest X-rays, CTs, lab PDFs/PNGs).
   - Generates differential diagnoses with life-threat triage categories (`Emergent`, `Urgent`, `Secondary`), confidence metrics, step-by-step diagnostic reasoning, missing information/tests checklist, and comprehensive clinical synthesis.
   - Interactive follow-up conversational Q&A threads with smart suggested next questions.
   - **One-Click Slide Deck Bridge**: Direct transfer of a case's structured clinical diagnosis into an educational presentation without re-sending raw image files.

2. **Medical Presentation & Slide Deck Generator (`/content-generator`)**:
   - Supports two input modes: **Medical Topic Mode** (e.g. *"Acute Pancreatitis"*, *"Hyperkalemia"*) or **Clinical Question/Case Mode**.
   - Generates structured, customizable presentation outlines with topics that can be reordered, added, or removed.
   - Generates production-grade slide decks with diverse structured content types: formatted paragraphs with exact-substring bolding, bullet points, numbered workflows, callout notes, and balanced data tables.
   - Per-slide high-yield **Clinical Pearls / Did You Know bio facts**, interactive **Proactive Deep Dive Questions**, and instant **Per-Slide Interactive Q&A**.
   - Interactive slide editor allowing inline content modification, topic reordering, AI-assisted slide regeneration, and adding new slides.
   - Export slide decks to formatted **PowerPoint (.pptx)** files or print to PDF.

3. **Dual Audience Mode & Strict Multilingual Output System**:
   - **Doctor / Clinician (Technical)**: Emphasizes postgraduate medical rigor, exact pathophysiological molecular cascades, differential probabilities, and standard clinical guidelines (ACC/AHA, ESC, KDIGO, GOLD, Surviving Sepsis) with board exam pearls.
   - **Simplified / First-Principles (Patient & Curious Learner)**: Explains medical concepts from fundamental physics, plumbing, chemistry, and biology using intuitive analogies to demystify bodily mechanisms and inspire self-learning while preserving clinical accuracy.
   - **English & Hinglish Output**: Full support for English or conversational Roman-script Hinglish (*"Patient ko acute retrosternal chest pain hai..."*).
   - **Strict Language Override Directives**: System prompts strictly enforce that output is delivered in the chosen target language regardless of whether user input/audio is in Hindi, English, or mixed dialects.

4. **Offline-First Local Storage & Authentication**:
   - Automatic local storage persistence (`LocalDataService`) allowing full functionality without cloud lock-in.
   - Built-in credentials management via local browser storage (`localStorage`) or environment variables (`GEMINI_API_KEY`).
   - Case History dashboard (`/history`) with full export/import/save/delete capabilities.

---

## 2. Technology Stack & Framework Setup

- **Framework**: Next.js 15+ with App Router (`/src/app`)
- **Language**: TypeScript (`strict: true`)
- **Styling**: Tailwind CSS v4, PostCSS, Lucide React icons (`lucide-react`)
- **Animation & Transitions**: `motion` (`motion/react`)
- **Slide Export**: `pptxgenjs` (Client-side presentation builder)
- **AI SDK**: `@google/generative-ai` (Gemini 2.5 Flash model client-side execution)
- **Theme**: Dark/Light mode theme system with CSS variables / Tailwind dark class.

---

## 3. Directory & File Structure

```
/
├── .env.example
├── metadata.json
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # Landing page / Quick Launcher
│   │   ├── globals.css                       # Tailwind imports & baseline styling
│   │   ├── ai-diagnosis/
│   │   │   └── page.tsx                      # Clinical Diagnosis & Workup page
│   │   ├── content-generator/
│   │   │   └── page.tsx                      # Presentation & Slide Deck Studio
│   │   ├── history/
│   │   │   └── page.tsx                      # Case & Presentation History page
│   │   └── settings/
│   │       └── page.tsx                      # API credentials & global preferences
│   ├── components/
│   │   ├── Header.tsx                        # Main navigation with mode indicator
│   │   ├── ModeLanguageSelector.tsx          # Responsive Doctor/Simplified & EN/Hinglish switcher
│   │   ├── DiagnosisCard.tsx                 # High-yield diagnosis card with badges
│   │   ├── FollowUpChat.tsx                  # Interactive case follow-up chat engine
│   │   ├── EnhancedSlideRenderer.tsx         # Slide viewport with pearls, Q&A & animations
│   │   ├── SlideEditor.tsx                   # Slide reorder, add, remove, AI-edit panel
│   │   ├── VoiceInputButton.tsx              # Web Audio Speech-to-Text mic button
│   │   └── ui/                               # Reusable UI components (Button, Card, Tabs, Badge, etc.)
│   ├── context/
│   │   ├── SettingsContext.tsx               # API key, AudienceMode, TargetLanguage state
│   │   └── ThemeContext.tsx                  # Light/Dark mode state
│   ├── hooks/
│   │   ├── useAuth.ts                        # Local guest/authenticated session management
│   │   └── use-toast.ts                      # Notification toast system
│   ├── lib/
│   │   ├── ClientSideAiService.ts            # Gemini prompt orchestration & JSON parsers
│   │   ├── LocalDataService.ts               # LocalStorage case management & history
│   │   └── utils.ts                          # Tailwind class merger (cn helper)
│   └── types/
│       └── index.ts                          # Comprehensive TypeScript interface definitions
```

---

## 4. Core TypeScript Data Models (`/src/types/index.ts`)

```typescript
export type TargetLanguage = 'english' | 'hinglish';
export type AudienceMode = 'doctor' | 'simplified';

export interface DiagnosisItem {
  diagnosis: string;
  confidenceLevel: number; // 0.0 to 1.0
  lifeThreatCategory?: 'Emergent' | 'Urgent' | 'Secondary';
  reasoning: string;
  missingInformation: {
    information: string[];
    tests: string[];
  };
}

export interface ClinicalAnswerData {
  answer: string;
  reasoning: string;
  topic?: string;
  keyTakeaways?: string[];
}

export interface FollowUpThread {
  id: string;
  question: string;
  answer: string;
  reasoning?: string;
  suggestedFollowUps?: string[];
  createdAt: string;
}

export type ContentItem =
  | { type: 'paragraph'; text: string; bold?: string[] }
  | { type: 'bullet_list'; items: Array<{ text: string; bold?: string[] }> }
  | { type: 'numbered_list'; items: Array<{ text: string; bold?: string[] }> }
  | { type: 'note'; text: string }
  | { type: 'table'; headers: string[]; rows: Array<{ cells: string[] }> };

export interface Slide {
  title: string;
  content: ContentItem[];
  summary?: string;
  clinicalPearls?: string[];
  proactiveQuestions?: string[];
}

export interface LocalCase {
  id: string;
  title: string;
  createdAt: string;
  inputData: {
    question?: string;
    topic?: string;
    images?: string[];
    audioNotes?: string;
  };
  outputData?: {
    diagnoses?: DiagnosisItem[];
    clinicalAnswer?: ClinicalAnswerData;
    summary?: string;
    proactiveQuestions?: string[];
    slides?: Slide[];
    presentationOutline?: string[];
    followUpThreads?: FollowUpThread[];
  };
}
```

---

## 5. Client-Side AI Service & Prompt Engineering (`/src/lib/ClientSideAiService.ts`)

The AI engine uses Google Gemini (`gemini-2.5-flash`) directly with rigorous structured JSON schema prompts.

### 5.1 Language & Audience Directives
- **`getLanguageDirective(language: 'english' | 'hinglish')`**:
  - In `hinglish` mode: Mandates output in conversational Hindi-English in Roman alphabet. Enforces that medical terminology (drugs, tests, anatomical names) stays in standard English.
  - In `english` mode: Strict clinical English without mixed regional terms.
  - **Absolute Override Rule**: Even if user voice recordings or text are in Hindi Devanagari, the AI outputs strictly in the selected target language.
- **`getAudienceDirective(audienceMode: 'doctor' | 'simplified')`**:
  - `doctor`: Clinical guidelines (ACC/AHA, ESC, KDIGO, GOLD), cellular pathophysiology, likelihood ratios, pharmacotherapy classes.
  - `simplified`: First-principles biological mechanics, intuitive analogies (e.g. heart as dual pump, blood vessels as elastic highways), and curiosity-sparking insights for self-learning.

### 5.2 Core AI Service Methods
1. **`generateComprehensiveDiagnosis(apiKey, patientData, images, options)`**:
   - Takes multimodal clinical vignette + medical images (ECG, X-ray, CT).
   - Generates differential diagnoses array with confidence levels, life threats, missing information, clinical synthesis, proactive questions, and a token-efficient `caseSummaryForPresentation`.
2. **`answerClinicalFollowUp(apiKey, params)`**:
   - Multi-turn case Q&A retaining conversation history and producing rich explanations and 3 suggested follow-up questions.
3. **`generatePresentationOutline(apiKey, input)`**:
   - Creates 10–15 structured presentation slide topics for either a medical topic or a clinical case vignette.
4. **`generateSlideContent(apiKey, input)`**:
   - Generates JSON array of slides with diverse content blocks (tables, bullets, paragraphs, notes), slide summaries, clinical pearls, and proactive questions.
5. **`generatePresentationFromCaseSummary(apiKey, caseSummary, topic, diagnosesText, options)`**:
   - Token-efficient bridge: Converts a diagnosis directly into a full 10-slide deck without re-uploading large image base64 files.
6. **`answerSlideFollowUp(apiKey, params)`**:
   - Slide-specific conversational tutor answering questions about that particular slide's clinical content and pearls.

---

## 6. End-to-End User Workflows

### Workflow A: Clinical Case Diagnosis & Workup (`/ai-diagnosis`)
1. **Input**: User enters clinical history or uses mic voice input. Optionally attaches lab reports, ECGs, or X-rays.
2. **Preference**: Sets **Presentation & Tone** (`Doctor` or `Simplified`) and **Language** (`English` or `Hinglish`).
3. **Analysis**: Gemini analyzes findings and outputs:
   - Case summary banner.
   - Ranked differential diagnosis cards with life-threat severity pills (`Emergent`, `Urgent`, `Secondary`), confidence meters, and missing lab/test checklists.
   - Comprehensive clinical synthesis with key takeaways.
   - Proactive deep-dive question pills.
4. **Interactive Follow-Up**: User asks questions in text or voice to explore alternative differentials, medication dosing, or underlying physiology.
5. **Generate Presentation Bridge**: User clicks *"Generate Presentation from Case"*. The app redirects to `/content-generator` with pre-loaded case context and automatically generates an outline.

### Workflow B: Medical Presentation Studio (`/content-generator`)
1. **Selection**: User chooses **Medical Topic** or **Clinical Case Vignette** mode.
2. **Outline Builder**: Gemini produces a 10–12 slide topic outline. User can drag, reorder, delete, or add topics.
3. **Slide Deck Generation**: Gemini creates rich interactive slides.
4. **Interactive Slide Viewer**:
   - Fullscreen presentation view or carousel view.
   - Toggle **Clinical Pearls / Did You Know** drawer.
   - Click suggested proactive question pills or ask custom questions in the slide Q&A drawer.
5. **Slide Editor**: Allows manual edits to slide titles, content items, adding/removing rows from tables, and AI-assisted slide regeneration.
6. **Export**: One-click download as PowerPoint (`.pptx`) using formatted layouts or print to PDF.

### Workflow C: Global Settings & Case Management
- **Settings (`/settings`)**: Set API key, default audience mode, and language preference saved to `localStorage`.
- **History (`/history`)**: Browse saved clinical cases and presentations, reload them instantly, or delete old sessions.

---

## 7. Slide PowerPoint Export Engine (`pptxgenjs`)

When exporting slides to PowerPoint:
- Uses widescreen 16:9 layout (`LAYOUT_16x9`).
- Converts slide content blocks into clean slides:
  - Header: Slide title with primary theme color accent bar.
  - Body: Automatically formats paragraphs, bullet lists, numbered steps, callout boxes, and structured tables with styled header rows.
  - Footer: Displays high-yield slide summary and key clinical pearls.

---

## 8. Mobile & Responsive Layout Rules

- The `ModeLanguageSelector` uses responsive grid layouts (`grid-cols-2 w-full sm:w-auto`) with truncation protection so it fits on 320px mobile screens up to 4K desktop displays.
- Slide presentation view supports touch swipe navigation on tablets and mobile phones.
- Header contains a compact status indicator showing active mode (e.g. `Doctor • English`).

---

## 9. Verification & Quality Checklist

1. Run `npm run lint` — Must pass with 0 errors.
2. Run `npm run build` — Must compile the Next.js production build cleanly.
3. Verify that changing between Doctor and Simplified modes changes the tone and complexity of diagnoses and slides.
4. Verify that Hinglish output writes natural conversational Hindi in Roman/Latin script while keeping medical terms in English.
5. Verify that Slide Q&A drawer responds cleanly to text questions without visual clutter.
