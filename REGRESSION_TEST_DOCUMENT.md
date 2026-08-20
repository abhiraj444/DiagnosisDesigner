
## 3. Reusable UI Components

#### Description
The application utilizes a set of reusable UI components, primarily built with `shadcn/ui` and `Radix UI`, to ensure consistency and accelerate development. These components are styled using Tailwind CSS and adhere to the defined design tokens.

#### Key Components & Test Cases

**3.1. `DiagnosisCard` (`src/components/DiagnosisCard.tsx`)**
*   **Description**: Displays a single AI-generated diagnosis with confidence level, reasoning, and missing information.
*   **Test Cases**:
    *   **Test Case 3.1.1: Display Diagnosis with All Fields**
        *   **Input**: A `Diagnosis` object containing `diagnosis`, `confidenceLevel`, `reasoning`, and `missingInformation`.
        *   **Expected Output**: All fields are correctly rendered and visible.
    *   **Test Case 3.1.2: Display Diagnosis with Missing Information (Optional Field)**
        *   **Input**: A `Diagnosis` object without `missingInformation`.
        *   **Expected Output**: The `missingInformation` section is not displayed.

**3.2. `Header` (`src/components/Header.tsx`)**
*   **Description**: The main navigation bar, handling routing, user authentication display, and theme toggling.
*   **Test Cases**:
    *   **Test Case 3.2.1: Header - Logged In State**
        *   **Input**: User is logged in.
        *   **Expected Output**: User's avatar/email is displayed. Logout option is available. Navigation links are present.
    *   **Test Case 3.2.2: Header - Logged Out State**
        *   **Input**: User is logged out.
        *   **Expected Output**: "Login" button is displayed. Navigation links are present.
    *   **Test Case 3.2.3: Theme Toggle Functionality**
        *   **Input**: Click the theme toggle button.
        *   **Expected Output**: Application theme switches between light and dark mode. `aria-label` is correctly set.
    *   **Test Case 3.2.4: Mobile Navigation Toggle**
        *   **Input**: View on mobile, click mobile navigation trigger.
        *   **Expected Output**: Mobile navigation menu opens/closes. `aria-label` is correctly set.

**3.3. `HistoryCard` (`src/components/HistoryCard.tsx`)**
*   **Description**: Summarizes a user's past case, providing a link to view details.
*   **Test Cases**:
    *   **Test Case 3.3.1: Display History Card - Diagnosis Type**
        *   **Input**: A history case of type "Diagnosis".
        *   **Expected Output**: Card displays correct title, date, and "Diagnosis" type. "View Case" button navigates to `/ai-diagnosis` with `caseId`.
    *   **Test Case 3.3.2: Display History Card - Content Generation Type**
        *   **Input**: A history case of type "Content Generation".
        *   **Expected Output**: Card displays correct title, date, and "Content Generation" type. "View Case" button navigates to `/content-generator` with `caseId`.

**3.4. `QuestionDisplay` (`src/components/QuestionDisplay.tsx`)**
*   **Description**: Renders the user's input question and associated images, with basic markdown formatting.
*   **Test Cases**:
    *   **Test Case 3.4.1: Display Text Question**
        *   **Input**: Text-only question with markdown.
        *   **Expected Output**: Question text is rendered with correct markdown formatting.
    *   **Test Case 3.4.2: Display Question with Image**
        *   **Input**: Question text and an image (data URI).
        *   **Expected Output**: Question text is rendered, and the image is displayed.

**3.5. `SlideEditor` (`src/components/SlideEditor.tsx`)**
*   **Description**: A comprehensive editor for managing and modifying presentation slides, including export functionalities. (Detailed test cases are covered in Section 2.2. Content Generator).
*   **Test Cases**: Refer to Section 2.2. Content Generator for detailed test cases related to slide management, modification, and export functionalities.

## 4. Design System & Accessibility

#### Description
The application adheres to a consistent design system defined by centralized design tokens for colors, typography, spacing, and shadows. Accessibility improvements have been implemented to ensure a better user experience for all.

#### Key Aspects & Test Cases

**4.1. Design Tokens (`src/lib/design-tokens.ts`, `src/app/globals.css`, `tailwind.config.ts`)**
*   **Description**: Centralized definitions for colors (HSL values for light/dark modes), typography (Inter font), spacing (4px grid), border-radius, and shadows.
*   **Test Cases**:
    *   **Test Case 4.1.1: Color Palette Application (Light Mode)**
        *   **Input**: Application in light mode.
        *   **Expected Output**: UI elements (background, foreground, primary, secondary, etc.) match the defined HSL values for light mode.
    *   **Test Case 4.1.2: Color Palette Application (Dark Mode)**
        *   **Input**: Application in dark mode.
        *   **Expected Output**: UI elements match the defined HSL values for dark mode.
    *   **Test Case 4.1.3: Typography Consistency**
        *   **Input**: Various text elements across the application.
        *   **Expected Output**: All text uses the 'Inter' font or a sans-serif fallback.
    *   **Test Case 4.1.4: Spacing Consistency**
        *   **Input**: Various UI elements with defined spacing.
        *   **Expected Output**: Spacing between elements adheres to the 4px grid scale.

**4.2. Accessibility Improvements**
*   **Description**: Focus on keyboard navigation, screen reader support, and contrast ratios.
*   **Test Cases**:
    *   **Test Case 4.2.1: Keyboard Navigation**
        *   **Input**: Navigate through the application using only the keyboard (Tab, Shift+Tab, Enter, Spacebar).
        *   **Expected Output**: All interactive elements are reachable and operable via keyboard. Focus states are clearly visible.
    *   **Test Case 4.2.2: Screen Reader Compatibility**
        *   **Input**: Use a screen reader (e.g., NVDA, JAWS, VoiceOver) to interact with the application.
        *   **Expected Output**: All interactive elements and important content are correctly announced. `aria-label` attributes are effective.
    *   **Test Case 4.2.3: Color Contrast (Automated Check)**
        *   **Input**: Run an automated accessibility checker (e.g., Lighthouse, browser dev tools).
        *   **Expected Output**: All text-background combinations meet WCAG AA accessibility standards.

## 5. Project Structure Highlights

#### Description
This section outlines the key directories and files within the project, providing an understanding of the overall architecture.

*   `src/app/`: Contains Next.js pages and API routes.
    *   `src/app/ai-diagnosis/page.tsx`: Main page for submitting cases and viewing AI diagnosis results.
    *   `src/app/content-generator/page.tsx`: Main page for generating and managing presentation content.
    *   `src/app/history/page.tsx`: Displays a history of user submissions and diagnoses.
    *   `src/app/login/page.tsx`: User authentication interface.
    *   `src/app/api/`: Contains API routes for various functionalities, including Genkit AI interactions.
*   `src/ai/`: Contains Genkit-related configurations and AI flows.
    *   `genkit.config.ts`: Genkit configuration, enabling Google AI and Next.js integration.
    *   `src/ai/flows/`: Directory containing specific AI flows (e.g., `ai-diagnosis.ts`, `answer-clinical-question.ts`, `summarize-question.ts`, `generate-presentation-outline.ts`, `generate-slide-content.ts`, `modify-slides.ts`).
*   `src/components/`: Reusable React components (e.g., `DiagnosisCard.tsx`, `Header.tsx`, `HistoryCard.tsx`, `QuestionDisplay.tsx`, `SlideEditor.tsx`).
*   `src/context/`: React Context providers for global state management (e.g., `AuthContext.tsx`, `ThemeContext.tsx`).
*   `src/hooks/`: Custom React hooks (e.g., `useAuth.ts`).
*   `src/lib/`: Utility functions and configurations.
    *   `src/lib/firebase.ts`: Firebase initialization and configuration.
    *   `src/lib/design-tokens.ts`: Centralized design system definitions.
    *   `src/lib/utils.ts`: General utility functions.
    *   `src/lib/pdf-fonts/`: Custom fonts for PDF generation.
*   `src/types/`: TypeScript type definitions and schemas.

## 6. Build and Deployment

#### Build Commands
*   `npm run dev`: Starts the development server with Turbopack on port 9002.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with watch mode.
*   `npm run build`: Builds the Next.js application for production.
*   `npm run start`: Starts the production Next.js server.

#### Linting and Type Checking
*   `npm run lint`: Runs ESLint for code linting.
*   `npm run typecheck`: Runs TypeScript compiler for type checking.

#### Deployment Considerations
*   The application is a Next.js application, suitable for deployment on platforms like Vercel, Netlify, or self-hosted Node.js environments.
*   Firebase integration requires proper environment variable configuration for API keys and project IDs.
*   Genkit AI flows run on the server-side, requiring a Node.js environment.

## 7. Known Issues and Future Enhancements

#### Known Issues (from `next.config.ts`)
*   `ignoreBuildErrors: true` for TypeScript: This means TypeScript errors are ignored during the build process, which can lead to runtime issues. This should be addressed in future development.
*   `ignoreDuringBuilds: true` for ESLint: ESLint warnings/errors are ignored during builds, potentially leading to code quality issues.

#### Future Enhancements (Inferred from `FEATURE_IMPLEMENTATION_PLAN.md`)
*   **Enhanced Content Generation Workflow**: The `FEATURE_IMPLEMENTATION_PLAN.md` details a two-step process for content generation (outline first, then selective content creation) and enhanced `SlideEditor` functionalities (Add Section, Reorder Slides). These are planned features that should be verified upon implementation.

