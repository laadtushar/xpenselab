'use client';

import type { Group } from '@/lib/types';
import { MemberBalances } from './member-balances';
import { SharedExpensesList } from './shared-expenses-list';
import { AddSharedExpenseDialog } from './add-shared-expense-dialog';

interface GroupDashboardProps {
  group: Group;
}

export function GroupDashboard({ group }: GroupDashboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <MemberBalances group={group} />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="flex justify-end">
            <AddSharedExpenseDialog group={group} />
        </div>
        <SharedExpensesList group={group} />
      </div>
    </div>
  );
}
