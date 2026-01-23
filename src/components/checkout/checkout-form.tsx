"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        toast({
          title: 'Payment failed',
          description: error.message || 'An error occurred during payment',
          variant: 'destructive',
        });
        setIsLoading(false);
        setIsProcessing(false);
      } else {
        // Payment succeeded, redirect will happen automatically
        toast({
          title: 'Payment successful!',
          description: 'You are being upgraded to Premium...',
        });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: 'Payment error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isLoading || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Subscribe to Premium - $10/month
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        You'll be charged $10/month. Cancel anytime from your account settings.
      </p>
    </form>
  );
}
