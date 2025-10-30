import { allIcons } from './all-icons';
import { useFinancials } from '@/context/financial-context';
import { MoreHorizontal } from 'lucide-react';
import React from "react";

type CategoryIconProps = {
  categoryName?: string;
  iconName?: string;
  className?: string;
};

export function CategoryIcon({ categoryName, iconName, className }: CategoryIconProps) {
  const { categories } = useFinancials();
  
  let finalIconName = iconName;

  if (!finalIconName && categoryName) {
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      finalIconName = category.icon;
    }
  }

  const Icon = finalIconName && finalIconName in allIcons 
    ? allIcons[finalIconName as keyof typeof allIcons] 
    : MoreHorizontal;
    
  return <Icon className={className || "h-4 w-4"} />;
}
