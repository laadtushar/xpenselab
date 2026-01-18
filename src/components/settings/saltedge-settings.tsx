"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinancials } from "@/context/financial-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createSaltEdgeConnection } from "@/ai/flows/saltedge-create-connection";
import { listSaltEdgeProviders } from "@/ai/flows/saltedge-list-providers";
import { useState } from "react";
import { useUser } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function SaltEdgeConnectButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Get current user ID - we'll need to pass it from parent
      // For now, we'll handle this in the parent component
      const returnUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/settings/saltedge`
        : '';

      // This will be called from the parent with userId
      toast({
        title: "Redirecting to Salt Edge",
        description: "Please complete the connection in the widget.",
      });
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Connect Bank Account
    </Button>
  );
}

export function SaltEdgeSettings() {
  const { userData, updateUser, isLoading } = useFinancials();
  const { user } = useUser();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [fakeProviders, setFakeProviders] = useState<Array<{ code: string; name: string }>>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const isConnected = !!userData?.saltEdgeCustomerId;

  // Load fake providers for testing
  const loadFakeProviders = async () => {
    setLoadingProviders(true);
    try {
      const result = await listSaltEdgeProviders({
        includeSandboxes: true,
        countryCode: 'XF' // XF is the fake country code
      });
      const fake = result.providers.filter(p =>
        p.code.includes('fake') || p.country_code === 'XF'
      );
      setFakeProviders(fake);
    } catch (error) {
      console.error('Failed to load fake providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "User not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const returnUrl = `${window.location.origin}/settings/saltedge`;
      const result = await createSaltEdgeConnection({
        userId: user.uid,
        returnUrl,
        providerCode: selectedProvider || undefined, // Use selected provider if any
      });

      if (result.success && result.connectUrl) {
        // Open Salt Edge widget in new window
        window.open(result.connectUrl, '_blank', 'noopener,noreferrer');
        toast({
          title: "Connection Started",
          description: "Please complete the connection in the widget window.",
        });
      } else {
        throw new Error(result.message || 'Failed to create connection');
      }
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate connection.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    updateUser({ saltEdgeCustomerId: undefined, saltEdgeConnections: undefined });
    toast({
      title: "Bank Account Disconnected",
      description: "Your bank account connection has been removed.",
    });
  };

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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">You are connected to Salt Edge.</p>
              <Button variant="destructive" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
            {userData.saltEdgeConnections && userData.saltEdgeConnections.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Connected Banks:</p>
                <ul className="list-disc list-inside space-y-1">
                  {userData.saltEdgeConnections.map((conn) => (
                    <li key={conn.connectionId} className="text-sm text-muted-foreground">
                      {conn.providerName} ({conn.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={handleConnect} variant="outline" disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Another Bank
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-provider">Test with Fake Provider (Optional)</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProvider}
                  onValueChange={(value) => {
                    if (value === '__load__') {
                      loadFakeProviders();
                      return;
                    }
                    setSelectedProvider(value === '__none__' ? '' : value);
                  }}
                  disabled={loadingProviders}
                >
                  <SelectTrigger id="test-provider" className="flex-1">
                    <SelectValue placeholder="Select a fake provider for testing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (Show all providers)</SelectItem>
                    {fakeProviders.length === 0 && !loadingProviders && (
                      <SelectItem value="__load__">
                        Load Fake Providers...
                      </SelectItem>
                    )}
                    {loadingProviders && (
                      <SelectItem value="__loading__" disabled>
                        Loading...
                      </SelectItem>
                    )}
                    {fakeProviders.map((provider) => (
                      <SelectItem key={provider.code} value={provider.code}>
                        {provider.name} ({provider.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Select a fake provider to test the connection flow. Leave empty to see all providers.
              </p>
            </div>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Bank Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

