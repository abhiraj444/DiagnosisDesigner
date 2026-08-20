# Project Functionality: Fresh Medical AI Diagnosis App

This document outlines the key functionalities, technologies, and architectural components of the Fresh Medical AI Diagnosis application.

## 1. Core Application Features

*   **Medical Case Submission:** Users can submit medical cases for AI-driven diagnosis. This submission can be in the form of text or an image.
*   **AI-Powered Diagnosis:** The backend utilizes AI models (specifically Gemini or other compatible models via Genkit) to analyze submitted medical cases.
*   **Provisional Diagnosis with Confidence Scores:** The AI returns multiple provisional diagnoses, each accompanied by a confidence score, indicating the likelihood of that diagnosis.
*   **Result Presentation:** On the result screen, both the user's original submitted question (whether text or image) and the AI-generated diagnoses are presented.

## 2. Technology Stack

*   **Frontend:**
    *   **Framework:** Next.js (React)
    *   **Styling:** Tailwind CSS
    *   **UI Components:** Radix UI
    *   **Form Management:** React Hook Form with Zod for schema validation.
*   **Backend & AI Integration:**
    *   **AI Framework:** Genkit (integrates with Google AI, including Gemini).
    *   **Firebase:**
        *   **Authentication:** For user management.
        *   **Firestore:** For database operations (likely storing user data, submitted cases, and diagnosis results).
        *   **Cloud Storage:** For storing user-submitted images.
*   **Document Generation:**
    *   `docx`: For generating `.docx` files.
    *   `file-saver`: For saving generated files on the client-side.
    *   `jspdf` and `jspdf-autotable`: For generating PDF documents, potentially for diagnosis reports.

## 3. Project Structure Highlights

*   `src/app/`: Contains Next.js pages and API routes.
    *   `src/app/ai-diagnosis/page.tsx`: Likely the main page for submitting cases and viewing results.
    *   `src/app/api/genkit/[[...slug]]/`: Genkit API routes for AI model interaction.
    *   `src/app/login/page.tsx`: User authentication interface.
    *   `src/app/history/page.tsx`: Likely displays a history of user submissions and diagnoses.
*   `src/ai/`: Contains Genkit-related configurations and AI flows.
    *   `genkit.config.ts`: Genkit configuration, enabling Google AI and Next.js integration.
    *   `src/ai/flows/`: Directory containing specific AI flows (e.g., `ai-diagnosis.ts`, `answer-clinical-question.ts`, `summarize-question.ts`).
*   `src/components/`: Reusable React components (e.g., `DiagnosisCard.tsx`, `Header.tsx`, `HistoryCard.tsx`, `QuestionDisplay.tsx`).
*   `src/lib/firebase.ts`: Firebase initialization and configuration, using environment variables for credentials.
*   `src/context/`: Context providers (e.g., `AuthContext.tsx`, `ThemeContext.tsx`).
*   `src/hooks/`: Custom React hooks (e.g., `useAuth.ts`).

## 4. AI Diagnosis Flow (Inferred)

1.  User submits a medical case (text or image) via the Next.js frontend.
2.  The frontend sends the case data to a Genkit-powered API route.
3.  Genkit orchestrates the interaction with the configured AI model (Gemini).
4.  The AI model processes the input and generates provisional diagnoses with confidence scores.
5.  Genkit returns the AI's response to the Next.js frontend.
6.  The frontend displays the original question and the AI's diagnoses on the result screen.

This document provides a comprehensive overview of the Fresh Medical AI Diagnosis App.
