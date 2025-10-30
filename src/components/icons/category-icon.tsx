import type { ExpenseCategory } from "@/lib/types";
import {
  ShoppingCart,
  Home,
  Zap,
  Car,
  Ticket,
  UtensilsCrossed,
  ShoppingBag,
  Plane,
  Stethoscope,
  GraduationCap,
  Smile,
  MoreHorizontal,
  Receipt,
  CreditCard,
  GlassWater,
  HeartPulse,
  Landmark,
  Gift,
} from 'lucide-react';
import React from "react";

const iconMap: Record<ExpenseCategory, React.ElementType> = {
  Groceries: ShoppingCart,
  Rent: Home,
  Utilities: Zap,
  Transportation: Car,
  Entertainment: Ticket,
  'Dining Out': UtensilsCrossed,
  Shopping: ShoppingBag,
  Travel: Plane,
  Healthcare: Stethoscope,
  Education: GraduationCap,
  'Personal Care': Smile,
  Bills: Receipt,
  Subscriptions: CreditCard,
  'Food & Drink': GlassWater,
  'Health & Wellbeing': HeartPulse,
  'Education Loan Repayment': Landmark,
  Gifts: Gift,
  Other: MoreHorizontal,
};

type CategoryIconProps = {
  category?: string;
  className?: string;
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = category && category in iconMap ? iconMap[category as ExpenseCategory] : MoreHorizontal;
  return <Icon className={className || "h-4 w-4"} />;
}
