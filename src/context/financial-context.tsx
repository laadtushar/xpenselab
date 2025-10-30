"use client";

import React, { createContext, useContext, useMemo } from 'react';
import type { Transaction, Budget } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface FinancialContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  budget: Budget | null;
  setBudget: (budget: Omit<Budget, 'id'>) => void;
  resetData: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [budget, setBudgetState] = useLocalStorage<Budget | null>('budget', null);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions((prev) => [...prev, newTransaction]);
  };
  
  const addTransactions = (transactions: Omit<Transaction, 'id'>[]) => {
    const newTransactions = transactions.map(t => ({ ...t, id: crypto.randomUUID() }));
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter(t => t.id !== id));
  };
  
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const setBudget = (newBudget: Omit<Budget, 'id'>) => {
    setBudgetState({ ...newBudget, id: crypto.randomUUID() });
  };
  
  const resetData = () => {
    setTransactions([]);
    setBudgetState(null);
  };

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    addTransactions,
    deleteTransaction,
    updateTransaction,
    budget,
    setBudget,
    resetData,
  }), [transactions, budget]);

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
