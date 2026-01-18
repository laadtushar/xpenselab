
'use server';
/**
 * @fileOverview An AI flow for scanning and extracting data from a receipt image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScanReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .min(1, "Photo data URI cannot be empty")
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanReceiptInput = z.infer<typeof ScanReceiptInputSchema>;

const ScanReceiptOutputSchema = z.object({
  description: z.string().optional().describe('The name of the merchant or a brief description of the purchase.'),
  amount: z.number().optional().describe('The total amount of the transaction.'),
  date: z.string().datetime().optional().describe('The date of the transaction in ISO 8601 format.'),
  category: z.string().optional().describe('A suggested expense category.'),
});
export type ScanReceiptOutput = z.infer<typeof ScanReceiptOutputSchema>;

export type ScanReceiptResponse = {
  success: boolean;
  data?: ScanReceiptOutput;
  error?: string;
};

export async function scanReceipt(input: ScanReceiptInput): Promise<ScanReceiptResponse> {
  try {
    const result = await scanReceiptFlow(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI flow failed (scanReceipt):", error);
    return {
      success: false,
      error: error.message || "Receipt scanning currently unavailable."
    };
  }
}

const prompt = ai.definePrompt({
  name: 'scanReceiptPrompt',
  input: { schema: ScanReceiptInputSchema },
  output: { schema: ScanReceiptOutputSchema },
  prompt: `You are an expert receipt reader. Analyze the provided receipt image and extract the following information:
- The merchant name to use as the transaction description.
- The final total amount of the transaction.
- The date of the transaction. If no year is present, assume the current year.
- A suitable category for this expense from the following list: Groceries, Rent, Utilities, Transportation, Entertainment, Dining Out, Shopping, Travel, Healthcare, Education, Personal Care, Bills, Subscriptions, Food & Drink, Health & Wellbeing, Education Loan Repayment, Gifts, Other.

Receipt Image: {{media url=photoDataUri}}

If any piece of information is unclear or cannot be found, omit it from the output. Provide the extracted data in the required JSON format.`,
});

const scanReceiptFlow = ai.defineFlow(
  {
    name: 'scanReceiptFlow',
    inputSchema: ScanReceiptInputSchema,
    outputSchema: ScanReceiptOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
