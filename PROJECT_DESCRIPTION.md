# Project Description: MediGen - AI-Powered Clinical Insights

MediGen is an AI-powered web application designed to assist medical professionals and students with provisional diagnoses, clinical question answering, and medical content generation. It leverages advanced AI models to process patient data and medical topics, providing structured and actionable insights.

## Core Features

### 1. AI Diagnosis
This feature allows users to input patient data (symptoms, medical history, etc.) and/or upload supporting documents (PDFs, images) to receive AI-generated provisional diagnoses.

**Key Components & Flows:**
*   **`aiDiagnosis` Flow (`src/ai/flows/ai-diagnosis.ts`)**:
    *   **Purpose**: Acts as a medical diagnostician.
    *   **Functionality**: Generates a list of potential diagnoses, each with a confidence level and detailed reasoning. It also identifies crucial missing information and suggests further diagnostic tests (e.g., lab work, imaging).
    *   **Input**: Patient data (text) and/or supporting documents (images/PDFs as data URIs).
    *   **Output**: A JSON array of `Diagnosis` objects, each containing `diagnosis`, `confidenceLevel`, `reasoning`, and `missingInformation` (optional lists of `information` and `tests`).
*   **`summarizeQuestion` Flow (`src/ai/flows/summarize-question.ts`)**:
    *   **Purpose**: Structures and summarizes the user's input.
    *   **Functionality**: Extracts the clinical question from text and/or images, reformatting options (e.g., multiple-choice) into a clean, numbered list. It prioritizes medical content and ignores irrelevant UI elements from images.
    *   **Input**: Clinical question/patient data (text) and/or images (data URIs).
    *   **Output**: A structured summary of the input, formatted with markdown.
*   **`answerClinicalQuestion` Flow (`src/ai/flows/answer-clinical-question.ts`)**:
    *   **Purpose**: Provides detailed answers to clinical questions.
    *   **Functionality**: Analyzes the provided information (question and/or images) to deliver a comprehensive answer, step-by-step reasoning, and a concise topic title suitable for a presentation.
    *   **Input**: Clinical question (text) and/or images (data URIs).
    *   **Output**: A JSON object containing `answer` (detailed, markdown-formatted), `reasoning` (step-by-step, markdown-formatted), and `topic` (concise title).
*   **UI (`src/app/ai-diagnosis/page.tsx`)**:
    *   **Input Interface**: Textarea for patient history and file input for supporting documents (PDFs, JPGs, PNGs). Supports pasting images from the clipboard.
    *   **File Management**: Displays previews of uploaded images with the ability to remove individual files.
    *   **Loading Experience**: Utilizes skeleton loaders to provide visual feedback during AI processing.
    *   **Results Display**: Presents AI-generated diagnoses in `DiagnosisCard` components and the clinical answer with an expandable accordion for detailed reasoning.
    *   **User Controls**: "New Case" button to clear input and start fresh, and copy buttons for AI-generated text.
    *   **Data Persistence**: Integrates with Firebase to save and load cases, allowing users to revisit past diagnoses.

### 2. Content Generator
This feature enables users to generate detailed answers to clinical questions or create structured presentation outlines based on a medical topic.

**Key Components & Flows:**
*   **`generateSlideOutline` Flow (`src/ai/flows/generate-slide-outline.ts`)**:
    *   **Purpose**: Creates structured slide outlines for medical presentations.
    *   **Functionality**: Generates a technically rich and detailed outline based on a main topic, desired number of slides, and optionally, a clinical question, answer, and reasoning. It adheres to specific content guidelines based on presentation length (e.g., highly condensed for shorter presentations, traditional structure with conclusions for longer ones).
    *   **Input**: `topic`, `numberOfSlides`, and optional `question`, `answer`, `reasoning`.
    *   **Output**: A JSON array of `Slide` objects, each with a `title` and `content` (an array of structured items like paragraphs, bullet lists, numbered lists, notes, and tables).
*   **`modifySlides` Flow (`src/ai/flows/modify-slides.ts`)**:
    *   **Purpose**: Modifies existing slide decks using AI.
    *   **Functionality**: Supports three modification actions:
        *   `expand_content`: Generates more detailed content for selected topics, potentially adding new slides.
        *   `replace_content`: Generates alternative content for selected slides, maintaining the same topics and number of slides.
        *   `expand_selected`: Adds more in-depth technical explanations to the content of selected slides without changing titles or adding new slides.
    *   **Input**: Current `slides` array, `selectedIndices` for modification, and the `action` to perform.
    *   **Output**: The complete, updated array of slides in the same structured JSON format.
*   **UI (`src/app/content-generator/page.tsx`)**:
    *   **Mode Selection**: Tabs to switch between "Specific Clinical Question" and "General Medical Topic" input modes.
    *   **Input Interface**: Textarea for questions, file input for images (with preview and removal), and an input for medical topics.
    *   **AI Response Display**: Shows the AI-generated answer and reasoning, similar to the AI Diagnosis page.
    *   **Presentation Generation**: Allows users to specify the desired number of slides and trigger outline generation.
    *   **Slide Editor (`src/components/SlideEditor.tsx`)**:
        *   **Slide Management**: View, add, and remove individual slides.
        *   **Batch Operations**: Select multiple slides for AI-powered modifications.
        *   **AI Modification Actions**: Buttons to trigger `expand_content`, `replace_content`, and `expand_selected` actions.
        *   **Export Options**: Functionality to copy raw JSON content, and export the presentation to PDF or Word documents (integrates `jsPDF` and `docx` libraries).
    *   **Data Persistence**: Saves and loads content generation cases via Firebase.

### 3. History
This feature provides users with a centralized place to view and manage their past AI diagnosis and content generation cases.

**Key Components:**
*   **UI (`src/app/history/page.tsx`)**:
    *   **Authentication Check**: Ensures the user is logged in before displaying history.
    *   **Data Fetching**: Fetches real-time case data from Firebase Firestore, filtered by the current user's ID and ordered by creation date.
    *   **Case Display**: Renders each case using the `HistoryCard` component.
    *   **Loading/Empty States**: Provides visual feedback when loading data or if no cases are found.
*   **`HistoryCard` Component (`src/components/HistoryCard.tsx`)**:
    *   **Purpose**: Displays a summary of a single saved case.
    *   **Functionality**: Shows the case title, creation date, and type (Diagnosis or Content Generation). Includes a "View Case" button that navigates to the relevant page (`/ai-diagnosis` or `/content-generator`) with the `caseId` parameter to load the specific case.

### 4. Authentication
This feature manages user login, signup, and session persistence using Firebase Authentication.

**Key Components:**
*   **`LoginPage` (`src/app/login/page.tsx`)**:
    *   **User Interface**: Provides forms for email/password login and signup.
    *   **Google Sign-In**: Allows users to authenticate using their Google accounts.
    *   **Feedback**: Displays loading indicators and toast notifications for authentication status (success/failure).
    *   **Redirection**: Automatically redirects authenticated users to the application's homepage.
*   **`AuthContext` (`src/context/AuthContext.tsx`)**:
    *   **Authentication State Management**: Uses React Context to provide the current `user` object and `loading` status to all wrapped components.
    *   **Firebase Integration**: Listens to `onAuthStateChanged` events from Firebase to keep the authentication state synchronized.
    *   **Error Handling**: Displays a user-friendly message and instructions if Firebase environment variables are missing, preventing the application from running with an incomplete setup.
*   **`Header` Component (`src/components/Header.tsx`)**:
    *   **User Session Display**: Shows the user's avatar and email if logged in, or a "Login" button if not.
    *   **Logout Functionality**: Provides a logout option for authenticated users.

## Reusable UI Components

The application utilizes a set of reusable UI components, primarily built with `shadcn/ui`, to ensure consistency and accelerate development:

*   **`DiagnosisCard` (`src/components/DiagnosisCard.tsx`)**: Displays a single AI-generated diagnosis with confidence level, reasoning, and missing information.
*   **`Header` (`src/components/Header.tsx`)**: The main navigation bar, handling routing and user authentication display.
*   **`HistoryCard` (`src/components/HistoryCard.tsx`)**: Summarizes a user's past case, providing a link to view details.
*   **`QuestionDisplay` (`src/components/QuestionDisplay.tsx`)**: Renders the user's input question and associated images, with basic markdown formatting.
*   **`SlideEditor` (`src/components/SlideEditor.tsx`)**: A comprehensive editor for managing and modifying presentation slides, including export functionalities.

This detailed description covers the main features, AI flows, and key components of the MediGen application, outlining their functionalities and interconnections.
