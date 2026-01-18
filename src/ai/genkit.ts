
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ CRITICAL: No Google GenAI API Key found in environment variables!");
} else {
  console.log("✅ Genkit: Google GenAI API Key found (starts with: " + apiKey.substring(0, 4) + "***)");
}

// Safely initialize Genkit. If no API key, we still init but it might fail at runtime (which we catch).
// We specifically avoid throwing here to prevent "Module not found" or Import errors in the Next.js server component.
export const ai = genkit({
  plugins: [googleAI({ apiKey: apiKey || 'dummy-key-to-prevent-init-crash' })],
  model: googleAI.model('gemini-2.5-flash-lite'),
});
