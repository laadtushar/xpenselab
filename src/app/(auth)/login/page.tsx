'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Logo } from '@/components/logo';
import { getRedirectResult } from 'firebase/auth';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    // This effect runs once on page load to check for a redirect result from Google
    if (auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result && result.user) {
            // User has just signed in via redirect.
            // The onAuthStateChanged listener will handle the user object update.
            // We just need to wait for isUserLoading to become false.
          }
        })
        .catch((error) => {
          console.error("Error processing redirect result:", error);
        })
        .finally(() => {
          setIsProcessingRedirect(false);
        });
    } else {
        setIsProcessingRedirect(false);
    }
  }, [auth]);


  useEffect(() => {
    // This effect handles redirection once auth state is confirmed
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = () => {
    if (auth) {
      initiateGoogleSignIn(auth);
    }
  };
  
  if (isUserLoading || isProcessingRedirect || user) {
    return (
       <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
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
          <Button onClick={handleGoogleSignIn} className="w-full" disabled={isUserLoading}>
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
