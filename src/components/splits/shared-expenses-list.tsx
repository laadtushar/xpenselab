
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Group, SharedExpense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useFinancials } from '@/context/financial-context';

interface SharedExpensesListProps {
  group: Group;
}

export function SharedExpensesList({ group }: SharedExpensesListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { userData } = useFinancials();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'groups', group.id, 'sharedExpenses'), orderBy('date', 'desc'));
  }, [firestore, group.id]);

  const { data: expenses, isLoading } = useCollection<SharedExpense>(expensesQuery);

  const getMemberName = (userId: string) => {
    return group.memberDetails[userId]?.name || group.memberDetails[userId]?.email.split('@')[0] || 'Unknown';
  }

  if (isLoading) {
    return (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shared Expenses</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-12">
          <p>No shared expenses in this group yet.</p>
          <p className="text-sm">Click "Add Expense" to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense History</CardTitle>
        <CardDescription>A list of shared expenses for this group.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid by</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Your Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const yourSplit = expense.splits.find(s => s.userId === user?.uid);
              return (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium whitespace-nowrap">{expense.description}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(expense.amount, userData?.currency)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getMemberName(expense.paidBy)}</TableCell>
                  <TableCell className="whitespace-nowrap">{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {yourSplit ? formatCurrency(yourSplit.amount, userData?.currency) : formatCurrency(0, userData?.currency)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
