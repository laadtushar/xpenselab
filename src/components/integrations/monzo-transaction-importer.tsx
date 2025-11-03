
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listMonzoAccounts } from '@/ai/flows/monzo-list-accounts';
import { listMonzoTransactions } from '@/ai/flows/monzo-list-transactions';
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
import type { MonzoAccount, MonzoTransaction } from '@/lib/types';
import { MonzoTransactionList } from './monzo-transaction-list';
import { useFinancials } from '@/context/financial-context';

interface MonzoTransactionImporterProps {
  userId: string;
}

export function MonzoTransactionImporter({ userId }: MonzoTransactionImporterProps) {
  const [accounts, setAccounts] = useState<MonzoAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<MonzoTransaction[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { userData } = useFinancials();

  const isConnected = !!userData?.monzoTokens;

  useEffect(() => {
    if (isConnected) {
      setIsLoadingAccounts(true);
      setError(null);
      listMonzoAccounts(userId)
        .then((res) => {
          setAccounts(res.accounts);
          if (res.accounts.length > 0) {
            setSelectedAccountId(res.accounts[0].id);
          }
        })
        .catch((err) => {
          setError('Could not fetch Monzo accounts. Please try reconnecting your account from the settings page.');
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
      listMonzoTransactions({ userId, accountId: selectedAccountId })
        .then((res) => {
          setTransactions(res.transactions);
        })
        .catch((err) => {
          setError('Could not fetch Monzo transactions. Please try again.');
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
                <CardTitle>Connect to Monzo</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Connect your Monzo account from the <a href="/settings" className="underline">Settings</a> page to import transactions.
                </p>
            </CardContent>
        </Card>
    )
  }

  if (isLoadingAccounts) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Monzo Transactions</CardTitle>
            <CardDescription>Fetching your Monzo accounts...</CardDescription>
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
      )
  }
  
  if (accounts.length === 0) {
      return (
           <Card>
                <CardHeader>
                    <CardTitle>No Monzo Accounts Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        We could not find any active accounts associated with your Monzo profile.
                    </p>
                </CardContent>
            </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monzo Transactions</CardTitle>
        <CardDescription>
          View recent transactions from your Monzo account and import them as income or expenses.
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
                {acc.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoadingTransactions ? (
             <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <MonzoTransactionList transactions={transactions} />
        )}
      </CardContent>
    </Card>
  );
}
