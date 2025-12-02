
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { saltEdgeRequest } from './saltedge-api-helper';
import type { SaltEdgeTransaction } from '@/lib/types';

const ListTransactionsInputSchema = z.object({
  userId: z.string().describe("The Firebase Auth user ID."),
  accountId: z.string().optional().describe("Optional account ID to filter transactions."),
  connectionId: z.string().optional().describe("Optional connection ID to filter transactions."),
  fromDate: z.string().optional().describe("Optional start date (YYYY-MM-DD)."),
  toDate: z.string().optional().describe("Optional end date (YYYY-MM-DD)."),
});

const ListTransactionsOutputSchema = z.object({
  transactions: z.array(z.custom<SaltEdgeTransaction>()),
});

export type ListTransactionsInput = z.infer<typeof ListTransactionsInputSchema>;
export type ListTransactionsOutput = z.infer<typeof ListTransactionsOutputSchema>;

export async function listSaltEdgeTransactions(
  input: ListTransactionsInput
): Promise<ListTransactionsOutput> {
  return listSaltEdgeTransactionsFlow(input);
}

const listSaltEdgeTransactionsFlow = ai.defineFlow(
  {
    name: 'listSaltEdgeTransactionsFlow',
    inputSchema: ListTransactionsInputSchema,
    outputSchema: ListTransactionsOutputSchema,
  },
  async (input) => {
    if (!getApps().length) {
      initializeApp();
    }
    const db = getFirestore();

    const { userId, accountId, connectionId, fromDate, toDate } = input;

    try {
      // Get customer ID
      const userDocRef = db.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();

      if (!userData?.saltEdgeCustomerId) {
        throw new Error('User is not connected to Salt Edge. Please create a connection first.');
      }

      // Build query parameters
      const params = new URLSearchParams();
      
      if (accountId) {
        params.append('account_id', accountId);
      } else if (connectionId) {
        params.append('connection_id', connectionId);
      } else {
        // Get all connections for this customer
        const connectionsResponse = await saltEdgeRequest(
          'GET',
          `/connections?customer_id=${userData.saltEdgeCustomerId}`
        );
        const connectionIds = connectionsResponse.data.map((conn: any) => conn.id);
        if (connectionIds.length > 0) {
          params.append('connection_id', connectionIds[0]); // Use first connection
        }
      }

      if (fromDate) {
        params.append('from_date', fromDate);
      } else {
        // Default to 90 days ago
        const date = new Date();
        date.setDate(date.getDate() - 90);
        params.append('from_date', date.toISOString().split('T')[0]);
      }

      if (toDate) {
        params.append('to_date', toDate);
      }

      // Fetch transactions
      const response = await saltEdgeRequest(
        'GET',
        `/transactions?${params.toString()}`
      );

      return { transactions: response.data || [] };
    } catch (error: any) {
      console.error('Error in listSaltEdgeTransactionsFlow:', error);
      throw error;
    }
  }
);

