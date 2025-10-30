'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase/provider';
import { signInWithGooglePopup } from '@/firebase/non-blocking-login';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { UserCredential } from 'firebase/auth';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  console.log('LoginPage Render:', { isUserLoading, user: !!user, isSigningIn });

  useEffect(() => {
    // This effect handles redirection to the dashboard AFTER auth state is confirmed.
    if (!isUserLoading && user) {
      console.log('Login successful, redirecting to dashboard...');
      router.push('/dashboard');
    } else {
        console.log('Not redirecting:', { isUserLoading, user: !!user });
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (auth) {
      setIsSigningIn(true);
      console.log('Initiating Google sign-in with popup...');
      try {
        const result: UserCredential | void = await signInWithGooglePopup(auth);
        if (result) {
            console.log('Sign-in with popup successful:', result.user.email);
            // The onAuthStateChanged listener in useUser will now handle the update
            // and the useEffect above will trigger the redirect.
        } else {
            // This might happen if the popup is closed before completion.
            console.log('Sign-in popup closed or failed without error.');
        }
      } catch (error) {
        console.error("Google sign-in error:", error);
      } finally {
        setIsSigningIn(false);
        console.log('Sign-in process finished.');
      }
    } else {
        console.error("Auth service is not available.");
    }
  };

  // The loading screen should be active if:
  // 1. Firebase is still checking the initial auth state (`isUserLoading`).
  // 2. We are actively processing a sign-in click (`isSigningIn`).
  const showLoader = isUserLoading || isSigningIn;
  
  if (showLoader) {
    return (
       <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  // If we are done loading and there IS a user, we are about to redirect.
  // Showing a loader here prevents a flash of the login page.
  if (user) {
     return (
       <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Redirecting...</p>
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
          <Button onClick={handleGoogleSignIn} className="w-full" disabled={isSigningIn}>
            {isSigningIn ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
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
