
'use client';

import { DashboardHeader } from '@/components/shared/dashboard-header';
import { DebtList } from '@/components/debts/debt-list';
import { AddDebtDialog } from '@/components/debts/debt-form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, or } from 'firebase/firestore';
import type { Debt } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function DebtsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const debtsOwedToUserQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'debts'), where('toUserId', '==', user.uid), where('settled', '==', false));
  }, [user, firestore]);

  const debtsOwedByUserQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'debts'), where('fromUserId', '==', user.uid), where('settled', '==', false));
  }, [user, firestore]);

  const settledDebtsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'debts'), 
      where('settled', '==', true),
      or(
        where('fromUserId', '==', user.uid),
        where('toUserId', '==', user.uid)
      )
    );
  }, [user, firestore]);


  const { data: debtsToUser, isLoading: isLoadingTo } = useCollection<Debt>(debtsOwedToUserQuery);
  const { data: debtsFromUser, isLoading: isLoadingFrom } = useCollection<Debt>(debtsOwedByUserQuery);
  const { data: settledDebts, isLoading: isLoadingSettled } = useCollection<Debt>(settledDebtsQuery);

  const isLoading = isLoadingTo || isLoadingFrom || isLoadingSettled;

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Individual Debts">
        <AddDebtDialog />
      </DashboardHeader>
      
      <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="owed-by-others">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="owed-by-others">Owed By Others</TabsTrigger>
                    <TabsTrigger value="owed-to-others">Owed To Others</TabsTrigger>
                    <TabsTrigger value="settled">History</TabsTrigger>
                </TabsList>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <TabsContent value="owed-by-others">
                           <DebtList debts={debtsToUser || []} type="to" />
                        </TabsContent>
                        <TabsContent value="owed-to-others">
                           <DebtList debts={debtsFromUser || []} type="from" />
                        </TabsContent>
                         <TabsContent value="settled">
                           <DebtList debts={settledDebts || []} type="settled" />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
