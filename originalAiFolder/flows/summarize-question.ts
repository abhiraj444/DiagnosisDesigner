

'use server';

/**
 * @fileOverview Summarizes and structures a clinical question from text and/or images.
 *
 * - summarizeQuestion - A function that provides a structured summary.
 * - SummarizeQuestionInput - The input type for the function.
 * - SummarizeQuestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeQuestionInputSchema = z.object({
  question: z.string().optional().describe('The clinical question or patient data text.'),
  images: z.array(z.string()).optional().describe("A list of images related to the clinical question, as data URIs."),
}).superRefine((data, ctx) => {
    if (!data.question && (!data.images || data.images.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Either a question or an image must be provided.",
        });
    }
});
export type SummarizeQuestionInput = z.infer<typeof SummarizeQuestionInputSchema>;

const SummarizeQuestionOutputSchema = z.object({
  summary: z.string().describe('A well-structured, eye-pleasing summary of the provided question and/or images. This should be formatted with markdown, including bold text for emphasis on key terms.'),
});
export type SummarizeQuestionOutput = z.infer<typeof SummarizeQuestionOutputSchema>;


export async function summarizeQuestion(input: SummarizeQuestionInput): Promise<SummarizeQuestionOutput> {
  return summarizeQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeQuestionPrompt',
  input: {schema: SummarizeQuestionInputSchema},
  output: {schema: SummarizeQuestionOutputSchema},
  prompt: `You are an AI assistant that structures user input for display. Your primary task is to extract the clinical question from the user's input (text and/or images) and present it clearly.

**Formatting Rules:**
1.  **Extract Core Question:** Your main goal is to identify and extract the medical question or clinical case description. If the input is an image (like a screenshot), you MUST ignore any non-medical content such as phone UI elements (status bars, buttons, menus), document titles (like "ASSIGNMENT 10"), or other irrelevant text. Focus solely on the clinical text.
2.  **Preserve Original Wording:** For the extracted medical text, do NOT rephrase or change the original wording. Your job is primarily structural formatting of the *relevant* text.
3.  **Reformat Options:** If the extracted text contains a multiple-choice question with options formatted like "O1:", "O2:", "A)", "B)", etc., you MUST reformat these into a clean, numbered list. Start the list with a phrase like "The provided options are:". For example, if the input is "What is the diagnosis? O1: X O2: Y", the output should be "What is the diagnosis?\\n\\nThe provided options are:\\n1: X\\n2: Y".
4.  **Combine Text and Image Info**: If both text and images are provided, treat the text as the primary source and use the images to supplement it. Extract any clinical text from the images and integrate it logically with the user-provided text.
5.  **No Analysis or Extra Content:** Do not add any analysis, interpretation, or descriptions of the image itself (e.g., "This is a screenshot of a mobile phone"). Just present the extracted clinical question.

**User Input:**
{{#if question}}
Text: {{{question}}}
{{/if}}
{{#if images}}
Images:
{{#each images}}
{{media url=this}}
{{/each}}
{{/if}}

Provide your response in the required JSON format.
`,
});

const summarizeQuestionFlow = ai.defineFlow(
  {
    name: 'summarizeQuestionFlow',
    inputSchema: SummarizeQuestionInputSchema,
    outputSchema: SummarizeQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
