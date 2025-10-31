
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { exchangeMonzoToken } from '@/ai/flows/monzo-exchange-token';

const MONZO_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/settings/monzo` : '';

export default function MonzoCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [message, setMessage] = useState("Processing Monzo authentication...");

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = localStorage.getItem('monzo_oauth_state');
    const error = searchParams.get('error');

    if (error) {
      setMessage(`An error occurred: ${error}`);
      toast({
        title: "Monzo Connection Failed",
        description: "Could not complete the connection with Monzo.",
        variant: "destructive",
      });
      setTimeout(() => router.push('/settings'), 3000);
      return;
    }
    
    if (code && state && state === storedState && user) {
        localStorage.removeItem('monzo_oauth_state');

        exchangeMonzoToken({ code, redirect_uri: MONZO_REDIRECT_URI, userId: user.uid })
            .then(result => {
                if (result.success) {
                    setMessage("Authentication successful! Your Monzo account is now connected.");
                    toast({
                        title: "Monzo Account Connected",
                        description: "Your transactions will be available shortly.",
                    });
                } else {
                    setMessage(`Connection failed: ${result.message}`);
                    toast({
                        title: "Monzo Connection Failed",
                        description: result.message,
                        variant: "destructive",
                    });
                }
            })
            .catch(err => {
                setMessage("An unexpected error occurred while connecting your account.");
                toast({
                    title: "Monzo Connection Error",
                    description: "Please try again.",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setTimeout(() => router.push('/settings'), 3000);
            });
    }

  }, [searchParams, router, toast, user]);

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connecting to Monzo</CardTitle>
          <CardDescription>Please wait while we securely connect your account. You will be redirected shortly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
