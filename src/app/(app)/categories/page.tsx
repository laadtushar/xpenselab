"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryDialog } from "@/components/categories/category-form";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Categories">
        <CategoryDialog />
      </DashboardHeader>
      
      <CategoryList />
    </div>
  );
}
