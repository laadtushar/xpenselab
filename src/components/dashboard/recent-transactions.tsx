"use client";

import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/icons/category-icon";
import { useMemo } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function RecentTransactions() {
  const { transactions, isLoading } = useFinancials();

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your 5 most recent transactions.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your 5 most recent transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={'bg-secondary'}>
                    {t.type === 'income' ? <TrendingUp className="h-4 w-4 text-primary" /> : <CategoryIcon category={t.category} />}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{t.description}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(t.date), 'MMM d, yyyy')}</p>
                </div>
                <div className={`ml-auto font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
