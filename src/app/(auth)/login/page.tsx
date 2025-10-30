
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
  console.log('LoginPage: Component rendered.');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('LoginPage useEffect [auth, toast, isUserLoading]: Running...');
    console.log(`LoginPage useEffect: isUserLoading is ${isUserLoading}`);

    const processRedirect = async () => {
      console.log('LoginPage processRedirect: Starting...');
      if (auth) {
        console.log('LoginPage processRedirect: auth object is available.');
        try {
          const result = await getGoogleRedirectResult(auth);
          console.log('LoginPage processRedirect: getGoogleRedirectResult returned:', result);
          if (result) {
            console.log('LoginPage processRedirect: Successfully signed in user:', result.user.email);
            // If result is not null, a sign-in was successful.
            // The onAuthStateChanged listener in the main layout will now handle it.
            // We don't need to do anything else here; the layout will redirect.
          } else {
            console.log('LoginPage processRedirect: No redirect result found. This is normal on first load.');
          }
        } catch (error: any) {
          console.error('LoginPage processRedirect: Google sign-in redirect error:', error);
          if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            toast({
              title: 'Sign-In Failed',
              description: error.message || 'An unexpected error occurred during sign-in.',
              variant: 'destructive',
            });
          }
        } finally {
          console.log('LoginPage processRedirect: Finished processing redirect.');
          setIsProcessingRedirect(false);
        }
      } else {
        console.log('LoginPage processRedirect: auth object not yet available.');
        setIsProcessingRedirect(false); // Auth not ready, stop processing for now.
      }
    };

    // Only process redirect if Firebase Auth is not in its initial loading state.
    if (!isUserLoading) {
      processRedirect();
    } else {
        console.log('LoginPage useEffect: Waiting for isUserLoading to be false before processing redirect.');
    }
  }, [auth, toast, isUserLoading]);

  // This effect handles navigation *after* all auth state checks are complete.
  useEffect(() => {
    console.log('LoginPage useEffect [user, isUserLoading, isProcessingRedirect, router]: Running...');
    console.log(`LoginPage useEffect: user=${!!user}, isUserLoading=${isUserLoading}, isProcessingRedirect=${isProcessingRedirect}`);
    // If auth is loaded, redirect is processed, and we have a user, go to dashboard.
    if (!isUserLoading && !isProcessingRedirect && user) {
      console.log('LoginPage useEffect: Conditions met, redirecting to /dashboard');
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isProcessingRedirect, router]);

  const handleGoogleSignIn = async () => {
    console.log('handleGoogleSignIn: Clicked.');
    if (!auth) {
      console.error('handleGoogleSignIn: Auth service not available.');
      toast({
        title: 'Authentication Error',
        description: 'Firebase Auth service is not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }
    setIsSigningIn(true);
    console.log('handleGoogleSignIn: Initiating Google sign-in with redirect.');
    await initiateGoogleSignInWithRedirect(auth).catch(error => {
        console.error("handleGoogleSignIn: Redirection failed", error);
        toast({
            title: "Sign-In Error",
            description: "Could not redirect to Google for sign-in.",
            variant: "destructive",
        });
        setIsSigningIn(false);
    });
  };
  
  console.log(`LoginPage render: isUserLoading=${isUserLoading}, isProcessingRedirect=${isProcessingRedirect}, user=${!!user}`);

  // Show a full-page loader while Firebase determines the initial auth state
  // or while we are processing a sign-in redirect.
  if (isUserLoading || isProcessingRedirect) {
    console.log('LoginPage render: Showing full-page loader.');
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // If we have a user object, it means we are logged in. The effect above
  // will redirect to the dashboard. Show a message in the meantime.
  if (user) {
     console.log('LoginPage render: User object exists, showing redirecting message.');
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Redirecting to dashboard...</p>
      </div>
    );
  }

  // Only render the login form if all checks are done and there is no user.
  console.log('LoginPage render: All checks complete, no user. Showing login form.');
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
