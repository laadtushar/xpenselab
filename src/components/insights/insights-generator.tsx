
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancials } from "@/context/financial-context";
import { generateInsights, GenerateInsightsOutput } from "@/ai/flows/generate-insights";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function InsightsGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateInsightsOutput | null>(null);
  const { toast } = useToast();
  const { transactions, userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';

  const handleGetInsights = async () => {
    if (transactions.length < 5) {
        toast({
            title: "Not Enough Data",
            description: "You need at least 5 transactions to generate insights.",
            variant: "destructive",
        });
        return;
    }
    
    setIsLoading(true);
    setResult(null);

    try {
      const response = await generateInsights({ transactions });
      setResult(response);
    } catch (error) {
      console.error("AI insights generation failed:", error);
      toast({
        title: "AI Assistant Error",
        description: "Could not generate financial insights at this time.",
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
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Financial Report
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
                ) : ( "Generate Insights" )}
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
