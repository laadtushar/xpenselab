
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { saltEdgeRequest } from './saltedge-api-helper';

const CreateCustomerInputSchema = z.object({
  userId: z.string().describe("The Firebase Auth user ID."),
  identifier: z.string().optional().describe("Optional unique identifier for the customer."),
});

const CreateCustomerOutputSchema = z.object({
  success: z.boolean(),
  customerId: z.string().optional(),
  message: z.string(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>;
export type CreateCustomerOutput = z.infer<typeof CreateCustomerOutputSchema>;

export async function createSaltEdgeCustomer(
  input: CreateCustomerInput
): Promise<CreateCustomerOutput> {
  return createSaltEdgeCustomerFlow(input);
}

const createSaltEdgeCustomerFlow = ai.defineFlow(
  {
    name: 'createSaltEdgeCustomerFlow',
    inputSchema: CreateCustomerInputSchema,
    outputSchema: CreateCustomerOutputSchema,
  },
  async (input) => {
    if (!getApps().length) {
      initializeApp();
    }
    const db = getFirestore();

    const { userId, identifier } = input;

    try {
      // Check if customer already exists
      const userDocRef = db.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();

      if (userData?.saltEdgeCustomerId) {
        return {
          success: true,
          customerId: userData.saltEdgeCustomerId,
          message: 'Salt Edge customer already exists.',
        };
      }

      // Create customer in Salt Edge
      const response = await saltEdgeRequest('POST', '/customers', {
        data: {
          identifier: identifier || `user_${userId}`,
        },
      });

      const customerId = response.data.id;

      // Store customer ID in Firestore
      await userDocRef.set(
        { saltEdgeCustomerId: customerId },
        { merge: true }
      );

      return {
        success: true,
        customerId,
        message: 'Salt Edge customer created successfully!',
      };
    } catch (error: any) {
      console.error('Error in createSaltEdgeCustomerFlow:', error);
      return {
        success: false,
        message: `Failed to create Salt Edge customer: ${error.message}`,
      };
    }
  }
);

