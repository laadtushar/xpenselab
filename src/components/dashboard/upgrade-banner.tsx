"use client";

import { useFinancials } from '@/context/financial-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function UpgradeBanner() {
  const { userData } = useFinancials();
  const [dismissed, setDismissed] = useState(false);
  const isPremium = userData?.tier === 'premium';

  // Don't show if user is premium or banner is dismissed
  if (isPremium || dismissed) {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Unlock Premium Features
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Get AI categorization, receipt scanning, forecasting, and more for just $10/month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/checkout">
              <Button size="sm" className="whitespace-nowrap">
                Upgrade Now
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDismissed(true)}
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
