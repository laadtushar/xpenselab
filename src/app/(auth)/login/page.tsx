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
  const [isSigningIn, setIsSigningIn] = useState(true); // Start true to handle redirect
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
        toast({ title: 'Auth service not ready', variant: 'destructive' });
        setIsSigningIn(false);
        return;
    }
    
    // This is the key: process the redirect result as soon as auth is ready.
    getGoogleRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User signed in via redirect.
          // The useUser hook in the layout will detect the user and handle navigation.
          // We can just keep showing the loader here until the layout takes over.
          // No need to call router.push here.
        }
      })
      .catch((error) => {
        console.error('Login page redirect result error:', error);
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not complete sign-in.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        // This is important: once the redirect is processed (or if there was none),
        // we can stop the "signing in" state.
        setIsSigningIn(false);
      });

  }, [auth, toast]);

  // This effect handles redirecting an already-logged-in user
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [isUserLoading, user, router]);


  const handleGoogleSignIn = () => {
    if (!auth) {
      toast({
        title: 'Authentication Error',
        description: 'Firebase Auth service is not available.',
        variant: 'destructive',
      });
      return;
    }
    setIsSigningIn(true); // Show loader before redirecting
    initiateGoogleSignInWithRedirect(auth).catch((error) => {
        setIsSigningIn(false);
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not start sign-in process.',
          variant: 'destructive',
        });
    });
  };

  // Show a loader if Firebase is still checking the user, or if we're processing a redirect.
  // Also, if the user is logged in, the layout will handle the redirect, but we can show a loader here
  // to prevent the login UI from flashing.
  if (isUserLoading || isSigningIn || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
