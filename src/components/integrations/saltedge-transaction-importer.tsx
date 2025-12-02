
'use client';

import { useState, useEffect } from 'react';
import { listSaltEdgeAccounts } from '@/ai/flows/saltedge-list-accounts';
import { listSaltEdgeTransactions } from '@/ai/flows/saltedge-list-transactions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import type { SaltEdgeAccount, SaltEdgeTransaction } from '@/lib/types';
import { SaltEdgeTransactionList } from './saltedge-transaction-list';
import { useFinancials } from '@/context/financial-context';

interface SaltEdgeTransactionImporterProps {
  userId: string;
}

export function SaltEdgeTransactionImporter({ userId }: SaltEdgeTransactionImporterProps) {
  const [accounts, setAccounts] = useState<SaltEdgeAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<SaltEdgeTransaction[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { userData } = useFinancials();

  const isConnected = !!userData?.saltEdgeCustomerId;

  useEffect(() => {
    if (isConnected) {
      setIsLoadingAccounts(true);
      setError(null);
      listSaltEdgeAccounts({ userId })
        .then((res) => {
          setAccounts(res.accounts);
          if (res.accounts.length > 0) {
            setSelectedAccountId(res.accounts[0].id);
          }
        })
        .catch((err) => {
          setError('Could not fetch bank accounts. Please try reconnecting from the settings page.');
          toast({
            title: 'Error Fetching Accounts',
            description: err.message,
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoadingAccounts(false));
    }
  }, [isConnected, userId, toast]);

  useEffect(() => {
    if (selectedAccountId) {
      setIsLoadingTransactions(true);
      setError(null);
      listSaltEdgeTransactions({ userId, accountId: selectedAccountId })
        .then((res) => {
          setTransactions(res.transactions);
        })
        .catch((err) => {
          setError('Could not fetch transactions. Please try again.');
          toast({
            title: 'Error Fetching Transactions',
            description: err.message,
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoadingTransactions(false));
    }
  }, [selectedAccountId, userId, toast]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect to Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect your bank account from the <a href="/settings" className="underline">Settings</a> page to import transactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingAccounts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bank Transactions</CardTitle>
          <CardDescription>Fetching your bank accounts...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>An Error Occurred</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Bank Accounts Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We could not find any active accounts associated with your bank connections.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Transactions</CardTitle>
        <CardDescription>
          View recent transactions from your bank accounts and import them as income or expenses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedAccountId || ''}
          onValueChange={(value) => setSelectedAccountId(value)}
        >
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoadingTransactions ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <SaltEdgeTransactionList transactions={transactions} />
        )}
      </CardContent>
    </Card>
  );
}

