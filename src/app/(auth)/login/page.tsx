'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateGoogleSignInWithPopup, initiateGitHubSignInWithPopup } from '@/firebase/non-blocking-login';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      // Reset signing in state when user becomes available (auth completed)
      setIsSigningIn(false);
      router.push('/dashboard');
    }
  }, [isUserLoading, user, router]);

  // Reset signing state if user is not loading and no user (in case of stuck state)
  useEffect(() => {
    if (!isUserLoading && !user && isSigningIn) {
      // If we've been signing in for more than 2 minutes, reset
      const timeout = setTimeout(() => {
        console.warn('[LoginPage] Sign-in state stuck, resetting...');
        setIsSigningIn(false);
      }, 120000); // 2 minutes
      
      return () => clearTimeout(timeout);
    }
  }, [isUserLoading, user, isSigningIn]);

  // Note: With native plugin, OAuth redirects are handled automatically
  // No need for manual redirect handling or listeners

  const handleGoogleSignIn = async () => {
    if (!auth || isSigningIn) return;
    setIsSigningIn(true);
    
    try {
      console.log('[LoginPage] Starting Google sign-in...');
      const result = await Promise.race([
        initiateGoogleSignInWithPopup(auth),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign-in timeout after 60 seconds')), 60000)
        )
      ]) as any;
      
      if (result) {
        console.log('[LoginPage] Google sign-in successful:', result.user?.email);
        toast({ title: 'Sign-in successful!', description: `Welcome, ${result.user.displayName || result.user.email}` });
      }
    } catch (error: any) {
      console.error('[LoginPage] Google Sign-In failed:', error);
      console.error('[LoginPage] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Always reset signing state on error
      setIsSigningIn(false);
      
      // Ignore COOP-related errors as they're just warnings
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not complete sign-in process.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleGitHubSignIn = async () => {
    if (!auth || isSigningIn) return;
    setIsSigningIn(true);
    
    try {
      console.log('[LoginPage] Starting GitHub sign-in...');
      const result = await Promise.race([
        initiateGitHubSignInWithPopup(auth),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign-in timeout after 60 seconds')), 60000)
        )
      ]) as any;
      
      if (result) {
        console.log('[LoginPage] GitHub sign-in successful:', result.user?.email);
        toast({ title: 'Sign-in successful!', description: `Welcome, ${result.user.displayName || result.user.email}` });
      }
    } catch (error: any) {
      console.error('[LoginPage] GitHub Sign-In failed:', error);
      console.error('[LoginPage] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Always reset signing state on error
      setIsSigningIn(false);
      
      // Ignore COOP-related errors as they're just warnings
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
          title: 'Sign-In Failed',
          description: error.message || 'Could not start sign-in process.',
          variant: 'destructive',
        });
      }
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="horizontal" showText={true} />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your finances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full" disabled={isSigningIn}>
                {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.8S111.8 17.6 244 17.6c70.2 0 121.5 27.2 166.4 69.5l-67.5 64.8C296.1 112.3 268.4 96 244 96c-59.6 0-108.2 48.6-108.2 108.2s48.6 108.2 108.2 108.2c68.2 0 97.9-53.2 101-82.3H244v-73.3h239.3c5 27.2 7.7 54.3 7.7 85.8z"></path>
                </svg>}
                Sign in with Google
            </Button>
            <Button onClick={handleGitHubSignIn} className="w-full" variant="secondary" disabled={isSigningIn}>
                {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                <path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3.3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.3-11.1-29.9 2.6-62.3 0 0 21.6-6.9 70.7 26.3 20.9-5.8 43.8-8.7 66.5-8.7 22.7 0 45.6 2.9 66.5 8.7 49.1-33.2 70.7-26.3 70.7-26.3 13.7 32.4 5.2 56 2.6 62.3 16 17.6 23.6 31.4 23.6 58.9 0 96.5-58.7 127.5-114.2 138.9 9.3 7.9 17.6 23.7 17.6 45.9 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
                </svg>}
                Sign in with GitHub
            </Button>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
