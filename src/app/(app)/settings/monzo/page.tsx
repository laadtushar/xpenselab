// This page will handle the OAuth callback from Monzo.
// For now, it will be a placeholder.
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MonzoCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState("Processing Monzo authentication...");

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      // In a real implementation, we would send this code to our backend (Genkit flow)
      // to exchange it for an access token.
      setMessage("Authentication successful! We would now exchange the code for an access token.");
      
      // For now, just show a success message and redirect.
      toast({
        title: "Monzo Connection Initiated",
        description: "Successfully received authorization code from Monzo.",
      });

      // Simulate a network request and then redirect
      setTimeout(() => {
        router.push('/settings');
      }, 3000);

    } else {
        const error = searchParams.get('error');
        if (error) {
            setMessage(`An error occurred: ${error}`);
            toast({
                title: "Monzo Connection Failed",
                description: "Could not complete the connection with Monzo.",
                variant: "destructive",
            });
            setTimeout(() => {
                router.push('/settings');
            }, 3000);
        }
    }
  }, [searchParams, router, toast]);

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connecting to Monzo</CardTitle>
          <CardDescription>Please wait while we securely connect your account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
