"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { Logo } from '@/components/logo';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function redirectToCheckout() {
      if (!auth?.currentUser) {
        router.push('/login');
        return;
      }

      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe Checkout
        const stripe = await stripePromise;
        if (stripe) {
          const { error: redirectError } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });

          if (redirectError) {
            throw new Error(redirectError.message);
          }
        }
      } catch (err: any) {
        console.error('Error creating checkout session:', err);
        setError(err.message || 'Failed to initialize checkout');
        setLoading(false);
      }
    }

    redirectToCheckout();
  }, [auth, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo variant="stacked" showText={true} />
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Redirecting to checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/pricing')}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
