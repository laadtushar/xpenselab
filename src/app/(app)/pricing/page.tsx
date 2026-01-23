"use client";

import { useFinancials } from '@/context/financial-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Check, Crown } from 'lucide-react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/shared/dashboard-header';

export default function PricingPage() {
  const { userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';

  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Pricing">
        {isPremium && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span>You're on Premium</span>
          </div>
        )}
      </DashboardHeader>

      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Choose Your Plan</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          {isPremium 
            ? "You're currently on Premium. Manage your subscription from settings."
            : "Choose the plan that's right for you. Get started for free."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Basic</CardTitle>
            <CardDescription>For individuals getting started with managing their finances.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-4xl font-bold">Free</p>
            <ul className="space-y-2">
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Track Income & Expenses</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Manual Budgeting</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Expense Splitting</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Bank-Grade Encryption</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Recurring Transactions</li>
            </ul>
          </CardContent>
          <CardFooter>
            {isPremium ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Your Current Plan
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className={`border-primary flex flex-col ${isPremium ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Premium</CardTitle>
              {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
            </div>
            <CardDescription>Unlock powerful AI features and advanced controls.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p><span className="text-4xl font-bold">$10</span><span className="text-muted-foreground">/month</span></p>
            <ul className="space-y-2">
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Everything in Basic</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />AI Expense Categorization</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />AI Budgeting Assistant</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />AI Financial Insights</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Receipt Scanning</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Predictive Forecasting</li>
            </ul>
          </CardContent>
          <CardFooter>
            {isPremium ? (
              <Button className="w-full" disabled>
                Active Subscription
              </Button>
            ) : (
              <Link href="/checkout" className={buttonVariants({ className: "w-full" })}>
                Upgrade to Premium
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
