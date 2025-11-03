'use client';

import { useState } from 'react';
import type { MonzoTransaction } from '@/lib/types';
import { useFinancials } from '@/context/financial-context';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ExpenseForm } from '../expenses/expense-form';
import { Dialog, DialogTrigger, DialogContent } from '../ui/dialog';
import { ExpenseFormFromMonzo } from './monzo-expense-form';
import { IncomeFormFromMonzo } from './monzo-income-form';

interface MonzoTransactionListProps {
  transactions: MonzoTransaction[];
}

export function MonzoTransactionList({ transactions }: MonzoTransactionListProps) {
    const { transactions: existingTransactions } = useFinancials();
    const { toast } = useToast();

    const isImported = (txId: string) => {
        return existingTransactions.some(t => t.id.startsWith(`monzo-${txId}`));
    }

    if (transactions.length === 0) {
        return <p className="text-center text-muted-foreground py-12">No transactions found for this account in the last 90 days.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => {
                        const credit = tx.amount > 0;
                        return (
                            <TableRow key={tx.id}>
                                <TableCell className="whitespace-nowrap">{format(new Date(tx.created), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="font-medium whitespace-nowrap">{tx.description}</TableCell>
                                <TableCell className={`text-right whitespace-nowrap ${credit ? 'text-green-600' : ''}`}>
                                    {formatCurrency(Math.abs(tx.amount) / 100, tx.currency)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{tx.category.replace(/_/g, ' ')}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {isImported(tx.id) ? (
                                        <Badge>Imported</Badge>
                                    ) : (
                                        <Badge variant="outline">Not Imported</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {!isImported(tx.id) && (
                                        <div className="flex gap-2 justify-end">
                                            {credit ? (
                                                 <IncomeFormFromMonzo transaction={tx} />
                                            ) : (
                                                 <ExpenseFormFromMonzo transaction={tx} />
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
