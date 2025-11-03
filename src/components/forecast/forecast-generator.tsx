
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Star, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials, useAiRequest } from "@/context/financial-context";
import { predictiveForecast, PredictiveForecastOutput } from "@/ai/flows/predictive-forecast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ForecastChart } from "./forecast-chart";
import { isSameDay, differenceInDays } from "date-fns";

export function ForecastGenerator() {
  const [result, setResult] = useState<PredictiveForecastOutput | null>(null);
  const [scenario, setScenario] = useState("Add a $50 monthly subscription for a gym.");
  const { toast } = useToast();
  const { transactions, incomes, expenses, userData, canMakeAiRequest } = useFinancials();
  const { makeRequest: makeForecastRequest, isLoading } = useAiRequest(predictiveForecast);

  const isPremium = userData?.tier === 'premium';
  
  const { remainingRequests } = useMemo(() => {
    const { remaining } = canMakeAiRequest();
    return { remainingRequests: remaining };
  }, [canMakeAiRequest, userData]);


  const handleGenerateForecast = async () => {
    if (transactions.length < 5) {
      toast({
        title: "Not Enough Data",
        description: "You need at least 5 transactions to generate a reliable forecast.",
        variant: "destructive",
      });
      return;
    }

    setResult(null);
    const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
    const currentBalance = totalIncome - totalExpenses;
    
    // Basic analysis on the client
    const firstDate = new Date(transactions[transactions.length - 1].date);
    const lastDate = new Date(transactions[0].date);
    const days = differenceInDays(lastDate, firstDate) || 1;
    const avgDailyIncome = totalIncome / days;
    const avgDailyExpense = totalExpenses / days;
    
    const recurringExpenses = transactions.filter(t => t.description.match(/subscription|monthly|yearly/i));

    const analysis = `
      Current Balance: ${currentBalance.toFixed(2)}
      Average Daily Income: ${avgDailyIncome.toFixed(2)}
      Average Daily Expense: ${avgDailyExpense.toFixed(2)}
      Potential Recurring Expenses: ${recurringExpenses.map(t => t.description).join(', ')}
    `;

    const response = await makeForecastRequest({
      financialSummary: analysis,
      userScenario: scenario,
    });
    
    if (response) {
      setResult(response);
    }
  };

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>90-Day Financial Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Star className="h-4 w-4" />
            <AlertTitle>Premium Feature</AlertTitle>
            <AlertDescription>
              Upgrade to a premium account to unlock predictive forecasting and "what-if" scenarios.
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
            90-Day Financial Forecast
          </div>
           {isPremium && remainingRequests !== undefined && (
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {remainingRequests} requests left today
                </div>
            )}
        </CardTitle>
        <CardDescription>
          Enter a "what-if" scenario to see how it might impact your future finances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="scenario">"What-If" Scenario</Label>
          <Input
            id="scenario"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="e.g., What if I get a 10% raise?"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-center">
          <Button onClick={handleGenerateForecast} disabled={isLoading || !scenario}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Forecast...</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Generate Forecast</>
            )}
          </Button>
        </div>
        
        {result && result.forecast?.length > 0 && (
          <div className="space-y-6">
            <Alert>
              <AlertTitle>Forecast Summary</AlertTitle>
              <AlertDescription>{result.summary}</AlertDescription>
            </Alert>
            <ForecastChart data={result.forecast} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
