
'use server';

/**
 * @fileOverview AI agent for assessing a user's financial wellness.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Transaction } from '@/lib/types';

const FinancialWellnessInputSchema = z.object({
  transactions: z.array(z.custom<Transaction>()).describe("A list of the user's financial transactions over the last few months."),
  totalIncome: z.number().describe("Total income over the period."),
  totalExpenses: z.number().describe("Total expenses over the period."),
  monthlyBudget: z.number().optional().describe("The user's set monthly budget, if any."),
});
export type FinancialWellnessInput = z.infer<typeof FinancialWellnessInputSchema>;

const FinancialWellnessOutputSchema = z.object({
  wellnessScore: z.number().min(0).max(100).describe('A holistic score from 0-100 representing the user\'s financial health.'),
  analysis: z.string().describe('A brief analysis explaining the score, highlighting strengths and weaknesses.'),
  recommendations: z.array(z.string()).describe('A list of 2-3 actionable recommendations for improving the score.'),
});
export type FinancialWellnessOutput = z.infer<typeof FinancialWellnessOutputSchema>;

export async function checkFinancialWellness(input: FinancialWellnessInput): Promise<FinancialWellnessOutput> {
  return financialWellnessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialWellnessPrompt',
  input: {schema: FinancialWellnessInputSchema.extend({ transactionsJson: z.string() }) },
  output: {schema: FinancialWellnessOutputSchema},
  prompt: `You are a financial wellness coach. Your goal is to analyze a user's financial data to provide a "Financial Wellness Score" out of 100 and offer actionable advice.

Consider the following factors in your analysis:
- Savings Rate: (totalIncome - totalExpenses) / totalIncome. A higher savings rate is better.
- Spending vs. Budget: How close are they to their budget goal?
- Income vs. Expenses: Is there a healthy positive cash flow?
- Spending Habits: Analyze the categories in the transactions for potential areas of improvement.

Based on the provided data, generate a response in the required JSON format. The score should be a reflection of their overall financial health. The analysis should be encouraging but honest. Recommendations should be specific and actionable.

User's Financial Data:
- Total Income: {{totalIncome}}
- Total Expenses: {{totalExpenses}}
- Monthly Budget Goal: {{monthlyBudget}}
- Transactions:
\`\`\`json
{{{transactionsJson}}}
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
    const transactionsJson = JSON.stringify(input.transactions, null, 2);
    const {output} = await prompt({...input, transactionsJson});
    return output!;
  }
);
