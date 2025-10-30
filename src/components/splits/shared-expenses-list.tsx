'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Group, SharedExpense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SharedExpensesListProps {
  group: Group;
}

export function SharedExpensesList({ group }: SharedExpensesListProps) {
  const { user } = useUser();
  const firestore = useFirestore();

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
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>{getMemberName(expense.paidBy)}</TableCell>
                  <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {yourSplit ? formatCurrency(yourSplit.amount) : formatCurrency(0)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
