'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { Transaction, Budget, Income, Expense } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';

interface FinancialContextType {
  transactions: Transaction[];
  incomes: Income[];
  expenses: Expense[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  deleteTransaction: (id: string, type: 'income' | 'expense') => void;
  budget: Budget | null;
  setBudget: (budget: { amount: number }) => void;
  resetData: () => void;
  isLoading: boolean;
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

  // Fetching data from Firestore
  const { data: incomesData, isLoading: loadingIncomes } = useCollection<Income>(incomesRef);
  const { data: expensesData, isLoading: loadingExpenses } = useCollection<Expense>(expensesRef);
  const { data: budgetsData, isLoading: loadingBudgets } = useCollection<Budget>(budgetsRef);

  const incomes = useMemo(() => incomesData || [], [incomesData]);
  const expenses = useMemo(() => expensesData || [], [expensesData]);

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
