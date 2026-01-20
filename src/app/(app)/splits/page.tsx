'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { CreateGroupDialog } from '@/components/splits/create-group-dialog';
import { GroupSelector } from '@/components/splits/group-selector';
import { GroupDashboard } from '@/components/splits/group-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import type { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useRouter } from 'next/navigation';
import { ListSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';

export default function SplitsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'groups'), where('members', 'array-contains', user.uid));
  }, [firestore, user?.uid]);

  const { data: groups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

  const selectedGroup = groups?.find(g => g.id === selectedGroupId) || null;

  // Effect to select the first group when groups load and no group is selected yet
  useEffect(() => {
    if (!isLoadingGroups && groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [isLoadingGroups, groups, selectedGroupId]);

  const router = useRouter();

  const handleRefresh = async () => {
    router.refresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Expense Splits">
        <div className="hidden md:block">
          <CreateGroupDialog />
        </div>
      </DashboardHeader>

      {isLoadingGroups && (
        <ListSkeleton items={2} />
      )}

      {!isLoadingGroups && !groups?.length && (
        <Card className="w-full min-w-0 max-w-full">
          <CardContent className="py-12">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Create a group to get started"
              description="Create a group with friends or family to start splitting expenses."
              action={<CreateGroupDialog />}
            />
          </CardContent>
        </Card>
      )}

      {!isLoadingGroups && groups && groups.length > 0 && (
        <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
          <GroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
          {selectedGroup ? (
            <GroupDashboard group={selectedGroup} />
          ) : (
             <Card className="w-full min-w-0 max-w-full">
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Select a group to view details.</p>
                </CardContent>
             </Card>
          )}
        </div>
      )}
      </div>
    </PullToRefresh>
  );
}
