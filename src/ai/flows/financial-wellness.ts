
'use server';

/**
 * @fileOverview AI agent for assessing a user's financial wellness based on a data summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialWellnessInputSchema = z.object({
  financialSummary: z.string().describe("A summary of the user's financial data, including income, expenses, savings rate, and budget."),
});
export type FinancialWellnessInput = z.infer<typeof FinancialWellnessInputSchema>;

const FinancialWellnessOutputSchema = z.object({
  wellnessScore: z.number().min(0).max(100).describe('A holistic score from 0-100 representing the user\'s financial health.'),
  analysis: z.string().describe('A brief analysis explaining the score, highlighting strengths and weaknesses.'),
  recommendations: z.array(z.string()).describe('An array of 2-3 actionable recommendations for improving the score.'),
});
export type FinancialWellnessOutput = z.infer<typeof FinancialWellnessOutputSchema>;

export async function checkFinancialWellness(input: FinancialWellnessInput): Promise<FinancialWellnessOutput> {
    return await financialWellnessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialWellnessPrompt',
  input: {schema: FinancialWellnessInputSchema },
  output: {schema: FinancialWellnessOutputSchema},
  prompt: `You are a financial wellness coach. Your goal is to analyze a user's financial data summary to provide a "Financial Wellness Score" out of 100 and offer actionable advice.

Consider the following factors in your analysis based on the provided summary:
- Savings Rate: (totalIncome - totalExpenses) / totalIncome. A higher savings rate is better.
- Spending vs. Budget: How close are they to their budget goal?
- Income vs. Expenses: Is there a healthy positive cash flow?

Based on the provided data, generate a response in the required JSON format. The score should be a reflection of their overall financial health. The analysis should be encouraging but honest. The recommendations should be returned as a JSON array of strings in the 'recommendations' field.

User's Financial Summary:
\`\`\`
{{{financialSummary}}}
\`\`\`
`,
});

const financialWellnessFlow = ai.defineFlow(
  {
    name: 'financialWellnessFlow',
    inputSchema: FinancialWellnessInputSchema,
    outputSchema: FinancialWellnessOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
