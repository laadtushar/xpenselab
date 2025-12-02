
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { saltEdgeRequest } from './saltedge-api-helper';
import type { SaltEdgeAccount } from '@/lib/types';

const ListAccountsInputSchema = z.object({
  userId: z.string().describe("The Firebase Auth user ID."),
  connectionId: z.string().optional().describe("Optional connection ID to filter accounts."),
});

const ListAccountsOutputSchema = z.object({
  accounts: z.array(z.custom<SaltEdgeAccount>()),
});

export type ListAccountsInput = z.infer<typeof ListAccountsInputSchema>;
export type ListAccountsOutput = z.infer<typeof ListAccountsOutputSchema>;

export async function listSaltEdgeAccounts(
  input: ListAccountsInput
): Promise<ListAccountsOutput> {
  return listSaltEdgeAccountsFlow(input);
}

const listSaltEdgeAccountsFlow = ai.defineFlow(
  {
    name: 'listSaltEdgeAccountsFlow',
    inputSchema: ListAccountsInputSchema,
    outputSchema: ListAccountsOutputSchema,
  },
  async (input) => {
    if (!getApps().length) {
      initializeApp();
    }
    const db = getFirestore();

    const { userId, connectionId } = input;

    try {
      // Get customer ID
      const userDocRef = db.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();

      if (!userData?.saltEdgeCustomerId) {
        throw new Error('User is not connected to Salt Edge. Please create a connection first.');
      }

      // List connections if connectionId not provided
      let connectionIds: string[] = [];
      
      if (connectionId) {
        connectionIds = [connectionId];
      } else {
        // Get all connections for this customer
        const connectionsResponse = await saltEdgeRequest(
          'GET',
          `/connections?customer_id=${userData.saltEdgeCustomerId}`
        );
        connectionIds = connectionsResponse.data.map((conn: any) => conn.id);
      }

      if (connectionIds.length === 0) {
        return { accounts: [] };
      }

      // Fetch accounts for all connections
      const allAccounts: SaltEdgeAccount[] = [];
      
      for (const connId of connectionIds) {
        try {
          const accountsResponse = await saltEdgeRequest(
            'GET',
            `/accounts?connection_id=${connId}`
          );
          allAccounts.push(...accountsResponse.data);
        } catch (error) {
          console.error(`Error fetching accounts for connection ${connId}:`, error);
          // Continue with other connections
        }
      }

      return { accounts: allAccounts };
    } catch (error: any) {
      console.error('Error in listSaltEdgeAccountsFlow:', error);
      throw error;
    }
  }
);

