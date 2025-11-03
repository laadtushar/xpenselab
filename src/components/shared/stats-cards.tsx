
"use client";

import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Loader2, HandCoins, Landmark, HelpCircle } from "lucide-react";
import { useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Debt, Group, SharedExpense } from '@/lib/types';
import { formatCurrency } from "@/lib/utils";
import * as React from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


export function StatsCards() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { incomes, expenses, isLoading: isLoadingFinancials, userData } = useFinancials();

  const { youOwe, youAreOwed, isLoading: isLoadingDebts } = useNetDebts();
  
  const { totalIncome, totalExpenses, savings, adjustedTotalExpenses, adjustedSavings } = useMemo(() => {
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalExpenses;

    // User's logic: treat money you are owed as a temporary expense from a cash flow perspective
    const adjustedTotalExpenses = totalExpenses + youAreOwed;
    const adjustedSavings = totalIncome - adjustedTotalExpenses;
    
    return { totalIncome, totalExpenses, savings, adjustedTotalExpenses, adjustedSavings };
  }, [incomes, expenses, youAreOwed]);
  
  const isLoading = isLoadingFinancials || isLoadingDebts;


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
    <TooltipProvider>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome, userData?.currency)}</div>
          <p className="text-xs text-muted-foreground">All time personal</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Personal Expenses + Money You Are Owed</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(adjustedTotalExpenses, userData?.currency)}</div>
          <p className="text-xs text-muted-foreground">Adjusted for money you've lent</p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Total Income - Adjusted Total Expenses</p>
                    </TooltipContent>
                </Tooltip>
            </div>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(adjustedSavings, userData?.currency)}</div>
          <p className="text-xs text-muted-foreground">Adjusted for lent money</p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Are Owed</CardTitle>
          <HandCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(youAreOwed, userData?.currency)}</div>
           <p className="text-xs text-muted-foreground">From splits & debts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Owe</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(youOwe, userData?.currency)}</div>
          <p className="text-xs text-muted-foreground">From splits & debts</p>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
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
  
  const { data: debtsToUser, isLoading: isLoadingDebtsTo } = useCollection<Debt>(debtsOwedToUserQuery);
  const { data: debtsFromUser, isLoading: isLoadingDebtsFrom } = useCollection<Debt>(debtsOwedByUserQuery);
  
  const [groupBalances, setGroupBalances] = React.useState<{ [key: string]: number }>({});
  const [isLoadingGroupExpenses, setIsLoadingGroupExpenses] = React.useState(false);

  React.useEffect(() => {
    if (!groups || !firestore || !user) return;

    setIsLoadingGroupExpenses(true);
    const promises = groups.map(group => {
        const expensesQuery = query(collection(firestore, 'groups', group.id, 'sharedExpenses'));
        return getDocs(expensesQuery).then(snapshot => ({
            groupId: group.id,
            expenses: snapshot.docs.map(doc => doc.data() as SharedExpense)
        }));
    });

    Promise.all(promises).then(results => {
        const newBalances: { [key: string]: number } = {};
        if (!user) return;

        results.forEach(({ groupId, expenses }) => {
            let userBalance = 0;
            expenses.forEach(expense => {
                if (expense.paidBy === user.uid) {
                    userBalance += expense.amount;
                }
                const userSplit = expense.splits.find(s => s.userId === user.uid);
                if (userSplit) {
                    userBalance -= userSplit.amount;
                }
            });
            newBalances[groupId] = userBalance;
        });
        setGroupBalances(newBalances);
        setIsLoadingGroupExpenses(false);
    });
  }, [groups, firestore, user]);

  const { youOwe, youAreOwed } = useMemo(() => {
    let totalOwedToUser = 0;
    let totalOwedByUser = 0;

    // From individual debts
    totalOwedToUser += debtsToUser?.reduce((sum, debt) => sum + debt.amount, 0) || 0;
    totalOwedByUser += debtsFromUser?.reduce((sum, debt) => sum + debt.amount, 0) || 0;

    // From group splits
    Object.values(groupBalances).forEach(balance => {
        if (balance > 0) {
            totalOwedToUser += balance;
        } else {
            totalOwedByUser += Math.abs(balance);
        }
    });

    return { youAreOwed: totalOwedToUser, youOwe: totalOwedByUser };
  }, [debtsToUser, debtsFromUser, groupBalances]);

  const isLoading = isLoadingGroups || isLoadingDebtsTo || isLoadingDebtsFrom || isLoadingGroupExpenses;

  return { youOwe, youAreOwed, isLoading };
}
