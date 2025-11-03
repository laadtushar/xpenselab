
'use client';

import React, { createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import type { Transaction, Budget, Income, Expense, Category, User as UserData, RecurringTransaction } from '@/lib/types';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, FieldValue, updateDoc, deleteField } from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, addYears, isPast } from 'date-fns';
import { defaultCategories } from '@/lib/default-categories';

interface FinancialContextType {
  transactions: Transaction[];
  incomes: Income[];
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  deleteTransaction: (id: string, type: 'income' | 'expense') => void;
  clearTransactions: (type: 'income' | 'expense') => Promise<void>;
  
  budget: Budget | null;
  setBudget: (budget: { amount: number }) => void;
  
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  
  userData: UserData | null;
  updateUser: (data: Partial<UserData> & { monzoTokens?: FieldValue | undefined }) => void;
  
  resetData: () => void;
  isLoading: boolean;
  isLoadingCategories: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading: loadingUser } = useUser();
  const firestore = useFirestore();
  const userId = user?.uid;

  // Data References
  const userDocRef = useMemoFirebase(() => userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
  const incomesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'incomes') : null, [firestore, userId]);
  const expensesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'expenses') : null, [firestore, userId]);
  const categoriesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'categories') : null, [firestore, userId]);
  const budgetsRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'budgets') : null, [firestore, userId]);
  const recurringRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'recurringTransactions') : null, [firestore, userId]);

  // Data Fetching
  const { data: userData } = useDoc<UserData>(userDocRef);
  const { data: incomesData, isLoading: loadingIncomes } = useCollection<Income>(incomesRef);
  const { data: expensesData, isLoading: loadingExpenses } = useCollection<Expense>(expensesRef);
  const { data: categoriesData, isLoading: loadingCategories } = useCollection<Category>(categoriesRef);
  const { data: budgetsData, isLoading: loadingBudgets } = useCollection<Budget>(budgetsRef);
  const { data: recurringData, isLoading: loadingRecurring } = useCollection<RecurringTransaction>(recurringRef);
  
  const incomes = useMemo(() => incomesData || [], [incomesData]);
  const expenses = useMemo(() => expensesData || [], [expensesData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  // Handle Recurring Transactions
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!userId) return;
    const ref = transaction.type === 'income' ? incomesRef : expensesRef;
    if (ref) {
      addDocumentNonBlocking(ref, { ...transaction, userId });
    }
  }, [userId, incomesRef, expensesRef]);

  useEffect(() => {
    if (!recurringData || !firestore || !userId) return;

    const processRecurringTransactions = async () => {
        const batch = writeBatch(firestore);
        let batchHasWrites = false;

        for (const tx of recurringData) {
            let nextDueDate = new Date(tx.nextDueDate);
            if (isPast(nextDueDate)) {
                // Add the transaction for the overdue date
                addTransaction({
                    type: tx.type,
                    amount: tx.amount,
                    description: tx.description,
                    category: tx.category,
                    date: tx.nextDueDate, // Log it for the date it was due
                });

                // Calculate the next due date
                let newNextDueDate: Date;
                switch (tx.frequency) {
                    case 'daily': newNextDueDate = addDays(nextDueDate, 1); break;
                    case 'weekly': newNextDueDate = addWeeks(nextDueDate, 1); break;
                    case 'monthly': newNextDueDate = addMonths(nextDueDate, 1); break;
                    case 'yearly': newNextDueDate = addYears(nextDueDate, 1); break;
                    default: newNextDueDate = addMonths(nextDueDate, 1);
                }

                // Update the recurring transaction's nextDueDate in the database
                const txRef = doc(firestore, 'users', userId, 'recurringTransactions', tx.id);
                batch.update(txRef, { nextDueDate: newNextDueDate.toISOString() });
                batchHasWrites = true;
            }
        }
        if (batchHasWrites) {
          await batch.commit();
        }
    };
    processRecurringTransactions();
  }, [recurringData, firestore, userId, addTransaction]);

  // Derived State
  const transactions = useMemo(() => {
    const all = [
      ...incomes.map(i => ({ ...i, type: 'income' as const })),
      ...expenses.map(e => ({ ...e, type: 'expense' as const }))
    ];
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, expenses]);

  const { budget, currentMonthExpenses } = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const currentMonth = format(today, "yyyy-MM");
    
    const currentMonthExpenses = expenses.filter(t => isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }));
    const currentBudget = budgetsData?.find(b => b.month === currentMonth) || null;

    return { budget: currentBudget, currentMonthExpenses };
  }, [expenses, budgetsData]);
  
  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);
  
  // Create default categories if none exist
  useEffect(() => {
    if (!loadingCategories && categories.length === 0 && userId && firestore) {
      const batch = writeBatch(firestore);
      defaultCategories.forEach(category => {
        const newCatRef = doc(collection(firestore, 'users', userId, 'categories'));
        batch.set(newCatRef, { ...category, userId });
      });
      batch.commit().catch(err => console.error("Failed to create default categories:", err));
    }
  }, [loadingCategories, categories.length, userId, firestore]);

  // Actions
  const deleteTransaction = (id: string, type: 'income' | 'expense') => {
    if (!userId || !firestore) return;
    const path = type === 'income' ? `users/${userId}/incomes/${id}` : `users/${userId}/expenses/${id}`;
    deleteDocumentNonBlocking(doc(firestore, path));
  };
  
  const clearTransactions = async (type: 'income' | 'expense') => {
    if (!userId || !firestore) return;
    const ref = type === 'income' ? incomesRef : expensesRef;
    if (!ref) return;

    const batch = writeBatch(firestore);
    const q = query(ref);
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  };

  const setBudget = (newBudget: { amount: number }) => {
    if (!userId || !firestore || !budgetsRef) return;
    const currentMonth = format(new Date(), "yyyy-MM");
    const existingBudget = budgetsData?.find(b => b.month === currentMonth);

    const budgetData = {
      userId,
      month: currentMonth,
      amount: Number(newBudget.amount),
    };

    if (existingBudget) {
      const docRef = doc(firestore, "users", userId, "budgets", existingBudget.id);
      setDocumentNonBlocking(docRef, budgetData, { merge: true });
    } else {
      addDocumentNonBlocking(budgetsRef, budgetData);
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'userId'>) => {
    if (!categoriesRef || !userId) return;
    addDocumentNonBlocking(categoriesRef, { ...category, userId });
  };

  const updateCategory = (category: Category) => {
    if (!userId || !firestore) return;
    const docRef = doc(firestore, "users", userId, "categories", category.id);
    const { id, ...categoryData } = category;
    setDocumentNonBlocking(docRef, categoryData, { merge: true });
  };

  const deleteCategory = (id: string) => {
    if (!userId || !firestore) return;
    const docRef = doc(firestore, "users", userId, "categories", id);
    deleteDocumentNonBlocking(docRef);
  };

  const updateUser = (data: Partial<UserData> & { monzoTokens?: FieldValue | undefined }) => {
    if (!userDocRef || !firestore || !userId) return;

    if (data.monzoTokens === undefined) {
      // Correctly delete the field using updateDoc and deleteField
      const userRef = doc(firestore, "users", userId);
      updateDocumentNonBlocking(userRef, { monzoTokens: deleteField() });
    } else {
      setDocumentNonBlocking(userDocRef, data, { merge: true });
    }
  };

  const resetData = () => {
    console.warn("Resetting all user data from Firestore is a destructive operation and should be implemented server-side for safety.");
  };

  const value = useMemo(() => ({
    transactions,
    incomes,
    expenses,
    currentMonthExpenses,
    addTransaction,
    deleteTransaction,
    clearTransactions,
    budget,
    setBudget,
    categories,
    incomeCategories,
    expenseCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    userData: userData || null,
    updateUser,
    resetData,
    isLoading: loadingUser || loadingIncomes || loadingExpenses || loadingBudgets || loadingRecurring,
    isLoadingCategories: loadingCategories,
  }), [transactions, incomes, expenses, currentMonthExpenses, addTransaction, budget, categories, incomeCategories, expenseCategories, userData, loadingUser, loadingIncomes, loadingExpenses, loadingBudgets, loadingCategories, loadingRecurring]);

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancials() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error("useFinancials must be used within a FinancialProvider");
  }
  return context;
}
