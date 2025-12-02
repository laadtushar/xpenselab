
"use client";

import { useFinancials } from "@/context/financial-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ArrowUpDown, Edit, Save, X } from "lucide-react";
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

interface IncomeTableProps {
    incomes: Income[];
    onSortChange: (descriptor: SortDescriptor) => void;
    sortDescriptor?: SortDescriptor;
}

export function IncomeTable({ incomes, onSortChange, sortDescriptor }: IncomeTableProps) {
  const { deleteTransaction, isLoading, userData, addTransaction, incomeCategories, updateTransaction } = useFinancials();
  const [newIncome, setNewIncome] = useState<Partial<Income>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Income>>({});
  
  const createSortHandler = (column: 'description' | 'amount' | 'date') => () => {
    if (!sortDescriptor || sortDescriptor.column !== column) {
      onSortChange({ column, direction: 'ascending' });
    } else if (sortDescriptor.direction === 'ascending') {
      onSortChange({ column, direction: 'descending' });
    } else {
       onSortChange({ column: 'date', direction: 'descending' });
    }
  };
  
    const handleAddIncome = async () => {
        if (newIncome.description && newIncome.amount && newIncome.date && newIncome.category) {
            await addTransaction({ ...newIncome, type: 'income' } as any);
            setNewIncome({});
        }
    }

    const handleEditClick = (income: Income) => {
      setEditingId(income.id);
      setEditedData(income);
    };
  
    const handleCancelEdit = () => {
      setEditingId(null);
      setEditedData({});
    };
  
    const handleSaveEdit = () => {
      if (editingId && editedData) {
        updateTransaction(editingId, 'income', editedData);
        setEditingId(null);
        setEditedData({});
      }
    };
  
    const handleInputChange = (field: keyof Income, value: any) => {
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
                    <Input placeholder="Description" value={newIncome.description || ''} onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })} />
                </TableCell>
                <TableCell>
                    <Select onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {incomeCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell>
                    <Input type="number" placeholder="Amount" value={newIncome.amount || ''} onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) })} />
                </TableCell>
                <TableCell>
                    <Input type="date" placeholder="Date" value={newIncome.date || ''} onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}/>
                </TableCell>
                <TableCell>
                    <Button onClick={handleAddIncome}>Add</Button>
                </TableCell>
            </TableRow>
            {incomes.length > 0 ? incomes.map((income) => {
              const isEditing = editingId === income.id;
              return (
              <TableRow key={income.id}>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <Input value={editedData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
                  ) : (
                    income.description
                  )}
                  </TableCell>
                 <TableCell>
                  {isEditing ? (
                    <Select onValueChange={(value) => handleInputChange('category', value)} value={editedData.category}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {incomeCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                      <CategoryIcon categoryName={income.category} className="h-3 w-3" />
                      {income.category}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input type="number" value={editedData.amount || ''} onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))} />
                  ) : (
                    formatCurrency(income.amount, userData?.currency)
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input type="date" value={editedData.date ? format(new Date(editedData.date), 'yyyy-MM-dd') : ''} onChange={(e) => handleInputChange('date', e.target.value ? new Date(e.target.value).toISOString() : '')} />
                    ) : (
                    format(new Date(income.date), 'MMM d, yyyy')
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
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(income)}>
                        <Edit className="h-4 w-4" />
                      </Button>
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
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}) : (
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
