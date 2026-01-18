
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle, TrendingUp, Star, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials, useAiRequest } from "@/context/financial-context";
import { checkFinancialWellness, FinancialWellnessOutput } from "@/ai/flows/financial-wellness";
import { Progress } from "../ui/progress";
import { startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";


export function FinancialWellness() {
  const [result, setResult] = useState<FinancialWellnessOutput | null>(null);
  const { toast } = useToast();
  const { transactions, incomes, expenses, budget, userData, canMakeAiRequest } = useFinancials();
  const { makeRequest: makeWellnessRequest, isLoading } = useAiRequest(checkFinancialWellness);
  const isPremium = userData?.tier === 'premium';

  const { remainingRequests } = useMemo(() => {
    const { remaining } = canMakeAiRequest();
    return { remainingRequests: remaining };
  }, [canMakeAiRequest, userData]);


  const handleGetWellnessCheck = async () => {
    if (transactions.length < 10) {
      toast({
        title: "Not Enough Data",
        description: "You need at least 10 transactions for an accurate wellness check.",
        variant: "destructive",
      });
      return;
    }

    setResult(null);

    const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const financialSummary = `
        Total Income: ${totalIncome.toFixed(2)}
        Total Expenses: ${totalExpenses.toFixed(2)}
        Savings Rate: ${savingsRate.toFixed(2)}%
        Monthly Budget: ${budget?.amount ? budget.amount.toFixed(2) : 'Not set'}
    `;

    const response = await makeWellnessRequest({
      financialSummary,
    });

    if (response) {
      if (response.success && response.data) {
        setResult(response.data);
      } else if (response.error) {
        toast({
          title: "AI Error",
          description: response.error,
          variant: "destructive",
        });
      }
    }
  };

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Financial Wellness Check</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Star className="h-4 w-4" />
            <AlertTitle>Premium Feature</AlertTitle>
            <AlertDescription>
              Upgrade to a premium account to get your financial wellness score and personalized advice.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            AI Financial Wellness Check
          </div>
          {isPremium && remainingRequests !== undefined && (
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              {remainingRequests} requests left today
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Get a score and personalized advice on your financial health based on your recent activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result && (
          <div className="flex justify-center">
            <Button onClick={handleGetWellnessCheck} disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Check My Wellness</>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Score</p>
              <p className="text-6xl font-bold text-primary">{result.wellnessScore}</p>
              <Progress value={result.wellnessScore} className="mt-4 h-3" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Analysis</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.analysis}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Path to Improvement</h3>
              <ul className="space-y-3">
                {result.recommendations.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 shrink-0" />
                    <span className="text-muted-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleGetWellnessCheck} disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Re-analyzing...</>
                ) : (
                  "Run Analysis Again"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
