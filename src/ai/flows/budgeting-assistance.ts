'use server';

/**
 * @fileOverview AI agent for providing budgeting assistance based on spending habits.
 *
 * - budgetingAssistance - A function that assesses if spending habits require budget corrections.
 * - BudgetingAssistanceInput - The input type for the budgetingAssistance function.
 * - BudgetingAssistanceOutput - The return type for the budgetingAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetingAssistanceInputSchema = z.object({
  monthlyIncome: z.number().describe('The user\'s total monthly income.'),
  monthlyExpenses: z.number().describe('The user\'s total monthly expenses.'),
  budgetGoal: z.number().describe('The user\'s monthly budget goal.'),
  spendingCategories: z
    .record(z.number())
    .describe(
      'A record of spending categories and the amount spent in each category.'
    ),
});
export type BudgetingAssistanceInput = z.infer<typeof BudgetingAssistanceInputSchema>;

const BudgetingAssistanceOutputSchema = z.object({
  assessment: z
    .string()
    .describe(
      'An assessment of the user\'s spending habits and whether budget corrections are needed.'
    ),
  recommendations: z
    .string()
    .describe('Recommendations for adjusting the budget if needed.'),
});
export type BudgetingAssistanceOutput = z.infer<typeof BudgetingAssistanceOutputSchema>;

export async function budgetingAssistance(
  input: BudgetingAssistanceInput
): Promise<BudgetingAssistanceOutput> {
  return budgetingAssistanceFlow(input);
}

const budgetingAssistancePrompt = ai.definePrompt({
  name: 'budgetingAssistancePrompt',
  input: {schema: BudgetingAssistanceInputSchema},
  output: {schema: BudgetingAssistanceOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's financial data and provide an assessment of their spending habits. Determine if budget corrections are needed and offer personalized recommendations.

Monthly Income: {{monthlyIncome}}
Monthly Expenses: {{monthlyExpenses}}
Budget Goal: {{budgetGoal}}
Spending Categories: {{spendingCategories}}

Assessment:
Recommendations: `,
});

const budgetingAssistanceFlow = ai.defineFlow(
  {
    name: 'budgetingAssistanceFlow',
    inputSchema: BudgetingAssistanceInputSchema,
    outputSchema: BudgetingAssistanceOutputSchema,
  },
  async input => {
    const {output} = await budgetingAssistancePrompt(input);
    return output!;
  }
);

