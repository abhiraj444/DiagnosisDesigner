'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SlideSchema } from '@/types/schemas';

const GenerateSingleSlideInputSchema = z.object({
  topic: z.string().describe('The topic for the new slide.'),
});

const GenerateSingleSlideOutputSchema = SlideSchema;

const prompt = ai.definePrompt({
  name: 'generateSingleSlidePrompt',
  input: { schema: GenerateSingleSlideInputSchema },
  output: { schema: GenerateSingleSlideOutputSchema },
  prompt: `
    You are an expert in medical education. Your task is to generate the content for a single presentation slide based on the provided topic.

    **Topic:** {{{topic}}}

    **Instructions:**
    1.  The slide's "title" must be the exact topic provided above.
    2.  The "content" should be technically rich, detailed, and suitable for a professional medical audience.
    3.  Break down the topic into multiple small, distinct points. Use bullet lists, numbered lists, or tables extensively. Avoid long paragraphs.
    4.  Format the entire output as a single JSON object that conforms to the slide schema, having a "title" and a "content" array.
    5.  Do NOT include a "Conclusion" or "Summary" slide. The presentation should end on a technical note.

    **Content Schema:**
    -   \`{"type": "paragraph", "text": "...", "bold": ["...", "..."]}\`
    -   \`{"type": "bullet_list", "items": [{"text": "...", "bold": ["..."]}, ...]}\`
    -   \`{"type": "numbered_list", "items": [{"text": "...", "bold": ["..."]}, ...]}\`
    -   \`{"type": "note", "text": "..."}\`
    -   \`{"type": "table", "headers": ["...", "..."], "rows": [{"cells": ["...", "..."]}, ...]}\`

    Produce the JSON object and nothing else.
  `,
});

export const generateSingleSlideFlow = ai.defineFlow(
  {
    name: 'generateSingleSlideFlow',
    inputSchema: GenerateSingleSlideInputSchema,
    outputSchema: GenerateSingleSlideOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
