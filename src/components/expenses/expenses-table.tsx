
"use client";

import { useFinancials } from "@/context/financial-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/icons/category-icon";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Loader2, Trash2, Edit, Save, X } from "lucide-react";
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
import { SplitExpenseDialog } from "./split-expense-dialog";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortDescriptor = {
  column: 'description' | 'amount' | 'date';
  direction: 'ascending' | 'descending';
};

interface ExpensesTableProps {
  expenses: Expense[];
  onSortChange: (descriptor: SortDescriptor) => void;
  sortDescriptor?: SortDescriptor;
}

export function ExpensesTable({ expenses, onSortChange, sortDescriptor }: ExpensesTableProps) {
  const { deleteTransaction, isLoading, userData, addTransaction, expenseCategories, updateTransaction } = useFinancials();
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Expense>>({});

  const createSortHandler = (column: 'description' | 'amount' | 'date') => () => {
    if (!sortDescriptor || sortDescriptor.column !== column) {
      onSortChange({ column, direction: 'ascending' });
    } else if (sortDescriptor.direction === 'ascending') {
      onSortChange({ column, direction: 'descending' });
    } else {
       onSortChange({ column: 'date', direction: 'descending' });
    }
  };
  
  const handleAddExpense = async () => {
    if (newExpense.description && newExpense.amount && newExpense.date && newExpense.category) {
        await addTransaction({ ...newExpense, type: 'expense' } as any);
        setNewExpense({});
    }
  }

  const handleEditClick = (expense: Expense) => {
    setEditingId(expense.id);
    setEditedData(expense);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedData({});
  };

  const handleSaveEdit = () => {
    if (editingId && editedData) {
      updateTransaction(editingId, 'expense', editedData);
      setEditingId(null);
      setEditedData({});
    }
  };

  const handleInputChange = (field: keyof Expense, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
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
            <TableRow>
                <TableCell>
                    <Input placeholder="Description" value={newExpense.description || ''} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                </TableCell>
                <TableCell>
                    <Select onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell>
                    <Input type="number" placeholder="Amount" value={newExpense.amount || ''} onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })} />
                </TableCell>
                <TableCell>
                    <Input type="date" placeholder="Date" value={newExpense.date || ''} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}/>
                </TableCell>
                <TableCell>
                    <Button onClick={handleAddExpense}>Add</Button>
                </TableCell>
            </TableRow>
            {expenses.length > 0 ? expenses.map((expense) => {
              const isEditing = editingId === expense.id;
              return (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <Input value={editedData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
                  ) : (
                    expense.description
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select onValueChange={(value) => handleInputChange('category', value)} value={editedData.category}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    expense.category && (
                      <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                        <CategoryIcon categoryName={expense.category} className="h-3 w-3" />
                        {expense.category}
                      </Badge>
                    )
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input type="number" value={editedData.amount || ''} onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))} />
                  ) : (
                    formatCurrency(expense.amount, userData?.currency)
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                     <Input type="date" value={editedData.date ? format(new Date(editedData.date), 'yyyy-MM-dd') : ''} onChange={(e) => handleInputChange('date', e.target.value ? new Date(e.target.value).toISOString() : '')} />
                  ) : (
                    format(new Date(expense.date), 'MMM d, yyyy')
                  )}
                </TableCell>
                <TableCell className="text-right space-x-0">
                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={handleSaveEdit}><Save className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(expense)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <SplitExpenseDialog expense={expense} />
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
                              This action cannot be undone. This will permanently delete this expense.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTransaction(expense.id, 'expense')}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No expenses match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  );
}
