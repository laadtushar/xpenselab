"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials } from "@/context/financial-context";
import { budgetingAssistance, BudgetingAssistanceOutput } from "@/ai/flows/budgeting-assistance";

export function AiBudgetAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BudgetingAssistanceOutput | null>(null);
  const { toast } = useToast();
  const { transactions, budget } = useFinancials();

  const financialData = useMemo(() => {
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Assuming a static monthly income for now, can be improved
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const spendingCategories = transactions
      .filter(t => t.type === 'expense' && t.category)
      .reduce((acc, t) => {
        acc[t.category!] = (acc[t.category!] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return { monthlyIncome, monthlyExpenses, spendingCategories };
  }, [transactions]);

  const handleGetAdvice = async () => {
    if (!budget) {
      toast({
        title: "Set a Budget First",
        description: "Please set your monthly budget before getting advice.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await budgetingAssistance({
        monthlyIncome: financialData.monthlyIncome,
        monthlyExpenses: financialData.monthlyExpenses,
        budgetGoal: budget.amount,
        spendingCategories: financialData.spendingCategories,
      });
      setResult(response);
    } catch (error) {
      console.error("AI budgeting assistance failed:", error);
      toast({
        title: "AI Assistant Error",
        description: "Could not get budgeting advice at this time.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Budget Assistant
        </CardTitle>
        <CardDescription>
          Get personalized advice on your spending habits and budget.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && (
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
        )}
        {result && (
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
