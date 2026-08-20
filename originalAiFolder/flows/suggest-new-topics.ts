'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestNewTopicsInputSchema = z.object({
  question: z.string().optional(),
  topic: z.string().optional(),
  existingTopics: z.array(z.string()),
});

const SuggestNewTopicsResponseSchema = z.object({
  topics: z.array(z.string()).describe('A list of new, technical medical topics.'),
});

const clinicalQuestionPrompt = ai.definePrompt({
  name: 'suggestNewTopicsPrompt',
  input: { schema: SuggestNewTopicsInputSchema },
  output: { schema: SuggestNewTopicsResponseSchema },
  prompt: `
    Based on the following clinical question, and excluding the existing topics, suggest a few new, highly technical medical topics for a presentation.

    Clinical Question: {{question}}
    Existing Topics: {{existingTopics}}

    Generate a JSON object with a single key "topics" containing an array of strings.
  `,
});

const generalTopicPrompt = ai.definePrompt({
  name: 'suggestNewTopicsForTopicPrompt',
  input: { schema: z.object({ topic: z.string(), existingTopics: z.array(z.string()) }) },
  output: { schema: SuggestNewTopicsResponseSchema },
  prompt: `
    You are an expert in medical education. Based on the following medical topic and the existing presentation outline, suggest a few new, advanced, and highly relevant sub-topics or related topics.
    These suggestions should be suitable for an audience of medical professionals (MBBS, PG, MD students in India) and should delve deeper into specific aspects of the main topic.

    Medical Topic: {{topic}}
    Existing Topics: {{existingTopics}}

    Generate a JSON object with a single key "topics" containing an array of new topic strings.
  `,
});

export const suggestNewTopicsFlow = ai.defineFlow(
  {
    name: 'suggestNewTopicsFlow',
    inputSchema: SuggestNewTopicsInputSchema,
    outputSchema: SuggestNewTopicsResponseSchema,
  },
  async (input) => {
    if (input.topic) {
      const { output } = await generalTopicPrompt({ topic: input.topic, existingTopics: input.existingTopics });
      return output!;
    } else {
      const { output } = await clinicalQuestionPrompt(input);
      return output!;
    }
  }
);