
"use client";

import { useFinancials } from "@/context/financial-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CategoryDialog } from "./category-form";
import { CategoryIcon } from "../icons/category-icon";
import { Badge } from "../ui/badge";
import type { Category } from "@/lib/types";

interface CategoryListProps {
    type: 'income' | 'expense';
}

export function CategoryList({ type }: CategoryListProps) {
  const { incomeCategories, expenseCategories, deleteCategory } = useFinancials();

  const categories = type === 'income' ? incomeCategories : expenseCategories;
  
  if (categories.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-12">
            <p>No {type} categories created yet.</p>
            <p className="text-sm">Click "Add {type === 'income' ? 'Income' : 'Expense'} Category" to get started.</p>
        </div>
    )
  }

  return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-2 w-fit text-sm py-1 px-3">
                    <CategoryIcon categoryName={category.name} iconName={category.icon} className="h-4 w-4" />
                    {category.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <CategoryDialog category={category}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </CategoryDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this category.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCategory(category.id)}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
  );
}
