import { config } from 'dotenv';
config();

import '@/ai/flows/ai-diagnosis.ts';
import '@/ai/flows/generate-slide-outline.ts';
import '@/ai/flows/modify-slides.ts';
import '@/ai/flows/answer-clinical-question.ts';
import '@/ai/flows/summarize-question.ts';
