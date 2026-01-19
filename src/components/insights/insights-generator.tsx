
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle, Star, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials, useAiRequest } from "@/context/financial-context";
import { generateInsights, GenerateInsightsOutput } from "@/ai/flows/generate-insights";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { formatCurrency } from "@/lib/utils";

export function InsightsGenerator() {
  const [result, setResult] = useState<GenerateInsightsOutput | null>(null);
  const { toast } = useToast();
  const { transactions, incomes, expenses, userData, canMakeAiRequest } = useFinancials();
  const { makeRequest: makeInsightsRequest, isLoading } = useAiRequest(generateInsights);
  const isPremium = userData?.tier === 'premium';

  const { remainingRequests } = useMemo(() => {
    const { remaining } = canMakeAiRequest();
    return { remainingRequests: remaining };
  }, [canMakeAiRequest, userData]);

  const handleGetInsights = async () => {
    if (transactions.length < 5) {
      toast({
        title: "Not Enough Data",
        description: "You need at least 5 transactions to generate insights.",
        variant: "destructive",
      });
      return;
    }

    setResult(null);

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const spendingByCategory = expenses
      .reduce((acc, t) => {
        const category = t.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => `${name}: ${formatCurrency(amount, userData?.currency)}`)
      .join(', ');

    const summary = `
      Total Income: ${formatCurrency(totalIncome, userData?.currency)}
      Total Expenses: ${formatCurrency(totalExpenses, userData?.currency)}
      Top Spending Categories: ${topCategories}
    `;

    const response = await makeInsightsRequest({ 
      financialSummary: summary,
      currency: userData?.currency || 'USD'
    });

    if (response) {
      if (response.success && response.data) {
        setResult(response.data);
      } else if (response.error) {
        toast({
          title: "AI Analysis Error",
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
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Financial Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Star className="h-4 w-4" />
            <AlertTitle>Premium Feature</AlertTitle>
            <AlertDescription>
              Upgrade to a premium account to unlock AI-powered financial insights and personalized suggestions.
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
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Financial Report
          </div>
          {isPremium && remainingRequests !== undefined && (
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              {remainingRequests} requests left today
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Let AI analyze your spending and income to provide a summary and actionable suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Button onClick={handleGetInsights} disabled={isLoading || !!result}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
            ) : ("Generate Insights")}
          </Button>
        </div>

        {result && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Financial Summary</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Actionable Suggestions</h3>
              <ul className="space-y-3">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 shrink-0" />
                    <span className="text-muted-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setResult(null)}>
                Generate New Report
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
