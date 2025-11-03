
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Star, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials, useAiRequest } from "@/context/financial-context";
import { budgetingAssistance, BudgetingAssistanceOutput } from "@/ai/flows/budgeting-assistance";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function AiBudgetAssistant() {
  const [result, setResult] = useState<BudgetingAssistanceOutput | null>(null);
  const { toast } = useToast();
  const { incomes, currentMonthExpenses, budget, userData, canMakeAiRequest } = useFinancials();
  const isPremium = userData?.tier === 'premium';
  
  const { makeRequest: makeBudgetingRequest, isLoading } = useAiRequest(budgetingAssistance);

  const { remainingRequests } = useMemo(() => {
    const { remaining } = canMakeAiRequest();
    return { remainingRequests: remaining };
  }, [canMakeAiRequest, userData]);


  const financialData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    const monthlyExpenses = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const monthlyIncome = incomes
      .filter(income => isWithinInterval(new Date(income.date), { start: monthStart, end: monthEnd }))
      .reduce((sum, t) => sum + t.amount, 0);
      
    const spendingCategories = currentMonthExpenses
      .filter(t => t.category)
      .reduce((acc, t) => {
        acc[t.category!] = (acc[t.category!] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return { monthlyIncome, monthlyExpenses, spendingCategories };
  }, [incomes, currentMonthExpenses]);

  const handleGetAdvice = async () => {
    if (!budget) {
      toast({
        title: "Set a Budget First",
        description: "Please set your monthly budget before getting advice.",
        variant: "destructive",
      });
      return;
    }

    setResult(null);

    const response = await makeBudgetingRequest({
        monthlyIncome: financialData.monthlyIncome,
        monthlyExpenses: financialData.monthlyExpenses,
        budgetGoal: budget.amount,
        spendingCategories: financialData.spendingCategories,
    });

    if (response) {
        setResult(response);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Budget Assistant
            </div>
             {isPremium && remainingRequests !== undefined && (
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {remainingRequests} requests left today
                </div>
            )}
        </CardTitle>
        <CardDescription>
          Get personalized advice on your spending habits and budget for the current month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPremium ? (
             <Alert>
                <Star className="h-4 w-4" />
                <AlertTitle>Premium Feature</AlertTitle>
                <AlertDescription>
                    Upgrade to a premium account to unlock the AI Budget Assistant and get personalized financial advice.
                </AlertDescription>
            </Alert>
        ) : !result ? (
          <div className="flex justify-center">
            <Button onClick={handleGetAdvice} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Get Financial Advice"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Assessment</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.assessment}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Recommendations</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.recommendations}</p>
            </div>
            <Button variant="outline" onClick={() => setResult(null)} className="mt-4">
              Clear Advice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    