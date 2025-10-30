
'use client';

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import type { Transaction, Budget, Income, Expense, Category } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';
import { defaultCategories } from '@/lib/default-categories';

interface FinancialContextType {
  transactions: Transaction[];
  incomes: Income[];
  expenses: Expense[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  deleteTransaction: (id: string, type: 'income' | 'expense') => void;
  
  budget: Budget | null;
  setBudget: (budget: { amount: number }) => void;
  
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  
  resetData: () => void;
  isLoading: boolean;
  isLoadingCategories: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const userId = user?.uid;

  // Firestore collection references
  const incomesRef = useMemoFirebase(() => userId && firestore ? collection(firestore, 'users', userId, 'incomes') : null, [userId, firestore]);
  const expensesRef = useMemoFirebase(() => userId && firestore ? collection(firestore, 'users', userId, 'expenses') : null, [userId, firestore]);
  const budgetsRef = useMemoFirebase(() => userId && firestore ? collection(firestore, 'users', userId, 'budgets') : null, [userId, firestore]);
  const categoriesRef = useMemoFirebase(() => userId && firestore ? collection(firestore, 'users', userId, 'categories') : null, [userId, firestore]);

  // Fetching data from Firestore
  const { data: incomesData, isLoading: loadingIncomes } = useCollection<Income>(incomesRef);
  const { data: expensesData, isLoading: loadingExpenses } = useCollection<Expense>(expensesRef);
  const { data: budgetsData, isLoading: loadingBudgets } = useCollection<Budget>(budgetsRef);
  const { data: categoriesData, isLoading: loadingCategories } = useCollection<Category>(categoriesRef);

  // Seed default categories for new users
  useEffect(() => {
    if (firestore && userId && !loadingCategories && categoriesData?.length === 0) {
      const batch = writeBatch(firestore);
      defaultCategories.forEach(category => {
        const docRef = doc(collection(firestore, 'users', userId, 'categories'));
        batch.set(docRef, { ...category, userId });
      });
      batch.commit();
    }
  }, [firestore, userId, categoriesData, loadingCategories]);

  const incomes = useMemo(() => incomesData || [], [incomesData]);
  const expenses = useMemo(() => expensesData || [], [expensesData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);
  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);

  const transactions: Transaction[] = useMemo(() => {
    const combined: Transaction[] = [
      ...incomes.map(i => ({ ...i, type: 'income' } as Transaction)),
      ...expenses.map(e => ({ ...e, type: 'expense' } as Transaction)),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, expenses]);

  const budget = useMemo(() => {
    if (!budgetsData) return null;
    const currentMonth = format(new Date(), 'yyyy-MM');
    return budgetsData.find(b => b.month === currentMonth) || null;
  }, [budgetsData]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!userId || !firestore) return;
    const ref = transaction.type === 'income' ? incomesRef : expensesRef;
    if (!ref) return;
    
    const data = { ...transaction, userId, amount: Number(transaction.amount) };
    // @ts-ignore
    delete data.type;

    addDocumentNonBlocking(ref, data);
  };
  
  const deleteTransaction = (id: string, type: 'income' | 'expense') => {
    if (!userId || !firestore) return;
    const docRef = doc(firestore, 'users', userId, type === 'income' ? 'incomes' : 'expenses', id);
    deleteDocumentNonBlocking(docRef);
  };
  
  const setBudget = (newBudget: { amount: number }) => {
    if (!userId || !firestore || !budgetsRef) return;
    const currentMonth = format(new Date(), 'yyyy-MM');
    const existingBudget = budgetsData?.find(b => b.month === currentMonth);
    
    const budgetData = {
      userId,
      month: currentMonth,
      amount: Number(newBudget.amount),
    };

    if (existingBudget) {
      const docRef = doc(firestore, 'users', userId, 'budgets', existingBudget.id);
      setDocumentNonBlocking(docRef, budgetData, { merge: true });
    } else {
      addDocumentNonBlocking(budgetsRef, budgetData);
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'userId'>) => {
    if (!userId || !categoriesRef) return;
    await addDocumentNonBlocking(categoriesRef, { ...category, userId });
  };

  const updateCategory = (category: Category) => {
    if (!userId || !firestore) return;
    const docRef = doc(firestore, 'users', userId, 'categories', category.id);
    const { id, ...categoryData } = category;
    setDocumentNonBlocking(docRef, categoryData, { merge: true });
  };

  const deleteCategory = (id: string) => {
    if (!userId || !firestore) return;
    // TODO: Add warning about expenses with this category
    const docRef = doc(firestore, 'users', userId, 'categories', id);
    deleteDocumentNonBlocking(docRef);
  };
  
  const resetData = () => {
    console.warn("Resetting all user data from Firestore is a destructive operation and should be implemented server-side for safety.");
  };

  const value = useMemo(() => ({
    transactions,
    incomes,
    expenses,
    addTransaction,
    deleteTransaction,
    budget,
    setBudget,
    categories,
    incomeCategories,
    expenseCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    resetData,
    isLoading: loadingIncomes || loadingExpenses || loadingBudgets,
    isLoadingCategories: loadingCategories,
  }), [transactions, incomes, expenses, budget, categories, incomeCategories, expenseCategories, loadingIncomes, loadingExpenses, loadingBudgets, loadingCategories]);

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancials() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
}
