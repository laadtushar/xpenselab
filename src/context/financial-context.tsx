
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
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { defaultCategories } from '@/lib/default-categories';

interface FinancialContextType {
  transactions: Transaction[];
  incomes: Income[];
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  addTransaction: (transaction: Omit<Transaction, 'userId'>) => void;
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
  const { user } } from "@/firebase";
import { collection, doc, writeBatch, getDocs, query, FieldValue, updateDoc, deleteField } from "firebase/firestore";
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
} from "@/firebase/non-blocking-updates";
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { defaultCategories } from "@/lib/default-categories";

interface FinancialContextType {
  transactions: Transaction[];
  incomes: Income[];
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  addTransaction: (transaction: Omit>, updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  userData: UserData | null;
  updateUser: (data: Partial> {
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

  const addCategory = async (category: Omit => {
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

  const updateUser = (data: Partial) => {
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
  }), [transactions, incomes, expenses, currentMonthExpenses, budget, categories, incomeCategories, expenseCategories, userData, loadingUser, loadingIncomes, loadingExpenses, loadingBudgets, loadingCategories, loadingRecurring]);

  return (
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
