'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { CreateGroupDialog } from '@/components/splits/create-group-dialog';
import { GroupSelector } from '@/components/splits/group-selector';
import { GroupDashboard } from '@/components/splits/group-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Group } from '@/lib/types';

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


  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Expense Splits">
        <CreateGroupDialog />
      </DashboardHeader>

      {isLoadingGroups && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoadingGroups && !groups?.length && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium">Create a group to get started</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Create a group with friends or family to start splitting expenses.
            </p>
            <CreateGroupDialog />
          </CardContent>
        </Card>
      )}

      {!isLoadingGroups && groups && groups.length > 0 && (
        <div className="flex flex-col gap-6">
          <GroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
          {selectedGroup ? (
            <GroupDashboard group={selectedGroup} />
          ) : (
             <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Select a group to view details.</p>
                </CardContent>
             </Card>
          )}
        </div>
      )}
    </div>
  );
}
