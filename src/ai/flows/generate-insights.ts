
'use server';

/**
 * @fileOverview AI agent for providing financial insights based on a summary of transaction history.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateInsightsInputSchema = z.object({
  financialSummary: z.string().min(1, "Financial summary cannot be empty").describe("A summary of the user's financial data including income, expenses, and top spending categories."),
  currency: z.string().optional().describe("The user's default currency code (e.g., USD, EUR, GBP). Use this currency when mentioning amounts in your response."),
});
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

const GenerateInsightsOutputSchema = z.object({
  summary: z.string().describe("A brief, insightful summary of the user's spending and income habits."),
  suggestions: z.array(z.string()).describe('A list of 3-5 actionable and personalized suggestions for financial improvement.'),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export type GenerateInsightsResponse = {
  success: boolean;
  data?: GenerateInsightsOutput;
  error?: string;
};

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsResponse> {
  try {
    const result = await generateInsightsFlow(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI flow failed (generateInsights):", error);
    return {
      success: false,
      error: error.message || "Financial insights currently unavailable."
    };
  }
}

const prompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: { schema: GenerateInsightsInputSchema },
  output: { schema: GenerateInsightsOutputSchema },
  prompt: `You are a helpful and friendly personal finance expert. Your goal is to analyze a user's financial summary to provide them with a clear, concise overview of their financial habits and offer actionable advice.

IMPORTANT: When mentioning monetary amounts in your response, use the user's currency ({{currency}}). Do NOT default to dollars or any other currency. Match the currency format shown in the financial summary.

Analyze the provided summary of the user's financial data.

Based on your analysis, provide:
1.  A brief summary (2-3 sentences) of their overall financial situation. Identify key patterns from the data provided.
2.  A list of 3 to 5 actionable and personalized suggestions. These should be concrete, realistic steps the user can take to improve their financial health. For example, instead of "spend less," suggest "Your spending on 'Dining Out' is higher than average; try cooking at home for 2 extra meals a week to save money."

Here is the user's financial summary:
{{{financialSummary}}}

User's Currency: {{currency}}

Provide your response in the required JSON format.`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
