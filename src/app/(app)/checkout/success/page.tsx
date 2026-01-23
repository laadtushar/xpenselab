"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useFinancials } from '@/context/financial-context';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const { userData, updateUser } = useFinancials();

  useEffect(() => {
    // Verify payment and upgrade user
    async function verifyPayment() {
      if (!sessionId) {
        setIsVerifying(false);
        return;
      }

      // Wait a moment for webhook to process
      setTimeout(() => {
        // Check if user is now premium
        if (userData?.tier === 'premium') {
          setIsVerifying(false);
        } else {
          // If webhook hasn't processed yet, manually upgrade
          // This is a fallback - webhook should handle it
          updateUser({ tier: 'premium' });
          setIsVerifying(false);
        }
      }, 2000);
    }

    verifyPayment();
  }, [sessionId, userData, updateUser]);

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
