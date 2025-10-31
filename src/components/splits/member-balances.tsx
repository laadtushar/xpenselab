
'use client';

import { useMemo } from 'react';
import type { Group, SharedExpense, MemberBalance } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useFinancials } from '@/context/financial-context';

interface MemberBalancesProps {
  group: Group;
}

export function MemberBalances({ group }: MemberBalancesProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { userData } = useFinancials();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'groups', group.id, 'sharedExpenses'));
  }, [firestore, group.id]);

  const { data: expenses, isLoading } = useCollection<SharedExpense>(expensesQuery);

  const balances = useMemo((): MemberBalance[] => {
    if (!expenses) return [];

    const memberBalances: { [key: string]: number } = {};
    group.members.forEach(memberId => {
      memberBalances[memberId] = 0;
    });

    expenses.forEach(expense => {
      // The person who paid is owed money
      memberBalances[expense.paidBy] += expense.amount;
      // The people who owe money have their balance decreased
      expense.splits.forEach(split => {
        memberBalances[split.userId] -= split.amount;
      });
    });

    return group.members.map(memberId => ({
      userId: memberId,
      name: group.memberDetails[memberId]?.name || group.memberDetails[memberId]?.email.split('@')[0] || 'Unknown',
      email: group.memberDetails[memberId]?.email || 'No email',
      balance: memberBalances[memberId],
    }));
  }, [expenses, group]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {balances.map(member => (
              <div key={member.userId} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {member.name}
                    {member.userId === user?.uid && " (You)"}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className={`ml-auto font-medium ${member.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(member.balance, userData?.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
