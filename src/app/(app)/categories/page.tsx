"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { CategoryDialog } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { useFinancials } from "@/context/financial-context";
import { Button } from "@/components/ui/button";
export default function CategoriesPage() {
  const { deleteUnusedCategories } = useFinancials();

  return (
    <div className="w-full min-w-0 max-w-full">
      <DashboardHeader title="Categories">
        <div className="hidden md:flex gap-2">
          <CategoryDialog type="income" />
          <CategoryDialog type="expense" />
        </div>
      </DashboardHeader>
      {/* Mobile Add Category Section */}
      <div className="md:hidden w-full min-w-0 max-w-full mb-6">
        <h2 className="text-xl font-bold mb-4">Add New Category</h2>
        <div className="flex flex-wrap gap-2">
          <CategoryDialog type="income" />
          <CategoryDialog type="expense" />
        </div>
      </div>
      <div className="w-full min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2 className="text-xl font-bold">Manage Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => deleteUnusedCategories('income')} className="text-xs sm:text-sm">Remove Unused Income</Button>
            <Button variant="outline" size="sm" onClick={() => deleteUnusedCategories('expense')} className="text-xs sm:text-sm">Remove Unused Expense</Button>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Income Categories</h3>
            <CategoryList type="income" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Expense Categories</h3>
            <CategoryList type="expense" />
          </div>
        </div>
      </div>
    </div>
  );
}
