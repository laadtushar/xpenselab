"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MONZO_CLIENT_ID = process.env.NEXT_PUBLIC_MONZO_CLIENT_ID;
// NOTE: This should match the redirect URI you set in the Monzo Developer Portal
const MONZO_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/settings/monzo` : '';

function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function MonzoConnectButton() {
    const handleConnect = () => {
        if (!MONZO_CLIENT_ID) {
            alert("Monzo Client ID is not configured. Please set NEXT_PUBLIC_MONZO_CLIENT_ID in your environment variables.");
            return;
        }

        const state = generateState();
        // Store state in local storage to verify it on callback
        localStorage.setItem('monzo_oauth_state', state);

        const authUrl = new URL('https://auth.monzo.com');
        authUrl.searchParams.append('client_id', MONZO_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', MONZO_REDIRECT_URI);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('state', state);

        window.location.href = authUrl.toString();
    };

    return (
        <Button onClick={handleConnect}>Connect with Monzo</Button>
    );
}


export function MonzoSettings() {
  // In the future, we will check if the user is already connected.
  const isConnected = false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Connections</CardTitle>
        <CardDescription>
          Connect your bank accounts to automatically import transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div>
            <p>You are connected to Monzo.</p>
            <Button variant="destructive">Disconnect</Button>
          </div>
        ) : (
          <MonzoConnectButton />
        )}
      </CardContent>
    </Card>
  );
}
