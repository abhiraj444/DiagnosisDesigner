

'use server';

/**
 * @fileOverview Answers a clinical question based on text and/or image input.
 *
 * - answerClinicalQuestion - A function that provides an answer and reasoning.
 * - AnswerClinicalQuestionInput - The input type for the function.
 * - AnswerClinicalQuestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerClinicalQuestionInputSchema = z.object({
  question: z.string().optional().describe('The clinical question being asked by the user.'),
  images: z.array(z.string()).optional().describe("A list of images related to the clinical question, as data URIs that must include a MIME type and use Base64 encoding."),
}).superRefine((data, ctx) => {
    if (!data.question && (!data.images || data.images.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Either a question or an image must be provided.",
        });
    }
});
export type AnswerClinicalQuestionInput = z.infer<typeof AnswerClinicalQuestionInputSchema>;

const AnswerClinicalQuestionOutputSchema = z.object({
  answer: z.string().describe('A detailed answer to the clinical question. This should be formatted with markdown, including bold text for emphasis.'),
  reasoning: z.string().describe('The step-by-step reasoning for arriving at the answer. This should also be formatted with markdown.'),
  topic: z.string().describe('A concise, presentation-friendly title summarizing the main topic of the question (e.g., "Management of Acute Myocardial Infarction").'),
});
export type AnswerClinicalQuestionOutput = z.infer<typeof AnswerClinicalQuestionOutputSchema>;


export async function answerClinicalQuestion(input: AnswerClinicalQuestionInput): Promise<AnswerClinicalQuestionOutput> {
  return answerClinicalQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerClinicalQuestionPrompt',
  input: {schema: AnswerClinicalQuestionInputSchema},
  output: {schema: AnswerClinicalQuestionOutputSchema},
  prompt: `You are a world-class medical expert AI. Your task is to analyze a clinical question and/or medical images and provide a comprehensive answer, your reasoning, and a topic for a presentation.

  Analyze the following information:
  {{#if question}}
  Question: {{{question}}}
  {{/if}}
  {{#if images}}
  Images:
  {{#each images}}
  {{media url=this}}
  {{/each}}
  {{/if}}

  Based on your analysis, provide the following in JSON format:
  1.  "answer": A detailed, clear, and concise answer to the user's question. The first line must be the direct answer.
      - **If the question includes options** (e.g., O1, O2, A, B), identify the correct option. Then, state the answer clearly, using a simple number for the option. For example, if the correct option was originally "O4: Spironolactone", your answer must begin with "The correct answer is 4: Spironolactone.".
      - **If there are no options**, the first line should be a single, concise sentence answering the question.
      - After the direct answer, provide a more detailed explanation that elaborates on it. Use markdown for formatting, such as **bolding** key terms. **Do not use markdown tables; use paragraphs and lists instead.**
  2.  "reasoning": A step-by-step explanation of how you arrived at the answer. Highlight the key findings from the provided text or image. Use markdown for formatting. **Do not use markdown tables; use paragraphs and lists instead.**
  3.  "topic": A short, clear topic title suitable for a presentation based on the question. For example, if the question is about treating a specific condition, the topic could be "Treatment of [Condition]".
`,
});

const answerClinicalQuestionFlow = ai.defineFlow(
  {
    name: 'answerClinicalQuestionFlow',
    inputSchema: AnswerClinicalQuestionInputSchema,
    outputSchema: AnswerClinicalQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
