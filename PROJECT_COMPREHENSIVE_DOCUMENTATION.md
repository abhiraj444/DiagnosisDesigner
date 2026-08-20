## 10. Known Issues and Limitations

This section outlines current known issues, technical debt, or limitations within the project.

*   **Ignored Build Errors (TypeScript & ESLint)**:
    *   `next.config.ts` is configured to `ignoreBuildErrors: true` for TypeScript and `ignoreDuringBuilds: true` for ESLint. This means that TypeScript type errors and ESLint warnings/errors are not enforced during the build process. This can lead to:
        *   **Runtime Bugs**: Type errors that should have been caught at compile time may manifest as runtime issues.
        *   **Code Quality Degradation**: Inconsistent code style and potential anti-patterns may go unnoticed.
    *   **Recommendation**: For a robust production application, these settings should be removed, and all build errors/linting issues should be resolved.

*   **PDF/DOCX Font Support**: While custom fonts (Noto Sans) are registered for PDF generation, ensuring consistent rendering across all environments can be challenging. Complex text layouts or unsupported characters might not render perfectly.

*   **AI Model Limitations**: The quality and accuracy of AI-generated content are dependent on the underlying LLM (Google Gemini) and the prompts used. There might be instances of:
    *   **Hallucinations**: AI generating factually incorrect or nonsensical information.
    *   **Bias**: AI reflecting biases present in its training data.
    *   **Context Window Limitations**: For very long inputs or complex requests, the AI's ability to maintain context might be limited.

*   **Client-Side Document Generation**: While beneficial for privacy and server load, client-side generation can be resource-intensive for very large documents, potentially impacting browser performance on less powerful devices.

## 11. Future Enhancements and Roadmap

Based on existing documentation and common application development patterns, the following are potential areas for future enhancement:

*   **Enhanced Content Generation Workflow (Partially Implemented/Planned)**:
    *   **Two-Step Generation**: Fully implement and refine the workflow where users first generate an outline, then selectively generate slides from it.
    *   **Advanced Slide Editing**: More granular control over slide content, including rich text editing within the `SlideEditor`.
    *   **Collaborative Features**: Allow multiple users to work on the same case or presentation.

*   **Improved AI Capabilities**:
    *   **Fine-tuning**: Explore fine-tuning AI models with domain-specific medical data for more accurate and relevant responses.
    *   **Multi-modal Input/Output**: Deeper integration of image and potentially video analysis for diagnosis and content generation.
    *   **Source Citation**: Implement a mechanism for the AI to cite its sources for generated information, enhancing trustworthiness.

*   **User Management & Personalization**:
    *   **User Profiles**: More detailed user profiles and preferences.
    *   **Customizable Templates**: Allow users to create and save their own presentation templates.

*   **Reporting and Analytics**:
    *   Generate comprehensive reports for diagnosis cases or presentation content.
    *   User analytics to understand feature usage and identify areas for improvement.

*   **Offline Mode**: Enable basic functionality or content viewing when offline.

*   **Testing Suite Expansion**: Implement comprehensive unit, integration, and end-to-end tests to ensure application stability and prevent regressions.

## 12. Key Concepts / Glossary

*   **AI Flow**: A defined sequence of operations within Genkit that orchestrates interactions with AI models to perform a specific task (e.g., `ai-diagnosis`, `generate-slide-content`).
*   **Genkit**: An open-source framework by Google for building AI-powered applications, used here to manage AI model interactions.
*   **LLM (Large Language Model)**: A type of artificial intelligence model trained on vast amounts of text data, capable of understanding and generating human-like text (e.g., Google Gemini).
*   **Firebase**: Google's platform for developing mobile and web applications, providing services like authentication, database (Firestore), and storage.
*   **Firestore**: A NoSQL cloud database from Firebase, used for storing structured application data.
*   **Shadcn UI**: A collection of re-usable UI components built using Radix UI and Tailwind CSS, providing a consistent design system.
*   **Radix UI**: A set of unstyled, accessible UI components that provide a solid foundation for building design systems.
*   **Tailwind CSS**: A utility-first CSS framework that allows for rapid UI development by composing small, single-purpose CSS classes.
*   **SSR (Server-Side Rendering)**: A Next.js feature where web pages are rendered on the server before being sent to the client, improving initial load performance and SEO.
*   **Data URI**: A scheme that allows small files to be embedded directly within HTML or CSS documents as a string of characters, often used for images.
*   **Regression Testing**: A type of software testing to confirm that a recent program or code change has not adversely affected existing features.