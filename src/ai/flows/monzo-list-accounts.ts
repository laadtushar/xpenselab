
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FEATURES } from '@/lib/config';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import type { MonzoAccount } from '@/lib/types';

const ListMonzoAccountsInputSchema = z.object({
  userId: z.string().min(1, "User ID cannot be empty").describe("The Firebase Auth user ID."),
});

const ListMonzoAccountsOutputSchema = z.object({
  accounts: z.array(z.custom<MonzoAccount>()),
});

export async function listMonzoAccounts(userId: string): Promise<z.infer<typeof ListMonzoAccountsOutputSchema>> {
  try {
    return await listMonzoAccountsFlow({ userId });
  } catch (error: any) {
    console.error("AI flow failed (listMonzoAccounts):", error);
    throw new Error(`Monzo Service Failure: ${error.message || 'Unknown error'}`);
  }
}

// Helper function to handle token refresh
async function getValidAccessToken(userId: string) {
  if (!getApps().length) {
    initializeApp();
  }
  const db = getFirestore();
  const userDocRef = db.collection('users').doc(userId);
  const userDoc = await userDocRef.get();
  const userData = userDoc.data();

  if (!userData?.monzoTokens?.accessToken) {
    throw new Error('User is not connected to Monzo.');
  }

  const { accessToken, refreshToken, expiresAt } = userData.monzoTokens;

  // If token is still valid for more than 5 minutes, use it
  if (new Date(expiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
    return accessToken;
  }

  // If token is expired, try to refresh it
  if (!refreshToken) {
    throw new Error('Access token expired and no refresh token is available.');
  }

  const clientId = process.env.NEXT_PUBLIC_MONZO_CLIENT_ID;
  const clientSecret = process.env.MONZO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Monzo client ID or secret not configured.');
  }

  const response = await fetch('https://api.monzo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  const tokenData = await response.json();

  if (!response.ok) {
    console.error("Failed to refresh token:", tokenData);
    // If refresh fails, delete tokens to force re-authentication
    await userDocRef.update({ monzoTokens: null });
    throw new Error('Failed to refresh Monzo access token. Please reconnect.');
  }

  const newTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  };

  await userDocRef.update({ monzoTokens: newTokens });

  return newTokens.accessToken;
}

const listMonzoAccountsFlow = ai.defineFlow(
  {
    name: 'listMonzoAccountsFlow',
    inputSchema: ListMonzoAccountsInputSchema,
    outputSchema: ListMonzoAccountsOutputSchema,
  },
  async ({ userId }) => {
    if (!FEATURES.isMonzoEnabled) {
      throw new Error("Monzo integration is deprecated and disabled.");
    }
    try {
      const accessToken = await getValidAccessToken(userId);

      const response = await fetch('https://api.monzo.com/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch accounts: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const accounts: MonzoAccount[] = data.accounts.filter((acc: MonzoAccount) => !acc.id.startsWith('pot_'));

      return { accounts };
    } catch (error: any) {
      console.error('Error in listMonzoAccountsFlow:', error);
      // Let the error propagate to be handled by the client
      throw error;
    }
  }
);

export { getValidAccessToken };
