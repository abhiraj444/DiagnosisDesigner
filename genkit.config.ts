import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { next } from '@genkit-ai/next';

export default configureGenkit({
  plugins: [googleAI(), next()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
