'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { Transaction, Budget, Income, Expense } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';

interface FinancialContextType {
  transactions: Transaction[];
  incomes: Income[];
  expenses: Expense[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  deleteTransaction: (id: string, type: 'income' | 'expense') => void;
  updateTransaction: (id: string, updates: Partial<Transaction>, type: 'income' | 'expense') => void;
  budget: Budget | null;
  setBudget: (budget: Omit<Budget, 'id' | 'userId' | 'month'> & { amount: number }) => void;
  resetData: () => void; // This will need to be re-evaluated
  isLoading: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userId = user?.uid;

  // Firestore collections references
  const incomesRef = useMemoFirebase(() => userId && firestore ? collection(firestore, 'users', userId, 'incomes') : null, [userId, firestore]);
  const expensesRef = useMemoFirebase(() => userId && firestore ? collection(firestore, 'users', userId, 'expenses') : null, [userId, firestore]);
  const budgetsRef = useMemoFirebase(() => userId && firestore ? collection(firestore, 'users', userId, 'budgets') : null, [userId, firestore]);

  const { data: incomes, isLoading: loadingIncomes } = useCollection<Income>(incomesRef);
  const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesRef);
  
  // For now, we fetch all budgets and find the current one. A query would be more efficient.
  const { data: budgets, isLoading: loadingBudgets } = useCollection<Budget>(budgetsRef);
  const budget = useMemo(() => {
    const currentMonth = format(new Date(), "yyyy-MM");
    return budgets?.find(b => b.month === currentMonth) || null;
  }, [budgets]);


  const transactions: Transaction[] = useMemo(() => {
    const combined: Transaction[] = [];
    if (incomes) {
      combined.push(...incomes.map(i => ({ ...i, type: 'income' } as Transaction)));
    }
    if (expenses) {
      combined.push(...expenses.map(e => ({ ...e, type: 'expense' } as Transaction)));
    }
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, expenses]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!userId || !firestore) return;
    const ref = transaction.type === 'income' ? incomesRef : expensesRef;
    if (!ref) return;
    
    const data = {
      ...transaction,
      userId,
      amount: Number(transaction.amount),
    };
    // remove type from data before saving
    delete (data as Partial<typeof data>).type;

    addDocumentNonBlocking(ref, data);
  };
  
  const deleteTransaction = (id: string, type: 'income' | 'expense') => {
    if (!userId || !firestore) return;
    const docRef = doc(firestore, 'users', userId, type === 'income' ? 'incomes' : 'expenses', id);
    deleteDocumentNonBlocking(docRef);
  };
  
  const updateTransaction = (id: string, updates: Partial<Transaction>, type: 'income' | 'expense') => {
    if (!userId || !firestore) return;
    const docRef = doc(firestore, 'users', userId, type === 'income' ? 'incomes' : 'expenses', id);
    updateDocumentNonBlocking(docRef, updates);
  };

  const setBudget = (newBudget: Omit<Budget, 'id'|'userId'|'month'> & { amount: number }) => {
    if (!userId || !firestore) return;
    const currentMonth = format(new Date(), "yyyy-MM");
    // Check if a budget for the current month already exists
    const existingBudget = budgets?.find(b => b.month === currentMonth);
    const budgetData = {
        ...newBudget,
        userId,
        month: currentMonth,
        amount: Number(newBudget.amount),
    };
    
    if (existingBudget) {
      // Update existing budget
      const docRef = doc(firestore, 'users', userId, 'budgets', existingBudget.id);
      setDocumentNonBlocking(docRef, budgetData, { merge: true });
    } else {
      // Add new budget
      if (budgetsRef) {
        addDocumentNonBlocking(budgetsRef, budgetData);
      }
    }
  };
  
  const resetData = () => {
    // This is more complex now. It would involve deleting all documents in user's subcollections.
    // This is a destructive operation and should be handled with care, possibly in a cloud function.
    // For now, we'll just log a warning.
    console.warn("Resetting all user data from Firestore is a destructive operation and should be implemented server-side for safety.");
  };

  const value = useMemo(() => ({
    transactions,
    incomes: incomes || [],
    expenses: expenses || [],
    addTransaction,
    deleteTransaction,
    updateTransaction,
    budget,
    setBudget,
    resetData,
    isLoading: loadingIncomes || loadingExpenses || loadingBudgets,
  }), [transactions, incomes, expenses, budget, loadingIncomes, loadingExpenses, loadingBudgets]);

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
