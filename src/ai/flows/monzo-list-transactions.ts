
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FEATURES } from '@/lib/config';
import { getValidAccessToken } from './monzo-list-accounts'; // Reusing the token helper
import type { MonzoTransaction } from '@/lib/types';

const ListMonzoTransactionsInputSchema = z.object({
  userId: z.string().min(1, "User ID cannot be empty").describe("The Firebase Auth user ID."),
  accountId: z.string().min(1, "Account ID cannot be empty").describe("The Monzo account ID."),
});

const ListMonzoTransactionsOutputSchema = z.object({
  transactions: z.array(z.custom<MonzoTransaction>()),
});

export async function listMonzoTransactions(
  input: z.infer<typeof ListMonzoTransactionsInputSchema>
): Promise<z.infer<typeof ListMonzoTransactionsOutputSchema>> {
  try {
    return await listMonzoTransactionsFlow(input);
  } catch (error: any) {
    console.error("AI flow failed (listMonzoTransactions):", error);
    throw new Error(`Monzo Service Failure: ${error.message || 'Unknown error'}`);
  }
}

const listMonzoTransactionsFlow = ai.defineFlow(
  {
    name: 'listMonzoTransactionsFlow',
    inputSchema: ListMonzoTransactionsInputSchema,
    outputSchema: ListMonzoTransactionsOutputSchema,
  },
  async ({ userId, accountId }) => {
    if (!FEATURES.isMonzoEnabled) {
      throw new Error("Monzo integration is deprecated and disabled.");
    }
    try {
      const accessToken = await getValidAccessToken(userId);
      const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago

      const url = new URL('https://api.monzo.com/transactions');
      url.searchParams.append('account_id', accountId);
      url.searchParams.append('since', sinceDate);
      url.searchParams.append('expand[]', 'merchant');

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch transactions: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return { transactions: data.transactions };
    } catch (error: any) {
      console.error('Error in listMonzoTransactionsFlow:', error);
      throw error;
    }
  }
);
