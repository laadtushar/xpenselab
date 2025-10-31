
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateGoogleSignInWithRedirect, getGoogleRedirectResult } from '@/firebase/non-blocking-login';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  // This state is crucial to know if we are waiting for a redirect result from Google.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This effect handles the result of a sign-in redirect.
    // It runs once when the component mounts and the auth service is ready.
    if (!auth) {
      // If auth is not ready, we can't process the redirect.
      setIsProcessingRedirect(false);
      return;
    }
    
    getGoogleRedirectResult(auth)
      .then((result) => {
        if (result) {
          // If we get a result, it means the user has just signed in.
          // The `useUser` hook will soon update with the new user.
          // We don't need to do anything here except wait.
          // The navigation to the dashboard will be handled by the other useEffect.
        }
      })
      .catch((error) => {
        // This is where Firebase errors like 'auth/internal-error' will be caught.
        console.error('Login page redirect result error:', error);
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not complete sign-in.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        // Crucially, we set this to false *after* the async operation is complete.
        // Now the component knows it's no longer waiting for a potential redirect.
        setIsProcessingRedirect(false);
      });

  }, [auth, toast]);

  // This effect handles navigating an already-logged-in user to the dashboard.
  useEffect(() => {
    // We wait for both the initial user loading AND the redirect processing to be finished.
    // And, of course, we need a user object to exist.
    if (!isUserLoading && !isProcessingRedirect && user) {
      router.push('/dashboard');
    }
  }, [isUserLoading, isProcessingRedirect, user, router]);

  const handleGoogleSignIn = () => {
    if (!auth) {
      toast({
        title: 'Authentication Error',
        description: 'Firebase Auth service is not available.',
        variant: 'destructive',
      });
      return;
    }
    // We don't need to set any loading state here because the page will redirect away.
    initiateGoogleSignInWithRedirect(auth).catch((error) => {
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not start sign-in process.',
          variant: 'destructive',
        });
    });
  };

  // The main loader. Show this if we are still waiting for Firebase's initial check
  // OR if we are actively processing a potential redirect result. This prevents the
  // login form from flashing on screen after a successful sign-in.
  if (isUserLoading || isProcessingRedirect) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // If we've finished all loading/processing and there's still a user, it means
  // the navigation effect is about to fire. Show a loader to prevent UI flash.
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only show the login UI if we are done with all checks and there is no user.
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
