'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PresentationOutlineInputSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
  reasoning: z.string().optional(),
  topic: z.string().optional(),
});

const PresentationOutlineOutputSchema = z.object({
  outline: z.array(z.string()).describe('A list of topics and sub-topics for the presentation.'),
});

export async function generatePresentationOutline(input: z.infer<typeof PresentationOutlineInputSchema>): Promise<z.infer<typeof PresentationOutlineOutputSchema>> {
  return generatePresentationOutlineFlow(input);
}

const clinicalQuestionPrompt = ai.definePrompt({
  name: 'generatePresentationOutlinePrompt',
  input: { schema: PresentationOutlineInputSchema },
  output: { schema: PresentationOutlineOutputSchema },
  prompt: `
    You are an expert medical educator creating a presentation outline based on a specific clinical case.
    **Audience:** Postgraduate medical students (MD/MS, PhD) and specialists.
    **Task:** Generate a presentation outline of 10-12 topics based on the clinical case provided.

    **Constraint Checklist & Output Format:**
    1.  **JSON Output:** The output MUST be a valid JSON object with a single key "outline" containing an array of strings (the topics).
    2.  **First Topic:** The VERY FIRST topic in the outline MUST be "Clinical Case Summary and Key Questions".
    3.  **Advanced Content:** The subsequent 10-11 topics must be advanced and directly relevant to the case, covering aspects like differential diagnosis, advanced diagnostics, detailed management protocols, landmark trials, recent guidelines, and **at least 2 distinct case studies or clinical scenarios**.
    4.  **Strict Topic Limit:** The total number of topics should be between 10 and 12.

    **Clinical Case Details:**
    - **Question:** {{question}}
    - **Answer:** {{answer}}
    - **Reasoning:** {{reasoning}}

    Generate the outline now, adhering strictly to all constraints.
  `,
});

const generalTopicPrompt = ai.definePrompt({
  name: 'generalTopicOutlinePrompt',
  input: { schema: z.object({ topic: z.string() }) },
  output: { schema: PresentationOutlineOutputSchema },
  prompt: `
    You are an expert medical educator. Your task is to generate a concise and high-yield presentation outline for the medical topic: **{{topic}}**.

    **Audience:** Postgraduate medical students (MD/MS), DNB candidates, and advanced MBBS interns in India.

    **Constraints & Output Format:**
    1.  **Strict 15 Topics Limit:** Provide exactly 15 slide titles in total.
    2.  **JSON Output Only:** Output a valid JSON object with a single key "outline" whose value is an array of 15 strings.
    3.  **Content Distribution:**
        - First **4-5 slides**: Intermediate foundational understanding (but not basic undergraduate).
        - Remaining **10-11 slides**: Advanced clinical, diagnostic, and management-oriented insights suitable for PG-level viva or presentations, including more than 2case studies.
    4.  **Topic Variety & Depth:**
        - Ensure logical progression: from concept -> mechanism -> clinical application -> research/updates.
        - Include diagnostic criteria, classification systems, relevant investigations, treatment modalities, and complications.
        - Where relevant, include recent guidelines, landmark trials, or Indian-specific practice patterns.
    5.  **Avoid:** Vague headers like "Introduction" or "Definition".

    Generate the outline for **{{topic}}** now, adhering strictly to all constraints.
  `,
});

const generatePresentationOutlineFlow = ai.defineFlow(
  {
    name: 'generatePresentationOutlineFlow',
    inputSchema: PresentationOutlineInputSchema,
    outputSchema: PresentationOutlineOutputSchema,
  },
  async (input) => {
    if (input.topic) {
      const { output } = await generalTopicPrompt({ topic: input.topic });
      return output!;
    } else {
      const { output } = await clinicalQuestionPrompt(input);
      return output!;
    }
  }
);