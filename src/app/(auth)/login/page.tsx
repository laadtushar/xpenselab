
'use client';

import { useEffect, useState } from 'react';
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
  const [isSigningIn, setIsSigningIn] = useState(false);
  // This state now tracks the entire auth resolution process
  const [isProcessingAuth, setIsProcessingAuth] = useState(true); 
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs once on mount to handle the redirect result.
    if (auth) {
      getGoogleRedirectResult(auth)
        .then((result) => {
          if (result) {
            // User signed in or is signing in. The useUser hook will pick this up.
            // We don't need to redirect here, the layout will handle it.
            console.log('[Login Page] Redirect result processed for user:', result.user.email);
          } else {
            // No redirect result, probably a direct navigation.
            console.log('[Login Page] No active redirect.');
          }
        })
        .catch((error) => {
          console.error('[Login Page] getGoogleRedirectResult error:', error);
          if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
             toast({
              title: 'Sign-In Failed',
              description: error.message || 'An unexpected error occurred during sign-in.',
              variant: 'destructive',
            });
          }
        })
        .finally(() => {
          // Once the redirect is processed, we rely on isUserLoading to be the source of truth.
          // This flag is now redundant, but we keep it to signal the end of this specific process.
          // The main loading decision is made below.
        });
    }
  }, [auth, toast]);

  useEffect(() => {
    // This is the key change. We only stop processing auth when the useUser hook is done loading.
    // This ensures we have the definitive user state before making any decisions.
    if (!isUserLoading) {
      setIsProcessingAuth(false);
    }
  }, [isUserLoading]);

  useEffect(() => {
    // This effect handles navigation.
    // It only runs when auth is no longer processing and we have a definitive user object.
    if (!isProcessingAuth && user) {
      console.log('[Login Page] Auth processed, user exists. Redirecting to /dashboard.');
      router.push('/dashboard');
    }
  }, [isProcessingAuth, user, router]);


  const handleGoogleSignIn = async () => {
    if (!auth) {
      console.error('[Login Page] Google Sign-In clicked, but auth is not available.');
      toast({
        title: 'Authentication Error',
        description: 'Firebase Auth service is not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }
    setIsSigningIn(true); // Show loader on the button
    await initiateGoogleSignInWithRedirect(auth).catch(error => {
        console.error("[Login Page] Redirection initiation failed", error);
        toast({
            title: "Sign-In Error",
            description: "Could not start the sign-in process.",
            variant: "destructive",
        });
        setIsSigningIn(false);
    });
  };

  // The single source of truth for showing the loader.
  // Show loader if we are still waiting for the initial user state OR if we have a user and are about to redirect.
  if (isProcessingAuth || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        {user && <p className="ml-2">Authenticated. Redirecting...</p>}
      </div>
    );
  }

  // Only show the login UI when we are certain there is no user.
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
          <Button onClick={handleGoogleSignIn} className="w-full" disabled={isSigningIn}>
            {isSigningIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.8S111.8 17.6 244 17.6c70.2 0 121.5 27.2 166.4 69.5l-67.5 64.8C296.1 112.3 268.4 96 244 96c-59.6 0-108.2 48.6-108.2 108.2s48.6 108.2 108.2 108.2c68.2 0 97.9-53.2 101-82.3H244v-73.3h239.3c5 27.2 7.7 54.3 7.7 85.8z"></path>
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
