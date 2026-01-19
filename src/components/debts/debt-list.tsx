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
import { useEncryption } from '@/context/encryption-context';
import { EmptyState } from '../ui/empty-state';
import { Handshake } from 'lucide-react';

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
  const { encryptionKey, isEncryptionEnabled, isUnlocked } = useEncryption();

  const handleSettleDebt = (debtId: string) => {
    if (!firestore || !user) return;

    if (type !== 'from' && type !== 'to') {
        toast({ title: "Action not allowed here", variant: "destructive" });
        return;
    }
    
    // Check if encryption is enabled but not unlocked
    if (isEncryptionEnabled && !isUnlocked) {
      toast({
        title: 'Encryption Locked',
        description: 'Please unlock encryption in settings to settle debts.',
        variant: 'destructive',
      });
      return;
    }

    const docRef = doc(firestore, 'debts', debtId);
    const encryptionKeyForWrite = isEncryptionEnabled && isUnlocked ? encryptionKey : null;
    // Note: Only updating 'settled' field which is not encrypted, but still pass key for consistency
    setDocumentNonBlocking(docRef, { settled: true }, { merge: true }, encryptionKeyForWrite);
    
    toast({
      title: 'Debt Settled',
      description: 'The debt has been marked as settled.',
    });
  };

  if (debts.length === 0) {
    const messages = {
      to: {
        title: "Nobody owes you anything",
        description: "Great! All your debts have been settled."
      },
      from: {
        title: "You don't owe anyone anything",
        description: "Great! You're all caught up."
      },
      settled: {
        title: "No settled debts",
        description: "Settled debts will appear here once you mark them as paid."
      }
    };
    return (
      <EmptyState
        icon={<Handshake className="h-12 w-12" />}
        title={messages[type].title}
        description={messages[type].description}
      />
    );
  }


  return (
    <div className="w-full overflow-x-auto">
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
              <TableCell className="font-medium whitespace-nowrap">{debt.description}</TableCell>
              {type === 'settled' && <TableCell className="whitespace-nowrap">{parties.from}</TableCell>}
              {type === 'settled' && <TableCell className="whitespace-nowrap">{parties.to}</TableCell>}
              <TableCell className="whitespace-nowrap">{otherPartyName}</TableCell>
              <TableCell className="text-right whitespace-nowrap">{formatCurrency(debt.amount, userData?.currency)}</TableCell>
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
    </div>
  );
}
