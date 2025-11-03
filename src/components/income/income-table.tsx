
"use client";

import { useFinancials } from "@/context/financial-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ArrowUpDown } from "lucide-react";
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
import { Badge } from "../ui/badge";
import { CategoryIcon } from "../icons/category-icon";
import type { Income } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { IncomeEditDialog } from "./income-edit-dialog";

type SortDescriptor = {
  column: 'description' | 'amount' | 'date';
  direction: 'ascending' | 'descending';
};

interface IncomeTableProps {
    incomes: Income[];
    onSortChange: (descriptor: SortDescriptor) => void;
    sortDescriptor?: SortDescriptor;
}

export function IncomeTable({ incomes, onSortChange, sortDescriptor }: IncomeTableProps) {
  const { deleteTransaction, isLoading, userData } = useFinancials();
  
  const createSortHandler = (column: 'description' | 'amount' | 'date') => () => {
    if (!sortDescriptor || sortDescriptor.column !== column) {
      onSortChange({ column, direction: 'ascending' });
    } else if (sortDescriptor.direction === 'ascending') {
      onSortChange({ column, direction: 'descending' });
    } else {
       onSortChange({ column: 'date', direction: 'descending' }); // default sort
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">
                 <Button variant="ghost" onClick={createSortHandler('amount')}>
                  Amount
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={createSortHandler('date')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                 </Button>
              </TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.length > 0 ? incomes.map((income) => (
              <TableRow key={income.id}>
                <TableCell className="font-medium">{income.description}</TableCell>
                 <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                    <CategoryIcon categoryName={income.category} className="h-3 w-3" />
                    {income.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(income.amount, userData?.currency)}</TableCell>
                <TableCell>{format(new Date(income.date), 'MMM d, yyyy')}</TableCell>
                 <TableCell className="text-right space-x-0">
                  <IncomeEditDialog income={income} />
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
                          This action cannot be undone. This will permanently delete this income entry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTransaction(income.id, 'income')}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No income records match your filters.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  );
}
