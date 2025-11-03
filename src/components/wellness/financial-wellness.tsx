
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle, TrendingUp, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials } from "@/context/financial-context";
import { checkFinancialWellness } from "@/ai/flows/financial-wellness";
import { Progress } from "../ui/progress";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type WellnessResult = {
  wellnessScore: number;
  analysis: string;
  recommendations: string[];
};

export function FinancialWellness() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WellnessResult | null>(null);
  const { toast } = useToast();
  const { transactions, incomes, expenses, budget, userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';

  const handleGetWellnessCheck = async () => {
    if (transactions.length < 10) {
      toast({
        title: "Not Enough Data",
        description: "You need at least 10 transactions for an accurate wellness check.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const currentMonthTransactions = transactions.filter(t => isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }));

      const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
      const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);

      const response = await checkFinancialWellness({
        transactionsJson: JSON.stringify(currentMonthTransactions, null, 2),
        totalIncome,
        totalExpenses,
        monthlyBudget: budget?.amount,
      });
      setResult(response);
    } catch (error) {
      console.error("AI wellness check failed:", error);
      toast({
        title: "AI Assistant Error",
        description: "Could not perform financial wellness check at this time.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        <CardTitle>AI Financial Wellness Check</CardTitle>
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
                {result.recommendations.map((suggestion, index) => (
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
