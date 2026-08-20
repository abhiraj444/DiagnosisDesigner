'use server';

/**
 * @fileOverview An AI-powered diagnosis tool that provides provisional diagnoses based on patient data.
 *
 * - aiDiagnosis - A function that handles the diagnosis process.
 * - AiDiagnosisInput - The input type for the aiDiagnosis function.
 * - AiDiagnosisOutput - The return type for the aiDiagnosis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDiagnosisInputSchema = z.object({
  patientData: z.string().describe('The patient data, including symptoms, medical history, and other relevant information.').optional(),
  supportingDocuments: z.array(z.string()).optional().describe('Optional supporting documents in PDF or JPG format, encoded as data URIs.'),
}).superRefine((data, ctx) => {
    if (!data.patientData && (!data.supportingDocuments || data.supportingDocuments.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Either patient data or a supporting document must be provided.",
        });
    }
});
export type AiDiagnosisInput = z.infer<typeof AiDiagnosisInputSchema>;

const DiagnosisSchema = z.object({
  diagnosis: z.string().describe('The potential diagnosis.'),
  confidenceLevel: z.number().describe('The confidence level of the diagnosis (0-1).'),
  reasoning: z.string().describe('The reasoning behind the diagnosis, including details extracted from the patient data.'),
  missingInformation: z.object({
      information: z.array(z.string()).optional().describe('List of specific pieces of historical or symptomatic information that are missing.'),
      tests: z.array(z.string()).optional().describe('List of recommended next-step diagnostic tests (e.g., lab work, imaging).')
  }).optional().describe('An object containing lists of missing information and recommended tests.'),
});

const AiDiagnosisOutputSchema = z.array(DiagnosisSchema);
export type AiDiagnosisOutput = z.infer<typeof AiDiagnosisOutputSchema>;

export async function aiDiagnosis(input: AiDiagnosisInput): Promise<AiDiagnosisOutput> {
  return aiDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiDiagnosisPrompt',
  input: {schema: AiDiagnosisInputSchema},
  output: {schema: AiDiagnosisOutputSchema},
  prompt: `You are a highly skilled and experienced medical diagnostician. Your primary goal is to provide accurate and well-reasoned provisional diagnoses based on the patient data provided.

**Instructions for Diagnosis Process:**
1.  **Extract Key Information:** Carefully read through all the provided patient data (symptoms, history, examination findings, lab results, imaging, etc.). Identify and list all relevant positive findings, negative findings, and patient demographics that are pertinent to diagnosis.
2.  **Generate a Differential Diagnosis:** Based on the extracted key information, generate a comprehensive list of potential diagnoses. Consider common conditions first, then rarer but plausible ones.
3.  **Evaluate Each Potential Diagnosis (Step-by-Step Reasoning):**
    * For each diagnosis in your differential list, analyze how well it explains *all* the patient's symptoms and findings.
    * Explain the pathophysiological link between the diagnosis and the observed signs/symptoms.
    * Explicitly state why each piece of patient data supports or refutes this specific diagnosis.
    * Compare and contrast it with other potential diagnoses, noting why it might be more or less likely.
4.  **Assign Confidence Level:** Based on your thorough evaluation, assign a confidence level (0.0 to 1.0) to each diagnosis, reflecting how strongly the available data supports it.
5.  **Identify Missing Information & Next Steps:** For each diagnosis, categorize the crucial missing information and further diagnostic tests.
    *   **Information:** List specific historical or symptomatic details needed (e.g., 'Duration of fever', 'Family history of autoimmune disease').
    *   **Tests:** List specific diagnostic tests (e.g., 'ECG to check for ischemic changes', 'CBC for infection markers', 'Chest X-ray').

**Patient Data Provided:**
{{#if patientData}}
Patient Data:
{{{patientData}}}
{{/if}}

{{#if supportingDocuments}}
Supporting Documents:
{{#each supportingDocuments}}
{{media url=this}}
{{/each}}
{{/if}}

**Output Format:**
Return your diagnoses as a JSON array of Diagnosis objects.
Each Diagnosis object must strictly adhere to the following schema:
{
  "diagnosis": "The potential diagnosis (e.g., 'Acute Myocardial Infarction', 'Pneumonia', 'Migraine')",
  "confidenceLevel": "A number between 0.0 and 1.0 representing your confidence. (e.g., 0.85, 0.50, 0.92)",
  "reasoning": "A detailed explanation of why this diagnosis is considered, directly referencing patient data and explaining the alignment or misalignment with the findings. This should include the step-by-step reasoning outlined above.",
  "missingInformation": {
    "information": [
      "List of specific additional historical or symptomatic details required."
    ],
    "tests": [
      "List of specific diagnostic tests or procedures required."
    ]
  }
}

Ensure the JSON output is valid and can be directly parsed. Provide at least 2-3 provisional diagnoses, even if one is highly confident.
`,
});

const aiDiagnosisFlow = ai.defineFlow(
  {
    name: 'aiDiagnosisFlow',
    inputSchema: AiDiagnosisInputSchema,
    outputSchema: AiDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
