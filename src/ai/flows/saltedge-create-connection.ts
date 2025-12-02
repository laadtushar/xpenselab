
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { saltEdgeRequest } from './saltedge-api-helper';

const CreateConnectionInputSchema = z.object({
  userId: z.string().describe("The Firebase Auth user ID."),
  returnUrl: z.string().describe("The URL to return to after connection."),
  providerCode: z.string().optional().describe("Optional provider code to skip provider selection."),
});

const CreateConnectionOutputSchema = z.object({
  success: z.boolean(),
  connectUrl: z.string().optional(),
  connectionId: z.string().optional(),
  message: z.string(),
});

export type CreateConnectionInput = z.infer<typeof CreateConnectionInputSchema>;
export type CreateConnectionOutput = z.infer<typeof CreateConnectionOutputSchema>;

export async function createSaltEdgeConnection(
  input: CreateConnectionInput
): Promise<CreateConnectionOutput> {
  return createSaltEdgeConnectionFlow(input);
}

const createSaltEdgeConnectionFlow = ai.defineFlow(
  {
    name: 'createSaltEdgeConnectionFlow',
    inputSchema: CreateConnectionInputSchema,
    outputSchema: CreateConnectionOutputSchema,
  },
  async (input) => {
    if (!getApps().length) {
      initializeApp();
    }
    const db = getFirestore();

    const { userId, returnUrl, providerCode } = input;

    try {
      // Get or create customer
      const userDocRef = db.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();

      let customerId = userData?.saltEdgeCustomerId;

      if (!customerId) {
        // Import and create customer
        const { createSaltEdgeCustomer } = await import('./saltedge-create-customer');
        const customerResult = await createSaltEdgeCustomer({ userId });
        if (!customerResult.success || !customerResult.customerId) {
          return {
            success: false,
            message: 'Failed to create customer: ' + customerResult.message,
          };
        }
        customerId = customerResult.customerId;
      }

      // Create connection request
      const requestBody: any = {
        data: {
          customer_id: customerId,
          consent: {
            scopes: ['account_details', 'transactions_details'],
          },
          attempt: {
            return_to: returnUrl,
          },
          // Include sandboxes/fake providers for testing
          provider: {
            include_sandboxes: true,
          },
        },
      };

      if (providerCode) {
        requestBody.data.provider = {
          ...requestBody.data.provider,
          code: providerCode,
        };
      }

      const response = await saltEdgeRequest('POST', '/connections/connect', requestBody);

      const connectUrl = response.data.connect_url;
      const connectionId = response.data.id;

      return {
        success: true,
        connectUrl,
        connectionId,
        message: 'Connection created successfully!',
      };
    } catch (error: any) {
      console.error('Error in createSaltEdgeConnectionFlow:', error);
      return {
        success: false,
        message: `Failed to create connection: ${error.message}`,
      };
    }
  }
);

