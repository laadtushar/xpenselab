
'use client';

import { DashboardHeader } from '@/components/shared/dashboard-header';
import { DebtList } from '@/components/debts/debt-list';
import { AddDebtDialog } from '@/components/debts/debt-form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, or, and } from 'firebase/firestore';
import type { Debt } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useEncryption } from '@/context/encryption-context';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeletons';

export default function DebtsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { encryptionKey, isEncryptionEnabled, isUnlocked } = useEncryption();
  const encryptionKeyForHooks = isEncryptionEnabled && isUnlocked ? encryptionKey : null;

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
      and(
        where('settled', '==', true),
        or(
          where('fromUserId', '==', user.uid),
          where('toUserId', '==', user.uid)
        )
      )
    );
  }, [user, firestore]);


  const { data: debtsToUser, isLoading: isLoadingTo } = useCollection<Debt>(debtsOwedToUserQuery, encryptionKeyForHooks);
  const { data: debtsFromUser, isLoading: isLoadingFrom } = useCollection<Debt>(debtsOwedByUserQuery, encryptionKeyForHooks);
  const { data: settledDebts, isLoading: isLoadingSettled } = useCollection<Debt>(settledDebtsQuery, encryptionKeyForHooks);

  const isLoading = isLoadingTo || isLoadingFrom || isLoadingSettled;

  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Individual Debts">
        <div className="hidden md:block">
          <AddDebtDialog />
        </div>
      </DashboardHeader>
      
      {/* Mobile Add Button */}
      <div className="md:hidden">
        <AddDebtDialog />
      </div>
      
      <Card className="w-full min-w-0 max-w-full">
        <CardContent className="pt-6 w-full min-w-0 max-w-full">
            <Tabs defaultValue="owed-by-others">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="owed-by-others" className="text-xs sm:text-sm">Owed By Others</TabsTrigger>
                    <TabsTrigger value="owed-to-others" className="text-xs sm:text-sm">Owed To Others</TabsTrigger>
                    <TabsTrigger value="settled" className="text-xs sm:text-sm">History</TabsTrigger>
                </TabsList>
                {isLoading ? (
                    <ListSkeleton items={3} />
                ) : (
                    <>
                        <TabsContent value="owed-by-others" className="w-full min-w-0 max-w-full">
                           <DebtList debts={debtsToUser || []} type="to" />
                        </TabsContent>
                        <TabsContent value="owed-to-others" className="w-full min-w-0 max-w-full">
                           <DebtList debts={debtsFromUser || []} type="from" />
                        </TabsContent>
                         <TabsContent value="settled" className="w-full min-w-0 max-w-full">
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
