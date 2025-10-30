
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

  // Effect to process the redirect result from Google Sign-In
  useEffect(() => {
    console.log('[Login Page] Mount/Auth-change effect. isUserLoading:', isUserLoading, 'auth ready:', !!auth);
    if (auth && !isUserLoading) {
      console.log('[Login Page] Auth service is ready. Calling getGoogleRedirectResult.');
      getGoogleRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('[Login Page] getGoogleRedirectResult successful. User:', result.user.email);
          } else {
            console.log('[Login Page] getGoogleRedirectResult returned null (no redirect active).');
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
          console.log('[Login Page] Finished processing redirect. Setting isProcessingRedirect to false.');
          setIsProcessingRedirect(false);
        });
    } else if (!isUserLoading) {
        console.log('[Login Page] Auth not ready, but user loading finished. Setting isProcessingRedirect to false.');
        setIsProcessingRedirect(false);
    }
  }, [auth, isUserLoading, toast]);


  // This effect handles navigation *after* all auth state checks are complete.
  useEffect(() => {
    console.log('[Login Page] Navigation effect. isUserLoading:', isUserLoading, 'isProcessingRedirect:', isProcessingRedirect, 'user:', !!user);
    if (!isUserLoading && !isProcessingRedirect && user) {
      console.log('[Login Page] All checks passed, user exists. Redirecting to /dashboard.');
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isProcessingRedirect, router]);


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
    console.log('[Login Page] Initiating Google Sign-In with redirect.');
    setIsSigningIn(true);
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

  if (isUserLoading || isProcessingRedirect) {
    console.log('[Login Page] Render: Showing main loader. isUserLoading:', isUserLoading, 'isProcessingRedirect:', isProcessingRedirect);
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
   if (user) {
     console.log('[Login Page] Render: User object exists, showing redirecting message.');
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Redirecting to dashboard...</p>
      </div>
    );
  }

  console.log('[Login Page] Render: Showing login UI.');
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
