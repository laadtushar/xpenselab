
'use client';

import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Debt } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { useFinancials } from '@/context/financial-context';

interface DebtListProps {
  debts: Debt[];
  type: 'to' | 'from' | 'settled';
}

const getParties = (debt: Debt, currentUserId: string) => {
    if (debt.fromUserId === currentUserId) {
        return { from: debt.fromUserName || "You", to: debt.toUserName || `virtual user`};
    } else {
        return { from: debt.fromUserName || `virtual user`, to: debt.toUserName || "You"};
    }
}

export function DebtList({ debts, type }: DebtListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userData } = useFinancials();

  const handleSettleDebt = (debtId: string) => {
    if (!firestore || !user) return;

    if (type !== 'from' && type !== 'to') {
        toast({ title: "Action not allowed here", variant: "destructive" });
        return;
    }

    const docRef = doc(firestore, 'debts', debtId);
    setDocumentNonBlocking(docRef, { settled: true }, { merge: true });
    
    toast({
      title: 'Debt Settled',
      description: 'The debt has been marked as settled.',
    });
  };

  if (debts.length === 0) {
    const messages = {
      to: "Nobody owes you anything. Great!",
      from: "You don't owe anyone anything. Great!",
      settled: "No settled debts to show."
    };
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{messages[type]}</p>
      </div>
    );
  }


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          {type === 'settled' && <TableHead>From</TableHead>}
          {type === 'settled' && <TableHead>To</TableHead>}
          <TableHead>Owed {type === 'from' ? 'To' : 'By'}</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-center">Status</TableHead>
          {type !== 'settled' && <TableHead><span className="sr-only">Actions</span></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {debts.map(debt => {
          const parties = getParties(debt, user!.uid);
          const otherPartyName = debt.fromUserId === user!.uid ? debt.toUserName : debt.fromUserName;
          return (
            <TableRow key={debt.id}>
              <TableCell className="font-medium">{debt.description}</TableCell>
              {type === 'settled' && <TableCell>{parties.from}</TableCell>}
              {type === 'settled' && <TableCell>{parties.to}</TableCell>}
              <TableCell>{otherPartyName}</TableCell>
              <TableCell className="text-right">{formatCurrency(debt.amount, userData?.currency)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={debt.settled ? 'secondary' : 'destructive'}>
                  {debt.settled ? 'Settled' : 'Pending'}
                </Badge>
              </TableCell>
              {type !== 'settled' && (
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => handleSettleDebt(debt.id)}
                  >
                    Settle
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
