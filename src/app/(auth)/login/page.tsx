'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Logo } from '@/components/logo';
import { getRedirectResult } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    // This effect runs once to check for a sign-in redirect result.
    if (auth) {
      getRedirectResult(auth)
        .then((result) => {
          // If result is not null, a sign-in redirect was just completed.
          // The onAuthStateChanged listener in useUser will handle the user object update.
          // We can stop our local "processing" state.
        })
        .catch((error) => {
          console.error("Error processing redirect result:", error);
        })
        .finally(() => {
          // Crucially, we are now done processing the redirect attempt.
          // The auth state will now be determined by the onAuthStateChanged listener.
          setIsProcessingRedirect(false);
        });
    } else {
      // If auth isn't ready yet, we are not processing a redirect.
      setIsProcessingRedirect(false);
    }
  }, [auth]);


  useEffect(() => {
    // This effect handles redirection to the dashboard AFTER auth state is confirmed
    // and we are no longer in the middle of processing a redirect.
    if (!isUserLoading && !isProcessingRedirect && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isProcessingRedirect, router]);

  const handleGoogleSignIn = () => {
    if (auth) {
      // Set processing to true before initiating redirect to show loader immediately.
      setIsProcessingRedirect(true);
      initiateGoogleSignIn(auth);
    }
  };

  // The loading screen should be active if:
  // 1. Firebase is still checking the initial auth state (`isUserLoading`).
  // 2. We are actively processing a potential sign-in from a redirect (`isProcessingRedirect`).
  // If either is true, we show the loader.
  const showLoader = isUserLoading || isProcessingRedirect;

  if (showLoader) {
    return (
       <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If we are done loading and there IS a user, we are about to redirect.
  // Showing a loader here prevents a flash of the login page.
  if (user) {
    return (
       <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Only show the login page if we are done with all loading states AND there is no user.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Welcome to FinanceFlow</CardTitle>
          <CardDescription>Sign in to manage your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignIn} className="w-full">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.8S111.8 17.6 244 17.6c70.2 0 121.5 27.2 166.4 69.5l-67.5 64.8C296.1 112.3 268.4 96 244 96c-59.6 0-108.2 48.6-108.2 108.2s48.6 108.2 108.2 108.2c68.2 0 97.9-53.2 101-82.3H244v-73.3h239.3c5 27.2 7.7 54.3 7.7 85.8z"></path>
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
