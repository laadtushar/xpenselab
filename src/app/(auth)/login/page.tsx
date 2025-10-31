'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateGoogleSignInWithRedirect, getRedirectResult, initiateGitHubSignInWithRedirect } from '@/firebase/non-blocking-login';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('LoginPage: Mount/Auth changed. isUserLoading:', isUserLoading);

    if (!auth) {
      console.log('LoginPage: Auth service not available yet. Waiting.');
      // Keep processing until auth is available.
      return;
    }
    
    // Only process redirect result once.
    if (isProcessingRedirect) {
      console.log('LoginPage: Starting to process redirect result.');
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('LoginPage: getRedirectResult SUCCESS. User:', result.user?.email);
            // The user object will be updated by the global onAuthStateChanged listener,
            // so we don't need to set it here. The effect below will handle the redirect.
          } else {
            console.log('LoginPage: getRedirectResult returned null (no redirect operation to process).');
          }
        })
        .catch((error) => {
          console.error('LoginPage: getRedirectResult ERROR:', error);
          toast({
            title: 'Sign-In Failed',
            description: error.message || 'Could not complete sign-in from redirect.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          console.log('LoginPage: Finished processing redirect result.');
          setIsProcessingRedirect(false);
        });
    }

  }, [auth, isProcessingRedirect, toast]);

  useEffect(() => {
    console.log('LoginPage: User state check. isUserLoading:', isUserLoading, 'isProcessingRedirect:', isProcessingRedirect, 'User:', !!user);
    // Only redirect when we are certain about the auth state AND the redirect has been processed.
    if (!isUserLoading && !isProcessingRedirect && user) {
      console.log('LoginPage: User is loaded and redirect is processed. Redirecting to /dashboard.');
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
    console.log('LoginPage: Initiating Google Sign-In.');
    initiateGoogleSignInWithRedirect(auth).catch((error) => {
        console.error('LoginPage: Google Sign-In initiation failed:', error);
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not start sign-in process.',
          variant: 'destructive',
        });
    });
  };

  const handleGitHubSignIn = () => {
    if (!auth) {
      toast({
        title: 'Authentication Error',
        description: 'Firebase Auth service is not available.',
        variant: 'destructive',
      });
      return;
    }
    console.log('LoginPage: Initiating GitHub Sign-In.');
    initiateGitHubSignInWithRedirect(auth).catch((error) => {
        console.error('LoginPage: GitHub Sign-In initiation failed:', error);
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not start sign-in process.',
          variant: 'destructive',
        });
    });
  };

  // Show a comprehensive loading screen while Firebase is initializing,
  // the redirect is being processed, or the user object is loading post-redirect.
  if (isUserLoading || isProcessingRedirect) {
    console.log('LoginPage: Rendering loading screen. isUserLoading:', isUserLoading, 'isProcessingRedirect:', isProcessingRedirect);
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // This helps prevent a flash of the login page if the redirect to dashboard is imminent.
  if (user) {
    console.log('LoginPage: User exists, but waiting for redirect effect. Rendering loader.');
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  console.log('LoginPage: Rendering login form.');
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Welcome to XpenseLab</CardTitle>
          <CardDescription>Sign in to manage your expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoogleSignIn} className="w-full">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.8S111.8 17.6 244 17.6c70.2 0 121.5 27.2 166.4 69.5l-67.5 64.8C296.1 112.3 268.4 96 244 96c-59.6 0-108.2 48.6-108.2 108.2s48.6 108.2 108.2 108.2c68.2 0 97.9-53.2 101-82.3H244v-73.3h239.3c5 27.2 7.7 54.3 7.7 85.8z"></path>
            </svg>
            Sign in with Google
          </Button>
          <Button onClick={handleGitHubSignIn} className="w-full" variant="secondary">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
              <path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3.3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.3-11.1-29.9 2.6-62.3 0 0 21.6-6.9 70.7 26.3 20.9-5.8 43.8-8.7 66.5-8.7 22.7 0 45.6 2.9 66.5 8.7 49.1-33.2 70.7-26.3 70.7-26.3 13.7 32.4 5.2 56 2.6 62.3 16 17.6 23.6 31.4 23.6 58.9 0 96.5-58.7 127.5-114.2 138.9 9.3 7.9 17.6 23.7 17.6 45.9 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
            </svg>
            Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
