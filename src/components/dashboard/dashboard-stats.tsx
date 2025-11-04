
'use client';

import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, HelpCircle } from "lucide-react";
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

const StatComparisonCard = ({ title, value1, value2, description1, description2, tooltipContent }: { title: string, value1: string, value2: string, description1: string, description2: string, tooltipContent?: React.ReactNode }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        {title}
                        {tooltipContent && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold">{value1}</div>
                        <p className="text-xs text-muted-foreground">{description1}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mx-4" />
                    <div>
                        <div className="text-2xl font-bold">{value2}</div>
                        <p className="text-xs text-muted-foreground">{description2}</p>
                    </div>
                </CardContent>
            </Card>
        </TooltipTrigger>
        {tooltipContent && <TooltipContent>{tooltipContent}</TooltipContent>}
    </Tooltip>
);


export function DashboardStats() {
  const { incomes, expenses, isLoading: isLoadingFinancials, userData } = useFinancials();
  const { youOwe, youAreOwed, isLoading: isLoadingDebts } = useNetDebts();

  const {
    actualIncome,
    netIncome,
    actualExpenses,
    netExpenses,
    actualCashLeft,
    finalNetSavings,
  } = useMemo(() => {
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalPersonalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // User's specified formulas
    const actualCashLeft = (totalIncome - totalPersonalExpenses) - youAreOwed;
    const finalNetSavings = actualCashLeft + youAreOwed - youOwe;

    return { 
        actualIncome: totalIncome,
        netIncome: totalIncome - youOwe,
        actualExpenses: totalPersonalExpenses,
        netExpenses: totalPersonalExpenses + youAreOwed,
        actualCashLeft,
        finalNetSavings
    };
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
             value1={formatCurrency(actualIncome, userData?.currency)}
             description1="Actual Income = Total Income"
             value2={formatCurrency(netIncome, userData?.currency)}
             description2="Net Income = Total Income - What You Owe"
             tooltipContent={
                 <div className="text-sm space-y-1">
                    <p>Net Income = {formatCurrency(actualIncome, userData?.currency)} - {formatCurrency(youOwe, userData?.currency)}</p>
                 </div>
             }
           />
           <StatComparisonCard
             title="Expenses"
             value1={formatCurrency(actualExpenses, userData?.currency)}
             description1="Actual Expenses = Personal Expenses"
             value2={formatCurrency(netExpenses, userData?.currency)}
             description2="Net Expenses = Personal Expenses + What You Are Owed"
              tooltipContent={
                 <div className="text-sm space-y-1">
                    <p>Net Expenses = {formatCurrency(actualExpenses, userData?.currency)} + {formatCurrency(youAreOwed, userData?.currency)}</p>
                 </div>
             }
           />
           <StatComparisonCard
             title="Savings"
             value1={formatCurrency(actualCashLeft, userData?.currency)}
             description1="Actual Cash Left = (Income - Expenses) - Owed to You"
             value2={formatCurrency(finalNetSavings, userData?.currency)}
             description2="Final Net Savings = Cash Left + Owed to You - What You Owe"
             tooltipContent={
                 <div className="text-sm space-y-2">
                    <div>
                        <p>Actual Cash = ({formatCurrency(actualIncome, userData?.currency)} - {formatCurrency(actualExpenses, userData?.currency)}) - {formatCurrency(youAreOwed, userData?.currency)}</p>
                    </div>
                    <div>
                        <p>Net Savings = {formatCurrency(actualCashLeft, userData?.currency)} + {formatCurrency(youAreOwed, userData?.currency)} - {formatCurrency(youOwe, userData?.currency)}</p>
                    </div>
                 </div>
             }
           />
        </div>
    </TooltipProvider>
  );
}

