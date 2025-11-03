
'use server';

/**
 * @fileOverview An AI flow for forecasting future financial balances with "what-if" scenarios.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Transaction } from '@/lib/types';

const PredictiveForecastInputSchema = z.object({
  transactionsJson: z.string().describe("A JSON string of the user's financial transactions."),
  currentBalance: z.number().describe("The user's current total balance across accounts."),
  scenario: z.string().describe('The "what-if" scenario provided by the user (e.g., "add a $50 monthly subscription").'),
  forecastPeriodDays: z.number().default(90).describe('The number of days into the future to forecast.'),
});
export type PredictiveForecastInput = z.infer<typeof PredictiveForecastInputSchema>;

const PredictiveForecastOutputSchema = z.object({
  forecastJson: z.string().describe('A JSON string representing an array of objects, where each object has a "date" (YYYY-MM-DD) and a "balance" (number).'),
  summary: z.string().describe('A human-readable summary of the forecast and the impact of the what-if scenario.'),
});
export type PredictiveForecastOutput = z.infer<typeof PredictiveForecastOutputSchema>;

export async function predictiveForecast(input: PredictiveForecastInput): Promise<{ forecast: { date: string; balance: number }[]; summary: string; }> {
  const result = await predictiveForecastFlow(input);
  return {
    ...result,
    forecast: JSON.parse(result.forecastJson),
  };
}

const prompt = ai.definePrompt({
  name: 'predictiveForecastPrompt',
  input: {schema: PredictiveForecastInputSchema },
  output: {schema: PredictiveForecastOutputSchema},
  prompt: `You are a financial analyst AI. Your task is to create a predictive forecast of a user's bank balance over the next {{forecastPeriodDays}} days based on their past transactions and a "what-if" scenario.

1.  Analyze the user's historical transaction data to identify recurring income and expenses (frequency and amount).
2.  Incorporate the user's "what-if" scenario: "{{scenario}}".
3.  Project the user's balance starting from their current balance of {{currentBalance}}.
4.  Generate a series of forecast data points (date and balance) for the next {{forecastPeriodDays}} days.
5.  Provide a concise summary explaining the forecast and how the scenario impacts their financial future.
6.  Return the forecast data as a JSON string in the 'forecastJson' field.

User's Historical Transaction Data:
\`\`\`json
{{{transactionsJson}}}
\`\`\`

Provide your response in the required JSON format.
`,
});

const predictiveForecastFlow = ai.defineFlow(
  {
    name: 'predictiveForecastFlow',
    inputSchema: PredictiveForecastInputSchema,
    outputSchema: PredictiveForecastOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
