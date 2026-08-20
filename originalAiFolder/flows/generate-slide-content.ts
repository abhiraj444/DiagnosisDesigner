'use server';

/**
 * @fileOverview Generates a slide outline from a given educational topic in a structured JSON format.
 *
 * - generateSlideOutline - A function that generates a slide outline.
 * - GenerateSlideOutlineInput - The input type for the generateSlideOutline function.
 * - GenerateSlideOutlineOutput - The return type for the generateSlideOutline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Slide } from '@/types';

const GenerateSlideContentInputSchema = z.object({
  topic: z.string().describe('The main topic for the presentation.'),
  question: z.string().optional().describe("The AI's direct answer to the question."),
  answer: z.string().optional().describe("The AI's detailed reasoning for the answer."),
  reasoning: z.string().optional().describe("The AI's detailed reasoning for the answer."),
  selectedTopics: z.array(z.string()).describe('The topics selected by the user for slide generation.'),
  fullQuestion: z.string().optional().describe('The full original question from the user.'),
  fullAnswer: z.string().optional().describe('The full original answer from the AI.'),
  fullReasoning: z.string().optional().describe('The full original reasoning from the AI.'),
});
export type GenerateSlideContentInput = z.infer<typeof GenerateSlideContentInputSchema>;

// Schemas for structured content
const ParagraphSchema = z.object({
  type: z.enum(['paragraph']),
  text: z.string().describe('A paragraph of text.'),
  bold: z.array(z.string()).optional().describe('An array of substrings from the text to be bolded.'),
});

const ListItemSchema = z.object({
  text: z.string().describe('The text for a single list item.'),
  bold: z.array(z.string()).optional().describe('An array of substrings from the text to be bolded.'),
});

const BulletListSchema = z.object({
  type: z.enum(['bullet_list']),
  items: z.array(ListItemSchema).describe('An array of bullet point objects.'),
});

const NumberedListSchema = z.object({
  type: z.enum(['numbered_list']),
  items: z.array(ListItemSchema).describe('An array of numbered list item objects.'),
});

const NoteSchema = z.object({
  type: z.enum(['note']),
  text: z.string().describe('A short note or annotation.'),
});

const TableRowSchema = z.object({
  cells: z.array(z.string()).describe('An array of strings representing the cells in this row.'),
});

const TableSchema = z.object({
  type: z.enum(['table']),
  headers: z.array(z.string()).describe('An array of strings for the table headers.'),
  rows: z.array(TableRowSchema).describe('An array of row objects, where each object contains the cells for a table row.'),
});

const ContentItemSchema = z.union([
  ParagraphSchema,
  BulletListSchema,
  NumberedListSchema,
  NoteSchema,
  TableSchema,
]);

const SlideSchema = z.object({
  title: z.string().describe('The title for a single slide.'),
  content: z.array(ContentItemSchema).describe('An array of content items for the slide body.'),
});

const GenerateSlideContentOutputSchema = z.array(SlideSchema);
export type GenerateSlideContentOutput = z.infer<typeof GenerateSlideContentOutputSchema>;

export async function generateSlideContent(input: GenerateSlideContentInput): Promise<GenerateSlideContentOutput> {
  const result = await generateSlideContentFlow(input) as Slide[];
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateSlideContentPrompt',
  input: {schema: GenerateSlideContentInputSchema},
  output: {schema: GenerateSlideContentOutputSchema},
  prompt: `You are an expert in medical education. Your task is to generate detailed slide content for a presentation based on a provided list of topics.

**Source Information:**
- **Main Topic:** {{{topic}}}
{{#if fullQuestion}}
- **Full Original Question:** {{{fullQuestion}}}
{{/if}}
{{#if fullAnswer}}
- **Full Original Answer:** {{{fullAnswer}}}
{{/if}}
{{#if fullReasoning}}
- **Full Original Reasoning:** {{{fullReasoning}}}
{{/if}}

**Topics for Slide Generation:**
{{#each selectedTopics}}
- {{{this}}}
{{/each}}

**Core Instructions:**

1.  **Generate one slide for EACH topic listed in "Topics for Slide Generation".** The output must be a JSON array containing exactly one slide object per topic.
2.  **Handle the "Clinical Question, Answer, and Analysis Summary" topic:**
    *   If this specific topic is in the list, the corresponding slide MUST be titled "Case Presentation".
    *   The content for this slide MUST be generated using the "Full Original Question," "Full Original Answer," and a summary of the "Full Original Reasoning" provided above. Do not use any other information for this slide.
3.  **For all other topics:**
    *   Generate technically rich, detailed, and condensed content suitable for a professional medical audience.
    *   Fill each slide with substantial information. Use tables frequently to compare/contrast concepts or summarize data.
    *   Do **NOT** include a "Conclusion" or "Summary" slide unless it is explicitly requested as a topic.

**Formatting & Table Rules:**
Format the entire output as a JSON array of slide objects. Each slide object must conform to the following rules:
1.  **Slide Object**: Each slide is an object with a "title" (string) and a "content" (array of content items). The title must exactly match the topic from the input list, except for the special "Case Presentation" title.
2.  **Content Breakdown**: Deconstruct complex topics into multiple small, distinct points. Use 'bullet_list' or 'numbered_list' extensively. Each item in a list should be concise. Avoid long paragraphs; use lists to convey information concisely. For each slide, aim for a maximum of 6-8 distinct points (bullets, list items, or table rows) to ensure clarity and readability.
3.  **Content Array**: The "content" array contains different types of content objects. Do NOT put too much content on a single slide; create more slides if a topic is complex. Each content item must be an object with a "type" field.
4.  **Bolding**: For "paragraph" and list "items", use the 'bold' array to specify substrings of the 'text' that should be bolded. **Do NOT use markdown like '**text**' inside any text fields.**
5.  **Table Rules (CRITICAL):**
    *   When creating a "table" content item, the number of items in each 'cells' array inside 'rows' MUST be exactly equal to the number of items in the 'headers' array.
    *   Before outputting the JSON, you MUST validate every table. If a row has a different number of cells than the header, you MUST correct it. **This is a strict requirement; failure to comply will result in an error.**

Supported "type" values for content items:
- **"paragraph"**: For a block of text. This should be used sparingly.
  - "text": The full paragraph string.
  - "bold": (Optional) An array of substrings from "text" that should be formatted as bold.
- **"bullet_list"**: For an unordered list.
  - "items": An array of list item objects. Each object must have a "text" field and can have an optional "bold" array.
- **"numbered_list"**: For an ordered list.
  - "items": An array of list item objects. Each object must have a "text" field and can have an optional "bold" array.
- **"note"**: For a brief, supplementary note.
  - "text": The content of the note.
- **"table"**: For tabular data.
  - "headers": An array of strings for the table column headers.
  - "rows": An array of row objects. Each object has a "cells" property, which is an array of strings for that row.

Example:
[
  {
    "title": "Introduction to Condition X",
    "content": [
      { "type": "paragraph", "text": "Condition X is a chronic inflammatory disease affecting the joints.", "bold": ["Condition X", "chronic inflammatory disease"] },
      { "type": "bullet_list", "items": [ { "text": "Symptom A" }, { "text": "Symptom B is more complex.", "bold": ["Symptom B"] } ] }
    ]
  },
  {
    "title": "Diagnostic Criteria",
    "content": [
       { "type": "table", "headers": ["Criteria", "Description"], "rows": [{ "cells": ["Criteria 1", "Details for 1"] }, { "cells": ["Criteria 2", "Details for 2"] }] }
    ]
  }
]
`,
});

const generateSlideContentFlow = ai.defineFlow(
  {
    name: 'generateSlideContentFlow',
    inputSchema: GenerateSlideContentInputSchema,
    outputSchema: GenerateSlideContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
