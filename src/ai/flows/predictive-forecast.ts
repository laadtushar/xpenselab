
'use server';

/**
 * @fileOverview An AI flow for forecasting future financial balances with "what-if" scenarios.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictiveForecastInputSchema = z.object({
  financialSummary: z.string().min(1, "Financial summary cannot be empty").describe("A summary of the user's financial data, including current balance, average income/expenses, and recurring transactions."),
  userScenario: z.string().min(1, "User scenario cannot be empty").describe('The "what-if" scenario provided by the user (e.g., "add a monthly subscription").'),
  currency: z.string().optional().describe("The user's default currency code (e.g., USD, EUR, GBP). Use this currency when mentioning amounts in your response."),
});
export type PredictiveForecastInput = z.infer<typeof PredictiveForecastInputSchema>;

const ForecastDataPointSchema = z.object({
  date: z.string().describe('The date for the forecast point in YYYY-MM-DD format.'),
  balance: z.number().describe('The projected balance for that date.'),
});

const PredictiveForecastOutputSchema = z.object({
  forecast: z.array(ForecastDataPointSchema).describe('An array of objects, where each object has a "date" and a "balance".'),
  summary: z.string().describe('A human-readable summary of the forecast and the impact of the what-if scenario.'),
});
export type PredictiveForecastOutput = z.infer<typeof PredictiveForecastOutputSchema>;

export type PredictiveForecastResponse = {
  success: boolean;
  data?: PredictiveForecastOutput;
  error?: string;
};

export async function predictiveForecast(input: PredictiveForecastInput): Promise<PredictiveForecastResponse> {
  try {
    const result = await predictiveForecastFlow(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI flow failed (predictiveForecast):", error);
    return {
      success: false,
      error: error.message || "Predictive forecast currently unavailable."
    };
  }
}

const prompt = ai.definePrompt({
  name: 'predictiveForecastPrompt',
  input: { schema: PredictiveForecastInputSchema },
  output: { schema: PredictiveForecastOutputSchema },
  prompt: `You are a financial analyst AI. Your task is to create a predictive forecast of a user's bank balance over the next 90 days based on their financial summary and a "what-if" scenario.

IMPORTANT: When mentioning monetary amounts in your response, use the user's currency ({{currency}}). Do NOT default to dollars or any other currency. Match the currency format shown in the financial summary.

1.  Analyze the user's historical financial summary to understand their cash flow.
2.  Incorporate the user's "what-if" scenario: "{{userScenario}}".
3.  Project the user's balance.
4.  Generate a series of forecast data points (date and balance) for the next 90 days.
5.  Provide a concise summary explaining the forecast and how the scenario impacts their financial future. Use the user's currency ({{currency}}) when mentioning amounts.
6.  Return the forecast data as an array of objects in the 'forecast' field.

User's Financial Summary:
\`\`\`
{{{financialSummary}}}
\`\`\`

User's Currency: {{currency}}

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
    const { output } = await prompt(input);
    return output!;
  }
);
