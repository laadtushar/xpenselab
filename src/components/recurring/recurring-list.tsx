'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { RecurringTransaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Trash2 } from 'lucide-react';
import { useFinancials } from '@/context/financial-context';
import { useEncryption } from '@/context/encryption-context';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { doc } from 'firebase/firestore';

export function RecurringTransactionList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { userData } = useFinancials();
  const { encryptionKey, isEncryptionEnabled, isUnlocked } = useEncryption();
  const encryptionKeyForHooks = isEncryptionEnabled && isUnlocked ? encryptionKey : null;

  const recurringQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'recurringTransactions'), orderBy('nextDueDate', 'asc'));
  }, [firestore, user]);

  const { data: recurringTxs, isLoading } = useCollection<RecurringTransaction>(recurringQuery, encryptionKeyForHooks);

  const handleDelete = (id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'recurringTransactions', id);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Transactions</CardTitle>
        <CardDescription>These transactions will be automatically added on their next due date.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !recurringTxs || recurringTxs.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>You haven't scheduled any recurring transactions yet.</p>
            <p className="text-sm">Click "Add Recurring" to get started.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringTxs.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium whitespace-nowrap">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'income' ? 'secondary' : 'outline'}>{tx.type}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(tx.amount, userData?.currency)}</TableCell>
                      <TableCell className="whitespace-nowrap">{tx.category}</TableCell>
                      <TableCell className="whitespace-nowrap capitalize">{tx.frequency}</TableCell>
                      <TableCell className="whitespace-nowrap">{format(new Date(tx.nextDueDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will delete the scheduled transaction. It will no longer be automatically added.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tx.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {recurringTxs.map((tx) => (
                <Card key={tx.id} className="border shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{tx.description}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Badge variant={tx.type === 'income' ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0 h-5">{tx.type}</Badge>
                          <span>{tx.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(tx.amount, userData?.currency)}</div>
                        <div className="text-xs text-muted-foreground mt-1 capitalize">{tx.frequency}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                      <div className="text-xs text-muted-foreground">
                        Next: {format(new Date(tx.nextDueDate), 'MMM d, yyyy')}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will delete the scheduled transaction. It will no longer be automatically added.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(tx.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
