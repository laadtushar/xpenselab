
'use client';

import { useState } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Loan, Repayment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Trash2, ChevronDown } from 'lucide-react';
import { useFinancials } from '@/context/financial-context';
import { useEncryption } from '@/context/encryption-context';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AddRepaymentDialog } from './repayment-form';

function RepaymentList({ loanId }: { loanId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { userData } = useFinancials();
    const { encryptionKey, isEncryptionEnabled, isUnlocked } = useEncryption();
    const encryptionKeyForHooks = isEncryptionEnabled && isUnlocked ? encryptionKey : null;

    const repaymentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'loans', loanId, 'repayments'), orderBy('date', 'desc'));
    }, [firestore, user, loanId]);

    const { data: repayments, isLoading } = useCollection<Repayment>(repaymentsQuery, encryptionKeyForHooks);

    if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline-block" /></div>;
    if (!repayments || repayments.length === 0) return <p className="p-4 text-sm text-muted-foreground">No repayments recorded yet.</p>;

    return (
        <div className="px-4 py-2 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">Repayment History</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {repayments.map(repayment => (
                        <TableRow key={repayment.id}>
                            <TableCell>{format(new Date(repayment.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">{formatCurrency(repayment.amount, userData?.currency)}</TableCell>
                            <TableCell>{repayment.notes}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


export function LoanList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { userData } = useFinancials();
  const { encryptionKey, isEncryptionEnabled, isUnlocked } = useEncryption();
  const encryptionKeyForHooks = isEncryptionEnabled && isUnlocked ? encryptionKey : null;

  const loansQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'loans'), orderBy('startDate', 'desc'));
  }, [firestore, user]);

  const { data: loans, isLoading } = useCollection<Loan>(loansQuery, encryptionKeyForHooks);

  const handleDelete = (id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'loans', id);
    // Note: This doesn't delete sub-collections like repayments. A cloud function would be needed for that.
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Loans</CardTitle>
        <CardDescription>A list of your active and paid off loans.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !loans || loans.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>You haven't added any loans yet.</p>
            <p className="text-sm">Click "Add Loan" to get started.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount Remaining</TableHead>
                  <TableHead className="text-right">Initial Amount</TableHead>
                  <TableHead className="text-right">Interest Rate</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <Collapsible asChild key={loan.id}>
                    <>
                    <TableRow>
                      <TableCell className="font-medium whitespace-nowrap">{loan.lender}</TableCell>
                      <TableCell><Badge variant={loan.status === 'active' ? 'destructive' : 'secondary'}>{loan.status}</Badge></TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(loan.amountRemaining, userData?.currency)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(loan.initialAmount, userData?.currency)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{loan.interestRate}%</TableCell>
                      <TableCell className="whitespace-nowrap">{loan.termMonths} months</TableCell>
                      <TableCell className="text-right">
                          <AddRepaymentDialog loan={loan} />
                           <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                                <span className="sr-only">View Repayments</span>
                              </Button>
                            </CollapsibleTrigger>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will delete the loan record. Repayments will need to be deleted manually.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(loan.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                        <tr className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={7} className="p-0">
                                <RepaymentList loanId={loan.id} />
                            </TableCell>
                        </tr>
                    </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

