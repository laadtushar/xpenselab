
'use server';

/**
 * @fileOverview AI agent for providing financial insights based on transaction history.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Transaction } from '@/lib/types';

const GenerateInsightsInputSchema = z.object({
    transactions: z.array(z.custom<Transaction>()).describe("List of user's financial transactions."),
});
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

const GenerateInsightsPromptInputSchema = GenerateInsightsInputSchema.extend({
    transactionsJson: z.string(),
});


const GenerateInsightsOutputSchema = z.object({
  summary: z.string().describe("A brief, insightful summary of the user's spending and income habits."),
  suggestions: z.array(z.string()).describe('A list of 3-5 actionable and personalized suggestions for financial improvement.'),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: {schema: GenerateInsightsPromptInputSchema},
  output: {schema: GenerateInsightsOutputSchema},
  prompt: `You are a helpful and friendly personal finance expert. Your goal is to analyze a user's transaction history to provide them with a clear, concise summary of their financial habits and offer actionable advice.

Analyze the provided JSON of the user's transactions.

Based on your analysis, provide:
1.  A brief summary (2-3 sentences) of their overall financial situation. Identify key patterns, such as top spending categories, income consistency, or the relationship between income and expenses.
2.  A list of 3 to 5 actionable and personalized suggestions. These should be concrete, realistic steps the user can take to improve their financial health. For example, instead of "spend less," suggest "Your spending on 'Dining Out' is higher than average; try cooking at home for 2 extra meals a week to save money."

Here is the user's transaction data:
\`\`\`json
{{{transactionsJson}}}
\`\`\`

Provide your response in the required JSON format.`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async input => {
    const transactionsJson = JSON.stringify(input.transactions, null, 2);
    const {output} = await prompt({...input, transactionsJson});
    return output!;
  }
);
