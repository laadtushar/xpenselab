"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinancials } from "@/context/financial-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const MONZO_CLIENT_ID = process.env.NEXT_PUBLIC_MONZO_CLIENT_ID;

function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function MonzoConnectButton() {
    const handleConnect = () => {
        const MONZO_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/settings/monzo` : '';
        if (!MONZO_CLIENT_ID) {
            alert("Monzo Client ID is not configured. Please set NEXT_PUBLIC_MONZO_CLIENT_ID in your environment variables.");
            return;
        }

        const state = generateState();
        localStorage.setItem('monzo_oauth_state', state);

        const authUrl = new URL('https://auth.monzo.com');
        authUrl.searchParams.append('client_id', MONZO_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', MONZO_REDIRECT_URI);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('state', state);
        
        window.open(authUrl.toString(), '_blank', 'noopener,noreferrer');
    };

    return (
        <Button onClick={handleConnect}>Connect with Monzo</Button>
    );
}

export function MonzoSettings() {
  const { userData, updateUser, isLoading } = useFinancials();
  const { toast } = useToast();
  const isConnected = !!userData?.monzoTokens;

  const handleDisconnect = () => {
    updateUser({ monzoTokens: undefined });
    toast({
        title: "Monzo Account Disconnected",
        description: "Your Monzo account has been disconnected.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Connections</CardTitle>
        <CardDescription>
          Connect your bank accounts to automatically import transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
        ) : isConnected ? (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">You are connected to Monzo.</p>
            <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
          </div>
        ) : (
          <MonzoConnectButton />
        )}
      </CardContent>
    </Card>
  );
}
