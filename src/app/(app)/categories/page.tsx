
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryDialog } from "@/components/categories/category-form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancials } from "@/context/financial-context";
import { Loader2 } from "lucide-react";

export default function CategoriesPage() {
    const { isLoadingCategories } = useFinancials();

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Categories" />
      
      <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="expenses">
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="income">Income</TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                        <CategoryDialog type="expense" />
                        <CategoryDialog type="income" />
                    </div>
                </div>
                {isLoadingCategories ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <TabsContent value="expenses">
                            <CategoryList type="expense" />
                        </TabsContent>
                        <TabsContent value="income">
                            <CategoryList type="income" />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
