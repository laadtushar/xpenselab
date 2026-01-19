"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { CategoryDialog } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { useFinancials } from "@/context/financial-context";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useRouter } from "next/navigation";

export default function CategoriesPage() {
  const { deleteUnusedCategories } = useFinancials();
  const router = useRouter();

  const handleRefresh = async () => {
    router.refresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="w-full min-w-0 max-w-full">
      <DashboardHeader title="Categories">
        <div className="hidden md:flex gap-2">
          <CategoryDialog type="income" />
          <CategoryDialog type="expense" />
        </div>
      </DashboardHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full min-w-0 max-w-full">
        <div className="w-full min-w-0 max-w-full">
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

      {/* Mobile Quick Add FAB - positioned above bottom nav */}
      <div className="fixed bottom-20 right-4 md:hidden z-40">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <PlusCircle className="h-6 w-6" />
              <span className="sr-only">Add Category</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <div className="flex flex-col gap-2">
              <CategoryDialog type="income">
                <Button variant="ghost" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Income Category
                </Button>
              </CategoryDialog>
              <CategoryDialog type="expense">
                <Button variant="ghost" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Expense Category
                </Button>
              </CategoryDialog>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      </div>
    </PullToRefresh>
  );
}
