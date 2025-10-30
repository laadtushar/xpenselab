
"use client";

import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Loader2, HandCoins, Landmark } from "lucide-react";
import { useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Group, SharedExpense } from '@/lib/types';
import { formatCurrency } from "@/lib/utils";

export function StatsCards() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { incomes, expenses, isLoading: isLoadingFinancials } = useFinancials();

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'groups'), where('members', 'array-contains', user.uid));
  }, [firestore, user?.uid]);

  const { data: groups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);
  const { totalIncome, totalExpenses, savings } = useMemo(() => {
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, savings };
  }, [incomes, expenses]);

  const { youOwe, youAreOwed, isLoading: isLoadingDebts } = useNetDebts();
  
  const isLoading = isLoadingFinancials || isLoadingGroups || isLoadingDebts;


  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 flex items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
          <p className="text-xs text-muted-foreground">All time personal</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">All time personal</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(savings)}</div>
          <p className="text-xs text-muted-foreground">All time personal</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Are Owed</CardTitle>
          <HandCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(youAreOwed)}</div>
           <p className="text-xs text-muted-foreground">From splits & debts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Owe</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(youOwe)}</div>
          <p className="text-xs text-muted-foreground">From splits & debts</p>
        </CardContent>
      </Card>
    </div>
  );
}

function useNetDebts() {
  const { user } = useUser();
  const firestore = useFirestore();

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'groups'), where('members', 'array-contains', user.uid));
  }, [firestore, user?.uid]);

  const { data: groups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

  const debtsOwedToUserQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'debts'), where('toUserId', '==', user.uid), where('settled', '==', false));
  }, [user, firestore]);

  const debtsOwedByUserQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'debts'), where('fromUserId', '==', user.uid), where('settled', '==', false));
  }, [user, firestore]);
  
  const { data: debtsToUser, isLoading: isLoadingDebtsTo } = useCollection(debtsOwedToUserQuery);
  const { data: debtsFromUser, isLoading: isLoadingDebtsFrom } = useCollection(debtsOwedByUserQuery);

  // This is a rough approximation. A full implementation would need to fetch all expenses for all groups.
  // For this UX, we'll just use the individual debts.
  const { youOwe, youAreOwed } = useMemo(() => {
    const owedTo = debtsToUser?.reduce((sum, debt) => sum + debt.amount, 0) || 0;
    const owedFrom = debtsFromUser?.reduce((sum, debt) => sum + debt.amount, 0) || 0;
    return { youAreOwed: owedTo, youOwe: owedFrom };
  }, [debtsToUser, debtsFromUser]);

  return { youOwe, youAreOwed, isLoading: isLoadingGroups || isLoadingDebtsTo || isLoadingDebtsFrom };
}
