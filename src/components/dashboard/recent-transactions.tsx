"use client";

import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/icons/category-icon";
import { useMemo } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export function RecentTransactions() {
  const { transactions, isLoading, userData } = useFinancials();

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

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
    <Card className="w-full min-w-0 max-w-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your 5 most recent transactions.</CardDescription>
      </CardHeader>
      <CardContent className="w-full min-w-0 max-w-full">
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground -mx-2 px-2 py-1 rounded-md min-w-0 w-full">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className={'bg-secondary'}>
                    {t.type === 'income' ? <TrendingUp className="h-4 w-4 text-primary" /> : <CategoryIcon categoryName={t.category} />}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none truncate">{t.description}</p>
                  <p className="text-sm text-muted-foreground truncate">{format(new Date(t.date), 'MMM d, yyyy')}</p>
                </div>
                <div className={`ml-auto font-medium shrink-0 text-sm sm:text-base ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, userData?.currency)}
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
