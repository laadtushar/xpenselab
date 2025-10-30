'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Group } from '@/lib/types';
import { Users } from 'lucide-react';

interface GroupSelectorProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onSelectGroup,
}: GroupSelectorProps) {
  return (
    <div>
      <Select
        value={selectedGroupId || ''}
        onValueChange={(value) => onSelectGroup(value || null)}
      >
        <SelectTrigger className="w-full sm:w-[300px]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a group..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
