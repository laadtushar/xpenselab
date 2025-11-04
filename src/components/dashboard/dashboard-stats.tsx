
'use client';

import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Loader2, HandCoins, Landmark, HelpCircle, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Debt, Group, SharedExpense } from '@/lib/types';
import { formatCurrency } from "@/lib/utils";
import * as React from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


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


const StatCard = ({ title, value, description, icon: Icon, tooltip }: { title: string, value: string, description: string, icon: React.ElementType, tooltip?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="flex items-center gap-1">
                {tooltip && (
                    <Tooltip>
                        <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent><p>{tooltip}</p></TooltipContent>
                    </Tooltip>
                )}
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const StatComparisonCard = ({ title, actualValue, netValue, actualDescription, netDescription }: { title: string, actualValue: string, netValue: string, actualDescription: string, netDescription: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
            <div>
                <div className="text-2xl font-bold">{actualValue}</div>
                <p className="text-xs text-muted-foreground">{actualDescription}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mx-4" />
            <div>
                <div className="text-2xl font-bold">{netValue}</div>
                <p className="text-xs text-muted-foreground">{netDescription}</p>
            </div>
        </CardContent>
    </Card>
);


export function DashboardStats() {
  const { incomes, expenses, isLoading: isLoadingFinancials, userData } = useFinancials();
  const { youOwe, youAreOwed, isLoading: isLoadingDebts } = useNetDebts();

  const {
    actualIncome,
    netIncome,
    actualExpenses,
    netExpenses,
    actualSavings,
    netSavings,
  } = useMemo(() => {
    const actualIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const actualExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = actualIncome - youOwe;
    const netExpenses = actualExpenses + youAreOwed;

    const actualSavings = actualIncome - actualExpenses;
    const netSavings = netIncome - netExpenses;
    
    return { actualIncome, netIncome, actualExpenses, netExpenses, actualSavings, netSavings };
  }, [incomes, expenses, youOwe, youAreOwed]);
  
  const isLoading = isLoadingFinancials || isLoadingDebts;


  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardHeader><CardTitle className="text-sm font-medium">Loading...</CardTitle></CardHeader>
                <CardContent><div className="h-10 flex items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></CardContent>
            </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
        <div className="grid gap-4 md:grid-cols-3">
           <StatComparisonCard
             title="Income"
             actualValue={formatCurrency(actualIncome, userData?.currency)}
             actualDescription="Cash received"
             netValue={formatCurrency(netIncome, userData?.currency)}
             netDescription="After deducting what you owe"
           />
           <StatComparisonCard
             title="Expenses"
             actualValue={formatCurrency(actualExpenses, userData?.currency)}
             actualDescription="Personal spending"
             netValue={formatCurrency(netExpenses, userData?.currency)}
             netDescription="Including money you lent"
           />
           <StatComparisonCard
             title="Savings"
             actualValue={formatCurrency(actualSavings, userData?.currency)}
             actualDescription="Actual cash left"
             netValue={formatCurrency(netSavings, userData?.currency)}
             netDescription="After all liabilities"
           />
        </div>
    </TooltipProvider>
  );
}

