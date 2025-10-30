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
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs once on page load to handle the redirect result.
    const processRedirect = async () => {
      if (auth) {
        try {
          const result = await getGoogleRedirectResult(auth);
          // If result is not null, a sign-in was successful.
          // The onAuthStateChanged listener will handle the user object update.
        } catch (error: any) {
          if (error.code !== 'auth/popup-closed-by-user') {
            console.error('Google sign-in redirect error:', error);
            toast({
              title: 'Sign-In Failed',
              description: error.message || 'An unexpected error occurred during sign-in.',
              variant: 'destructive',
            });
          }
        }
      }
      setIsProcessingRedirect(false); // Finished processing redirect
    };
    processRedirect();
  }, [auth, toast]);

  useEffect(() => {
    // This effect handles navigation *after* auth state is resolved.
    if (!isUserLoading && !isProcessingRedirect) {
      if (user) {
        router.push('/dashboard');
      }
    }
  }, [user, isUserLoading, isProcessingRedirect, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({
        title: 'Authentication Error',
        description: 'Firebase Auth service is not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }
    setIsSigningIn(true);
    await initiateGoogleSignInWithRedirect(auth); // Use redirect
  };

  // Show a loading screen while checking auth state or processing the redirect.
  if (isUserLoading || isProcessingRedirect) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  // Only render the login form if we are done loading and there is no user.
  if (user) {
    // If a user is found, the effect above will redirect. Return a loader in the meantime.
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Redirecting to dashboard...</p>
      </div>
    );
  }

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
