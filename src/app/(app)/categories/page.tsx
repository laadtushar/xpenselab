
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { useFinancials } from "@/context/financial-context";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const { deleteUnusedCategories } = useFinancials();

  return (
    <div>
      <DashboardHeader title="Categories" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Add New Category</h2>
          <CategoryForm />
        </div>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Existing Categories</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => deleteUnusedCategories('income')}>Remove Unused Income</Button>
              <Button variant="outline" size="sm" onClick={() => deleteUnusedCategories('expense')}>Remove Unused Expense</Button>
            </div>
          </div>
          <CategoryList />
        </div>
      </div>
    </div>
  );
}
