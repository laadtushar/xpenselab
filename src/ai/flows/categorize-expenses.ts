// src/ai/flows/categorize-expenses.ts
'use server';
/**
 * @fileOverview Categorizes expenses based on the description provided.
 *
 * - categorizeExpense - A function that categorizes an expense based on its description.
 * - CategorizeExpenseInput - The input type for the categorizeExpense function.
 * - CategorizeExpenseOutput - The return type for the categorizeExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeExpenseInputSchema = z.object({
  description: z.string().describe('The description of the expense.'),
});
export type CategorizeExpenseInput = z.infer<typeof CategorizeExpenseInputSchema>;

const CategorizeExpenseOutputSchema = z.object({
  category: z.string().describe('The category of the expense.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});
export type CategorizeExpenseOutput = z.infer<typeof CategorizeExpenseOutputSchema>;

export async function categorizeExpense(input: CategorizeExpenseInput): Promise<CategorizeExpenseOutput> {
  return categorizeExpenseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeExpensePrompt',
  input: {schema: CategorizeExpenseInputSchema},
  output: {schema: CategorizeExpenseOutputSchema},
  prompt: `You are an expert personal finance manager. Determine the most appropriate category for the expense described below.

Description: {{{description}}}

Possible categories are: Groceries, Rent, Utilities, Transportation, Entertainment, Dining Out, Shopping, Travel, Healthcare, Education, Personal Care, Bills, Subscriptions, Food & Drink, Health & Wellbeing, Education Loan Repayment, Gifts, Other.

Return the category and a confidence level between 0 and 1.

{{outputFormatInstructions}}`,
});

const categorizeExpenseFlow = ai.defineFlow(
  {
    name: 'categorizeExpenseFlow',
    inputSchema: CategorizeExpenseInputSchema,
    outputSchema: CategorizeExpenseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
