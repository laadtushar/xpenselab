
"use client";

import { useFinancials } from "@/context/financial-context";
import { useEncryption } from "@/context/encryption-context";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/icons/category-icon";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Loader2, Trash2, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { isEncryptionEnabled, isUnlocked } = useEncryption();
  const { toast } = useToast();
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
    // Check if encryption is enabled but not unlocked
    if (isEncryptionEnabled && !isUnlocked) {
      toast({
        title: 'Encryption Locked',
        description: 'Please unlock encryption in settings to add expenses.',
        variant: 'destructive',
      });
      return;
    }

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
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
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
                <Input type="date" placeholder="Date" value={newExpense.date || ''} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
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
              )
            }) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No expenses match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {/* Mobile Add Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add New Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Description" value={newExpense.description || ''} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
            <div className="flex gap-2">
              <Input type="number" placeholder="Amount" className="flex-1" value={newExpense.amount || ''} onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })} />
              <Input type="date" className="flex-1" value={newExpense.date || ''} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
            </div>
            <Select onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="w-full mt-2" onClick={handleAddExpense}>Add Expense</Button>
          </CardContent>
        </Card>

        {expenses.length > 0 ? expenses.map((expense) => {
          const isEditing = editingId === expense.id;
          return (
            <SwipeableItem
              key={expense.id}
              rightActions={[
                {
                  label: 'Delete',
                  icon: <Trash2 className="h-5 w-5" />,
                  action: () => deleteTransaction(expense.id, 'expense'),
                  color: 'destructive',
                },
              ]}
              leftActions={[
                {
                  label: 'Edit',
                  icon: <Edit className="h-5 w-5" />,
                  action: () => handleEditClick(expense),
                  color: 'default',
                },
                {
                  label: 'Duplicate',
                  icon: <Copy className="h-5 w-5" />,
                  action: () => {
                    addTransaction({
                      ...expense,
                      id: undefined,
                      description: `${expense.description} (Copy)`,
                    } as any);
                  },
                  color: 'secondary',
                },
              ]}
              disabled={isEditing}
            >
              <Card>
                <CardContent className="p-4 space-y-3">
                {/* Header: Desc & Amount */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1 w-full min-w-0">
                    {isEditing ? (
                      <Input value={editedData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} className="mb-2" placeholder="Description" />
                    ) : (
                      <div className="font-semibold truncate leading-tight">{expense.description}</div>
                    )}

                    {isEditing ? (
                      <Select onValueChange={(value) => handleInputChange('category', value)} value={editedData.category}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      expense.category && (
                        <Badge variant="secondary" className="w-fit">
                          <CategoryIcon categoryName={expense.category} className="h-3 w-3 mr-1" />
                          {expense.category}
                        </Badge>
                      )
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {isEditing ? (
                      <Input type="number" value={editedData.amount || ''} onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))} className="w-24 text-right mb-1" placeholder="Amount" />
                    ) : (
                      <div className="font-bold text-lg">{formatCurrency(expense.amount, userData?.currency)}</div>
                    )}

                    {isEditing ? (
                      <Input type="date" value={editedData.date ? format(new Date(editedData.date), 'yyyy-MM-dd') : ''} onChange={(e) => handleInputChange('date', e.target.value ? new Date(e.target.value).toISOString() : '')} className="w-32 text-right text-xs" />
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(expense.date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSaveEdit} className="h-8"><Save className="mr-2 h-3 w-3" /> Save</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-8">Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleEditClick(expense)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                      <div className="scale-90 origin-center">
                        <SplitExpenseDialog expense={expense} />
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTransaction(expense.id, 'expense')}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            </SwipeableItem>
          )
        }) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">No expenses found.</div>
        )}
      </div>
    </div>
  );
}
