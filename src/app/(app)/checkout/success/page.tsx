"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useFinancials } from '@/context/financial-context';
import { useAuth } from '@/firebase';
import Link from 'next/link';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const { userData } = useFinancials();
  const auth = useAuth();
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Verify payment and upgrade user
    async function verifyPayment() {
      if (!sessionId) {
        setError('No session ID provided');
        setIsVerifying(false);
        return;
      }

      if (!auth?.currentUser) {
        router.push('/login');
        return;
      }

      // Prevent multiple verification attempts
      if (verificationAttempted.current) return;
      verificationAttempted.current = true;

      try {
        // Get fresh ID token
        const idToken = await auth.currentUser.getIdToken();
        
        // Verify checkout session with Stripe
        const response = await fetch('/api/verify-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId, idToken }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify checkout session');
        }

        // Payment is verified, now wait for userData to update
        setIsVerified(true);
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.message || 'Failed to verify payment');
        setIsVerifying(false);
        return;
      }
    }

    verifyPayment();
  }, [sessionId, auth, router]);

  // Poll for userData tier update after verification
  useEffect(() => {
    if (!isVerified || userData?.tier === 'premium') {
      if (isVerified && userData?.tier === 'premium') {
        setIsVerifying(false);
      }
      return;
    }

    // Poll for tier update (Firestore listener should update userData)
    const checkInterval = setInterval(() => {
      if (userData?.tier === 'premium') {
        setIsVerifying(false);
        clearInterval(checkInterval);
      }
    }, 1000);

    // Timeout after MAX_RETRIES * RETRY_DELAY
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (userData?.tier !== 'premium') {
        setError('Payment verified but subscription status is not updating. Please refresh the page or contact support.');
        setIsVerifying(false);
      }
    }, MAX_RETRIES * RETRY_DELAY);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [isVerified, userData]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo variant="stacked" showText={true} />
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Verification Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh Page
              </Button>
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Welcome to Premium!</CardTitle>
          <CardDescription>
            Your subscription is active. You now have access to all premium features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h3 className="font-semibold">What's included:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ AI Expense Categorization</li>
              <li>✓ AI Budgeting Assistant</li>
              <li>✓ AI Financial Insights</li>
              <li>✓ Receipt Scanning</li>
              <li>✓ Predictive Forecasting</li>
            </ul>
          </div>
          <Link href="/dashboard" className="block">
            <Button className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
