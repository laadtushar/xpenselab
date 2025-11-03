
'use server';
/**
 * @fileOverview A Genkit flow for handling the Monzo OAuth2 token exchange.
 *
 * - exchangeMonzoToken - A function that securely exchanges an authorization code for an access token.
 * - ExchangeTokenInput - The input type for the exchangeMonzoToken function.
 * - ExchangeTokenOutput - The return type for the exchangeMonzoToken function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';

const ExchangeTokenInputSchema = z.object({
  code: z.string().describe("The authorization code received from Monzo."),
  redirect_uri: z.string().describe("The redirect URI used in the initial request."),
  userId: z.string().describe("The Firebase Auth user ID."),
});
export type ExchangeTokenInput = z.infer<typeof ExchangeTokenInputSchema>;

const ExchangeTokenOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ExchangeTokenOutput = z.infer<typeof ExchangeTokenOutputSchema>;

export async function exchangeMonzoToken(
  input: ExchangeTokenInput
): Promise<ExchangeTokenOutput> {
  return exchangeMonzoTokenFlow(input);
}

const exchangeMonzoTokenFlow = ai.defineFlow(
  {
    name: 'exchangeMonzoTokenFlow',
    inputSchema: ExchangeTokenInputSchema,
    outputSchema: ExchangeTokenOutputSchema,
  },
  async (input) => {
    // Initialize Firebase Admin SDK inside the flow for reliability
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    const { code, redirect_uri, userId } = input;

    const clientId = process.env.NEXT_PUBLIC_MONZO_CLIENT_ID;
    const clientSecret = process.env.MONZO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Monzo client ID or secret is not configured.");
      return { success: false, message: "Server configuration error: Monzo client ID or secret is not set." };
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect_uri,
        code: code,
    });

    try {
      const response = await fetch('https://api.monzo.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const tokenData = await response.json();

      if (!response.ok) {
        console.error("Failed to exchange token. Status:", response.status, "Body:", tokenData);
        const errorMessage = tokenData.error_description || tokenData.error || 'Failed to exchange token.';
        return { success: false, message: `API Error: ${errorMessage}` };
      }
      
      const userDocRef = db.collection('users').doc(userId);
      
      const monzoTokens: any = {
          accessToken: tokenData.access_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      };
      
      if (tokenData.refresh_token) {
        monzoTokens.refreshToken = tokenData.refresh_token;
      }
      
      await userDocRef.set({ monzoTokens }, { merge: true });

      return { success: true, message: 'Monzo account connected successfully!' };
    } catch (error: any) {
      console.error('Error during token exchange flow:', error);
      // Check for specific Firestore validation error
      if (error.message && error.message.includes('Firestore document')) {
          return { success: false, message: `An unexpected error occurred: ${error.message}. This might be due to an issue with the data being saved.` };
      }
      return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
  }
);
