
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials } from "@/context/financial-context";
import { predictiveForecast } from "@/ai/flows/predictive-forecast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ForecastChart } from "./forecast-chart";

type ForecastResult = {
  forecast: { date: string; balance: number }[];
  summary: string;
};


export function ForecastGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [scenario, setScenario] = useState("Add a $50 monthly subscription for a gym.");
  const { toast } = useToast();
  const { transactions, incomes, expenses, userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';

  const handleGenerateForecast = async () => {
    if (transactions.length < 5) {
      toast({
        title: "Not Enough Data",
        description: "You need at least 5 transactions to generate a reliable forecast.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
      const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
      const currentBalance = totalIncome - totalExpenses;

      const response = await predictiveForecast({
        transactionsJson: JSON.stringify(transactions, null, 2),
        currentBalance,
        scenario,
        forecastPeriodDays: 90,
      });
      setResult(response);
    } catch (error) {
      console.error("AI forecast generation failed:", error);
      toast({
        title: "AI Assistant Error",
        description: "Could not generate financial forecast at this time.",
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
        <CardTitle>90-Day Financial Forecast</CardTitle>
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
        
        {result && (
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
