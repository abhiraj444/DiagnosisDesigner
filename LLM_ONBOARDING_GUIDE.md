# LLM Onboarding Guide: MediGen Project

This guide provides a concise roadmap for an AI agent (LLM) or a new developer to quickly understand the MediGen project's structure, core functionalities, and key areas of the codebase. The goal is to enable rapid onboarding and effective contribution.

## 1. Start with the Comprehensive Overview

Begin by thoroughly reviewing the `FULL_PROJECT_OVERVIEW.md` document. This file contains a detailed breakdown of the project's purpose, high-level architecture, core functionalities, technology stack, and more. It is designed to be your primary source of truth for initial understanding.

**File to read**: `FULL_PROJECT_OVERVIEW.md`

## 2. Key Files and Directories for Codebase Structure

Once you have a high-level understanding, dive into these specific files and directories to grasp the project's implementation details:

*   **`package.json`**: Examine this file to understand project dependencies, available scripts (e.g., `dev`, `build`, `lint`, `typecheck`, `genkit:dev`), and the overall project type (Next.js, TypeScript).

*   **`next.config.ts`**: Review this for Next.js specific configurations, such as server external packages, image optimization domains, and build settings.

*   **`tailwind.config.ts`**: Understand the project's styling configuration, including custom colors, fonts, and how Tailwind CSS is set up.

*   **`src/app/` (Directory)**: This is where Next.js pages and API routes are defined. Explore its subdirectories to identify the main application pages (`ai-diagnosis`, `content-generator`, `history`, `login`) and the backend API endpoints (`api/`).

*   **`src/ai/flows/` (Directory)**: This is crucial for understanding the AI capabilities. Each `.ts` file here defines a specific AI flow (e.g., `ai-diagnosis.ts`, `generate-slide-content.ts`, `suggest-new-topics.ts`). Read these files to see how AI models are prompted and what their inputs/outputs are.

*   **`src/components/` (Directory)**: Look into this directory to understand the reusable UI components. Pay attention to `SlideEditor.tsx` (complex content manipulation), `DiagnosisCard.tsx`, `HistoryCard.tsx`, and `Header.tsx`.

*   **`src/lib/` (Directory)**: This directory contains utility functions and integrations:
    *   `firebase.ts`: Understand how Firebase is initialized and used for authentication, Firestore, and Cloud Storage.
    *   `design-tokens.ts`: See the centralized definitions for the project's design system (colors, spacing, etc.).
    *   `utils.ts`: General utility functions.

*   **`src/types/` (Directory)**: Review `index.ts` and `schemas.ts` to understand the core data structures, TypeScript interfaces, and Zod schemas used throughout the application, especially for AI flow inputs/outputs and Firebase data.

## 3. Recommended Tools for Exploration

When exploring the codebase, utilize the following tools:

*   `list_directory(path)`: To list contents of directories.
*   `read_file(absolute_path)`: To read the content of specific files.
*   `read_many_files(paths)`: To read multiple files at once for comparative analysis.
*   `search_file_content(pattern, include, path)`: To find specific code patterns or text within files.
*   `glob(pattern)`: To find files matching specific patterns across the project.

## 4. General Workflow Suggestion

When assigned a task (bug fix or feature addition):

1.  **Understand the Request**: Clearly define the problem or feature.
2.  **Consult Documentation**: Refer to `FULL_PROJECT_OVERVIEW.md` for high-level context.
3.  **Identify Relevant Code**: Use the file structure knowledge and search tools (`search_file_content`, `glob`) to pinpoint the specific files and functions involved.
4.  **Deep Dive into Code**: Use `read_file` to understand the logic of the identified files.
5.  **Formulate a Plan**: Based on your understanding, devise a step-by-step plan for the fix or feature.
6.  **Implement and Verify**: Apply changes and use project scripts (`npm run lint`, `npm run typecheck`, `npm run dev`) for local verification. If applicable, consider writing or modifying tests.

By following this guide, any LLM or new developer should be able to quickly gain the necessary context to contribute effectively to the MediGen project.