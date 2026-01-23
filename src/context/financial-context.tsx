
'use client';

import React, { createContext, useContext, useMemo, useEffect, useCallback, useState } from 'react';
import type { Transaction, Budget, Income, Expense, Category, User as UserData, RecurringTransaction } from '@/lib/types';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, FieldValue, updateDoc, deleteField, increment } from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, addYears, isPast } from 'date-fns';
import { defaultCategories } from '@/lib/default-categories';
import { siteConfig } from '@/config/site';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/context/encryption-context';

const AI_REQUEST_LIMIT = siteConfig.limits.aiRequestsPerDay;

interface FinancialContextType {
  transactions: Transaction[];
  incomes: Income[];
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (id: string, type: 'income' | 'expense', data: Partial<Omit<Transaction, 'id' | 'userId'>>) => void;
  deleteTransaction: (id: string, type: 'income' | 'expense') => void;
  clearTransactions: (type: 'income' | 'expense') => Promise<void>;
  
  budget: Budget | null;
  setBudget: (budget: { amount: number }) => void;
  
  incomeCategories: Category[];
  expenseCategories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  deleteUnusedCategories: (type: 'income' | 'expense') => Promise<void>;

  userData: UserData | null;
  updateUser: (data: Partial<UserData>) => void;
  
  resetData: () => void;
  isLoading: boolean;
  isLoadingCategories: boolean;

  canMakeAiRequest: () => { canRequest: boolean; reason: string; remaining?: number; };
  incrementAiRequestCount: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading: loadingUser } = useUser();
  const firestore = useFirestore();
  const userId = user?.uid;
  const { toast } = useToast();
  const { encryptionKey, isEncryptionEnabled, isUnlocked } = useEncryption();
  
  // CRITICAL: Validate encryption state before writes
  // If encryption is enabled but not unlocked, block all writes to prevent data leakage
  const validateEncryptionState = useCallback(() => {
    if (isEncryptionEnabled && !isUnlocked) {
      throw new Error('Encryption is enabled but not unlocked. Please unlock encryption before adding or modifying data.');
    }
  }, [isEncryptionEnabled, isUnlocked]);

  // Data References
  const userDocRef = useMemoFirebase(() => userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
  const incomesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'incomes') : null, [firestore, userId]);
  const expensesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'expenses') : null, [firestore, userId]);
  const categoriesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'categories') : null, [firestore, userId]);
  const budgetsRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'budgets') : null, [firestore, userId]);
  const recurringRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'recurringTransactions') : null, [firestore, userId]);

  // Data Fetching - pass encryption key if encryption is enabled and unlocked
  const encryptionKeyForHooks = isEncryptionEnabled && isUnlocked ? encryptionKey : null;
  const { data: userData, isLoading: isLoadingUser } = useDoc<UserData>(userDocRef, encryptionKeyForHooks);
  const { data: incomesData, isLoading: loadingIncomes } = useCollection<Income>(incomesRef, encryptionKeyForHooks);
  const { data: expensesData, isLoading: loadingExpenses } = useCollection<Expense>(expensesRef, encryptionKeyForHooks);
  const { data: categoriesData, isLoading: loadingCategories } = useCollection<Category>(categoriesRef, encryptionKeyForHooks);
  const { data: budgetsData, isLoading: loadingBudgets } = useCollection<Budget>(budgetsRef, encryptionKeyForHooks);
  const { data: recurringData, isLoading: loadingRecurring } = useCollection<RecurringTransaction>(recurringRef, encryptionKeyForHooks);
  
  const incomes = useMemo(() => incomesData || [], [incomesData]);
  const expenses = useMemo(() => expensesData || [], [expensesData]);
  
  // Create default categories if the flag is not set for the user
  useEffect(() => {
    const createDefaults = async () => {
      if (user && userData && !userData.hasCreatedDefaultCategories && firestore) {
        console.log("Creating default categories for user:", user.uid);
        const userRef = doc(firestore, "users", user.uid);
        const categoriesColRef = collection(userRef, "categories");

        const batch = writeBatch(firestore);

        defaultCategories.forEach(category => {
          const newCatRef = doc(categoriesColRef);
          batch.set(newCatRef, { ...category, userId: user.uid });
        });

        // Set the flag to true in the same batch
        batch.update(userRef, { hasCreatedDefaultCategories: true });

        try {
          await batch.commit();
          console.log("Successfully created default categories and set flag.");
        } catch (err) {
          console.error("Failed to create default categories:", err);
        }
      }
    };
    createDefaults();
  }, [user, userData, firestore]);
  
  // ONE-TIME: Clean up duplicate categories
  useEffect(() => {
    const cleanupDuplicateCategories = async () => {
        if (!firestore || !userId || !categoriesData || userData?.hasRunCategoryCleanup) {
            return;
        }

        console.log("Running one-time category cleanup...");

        const categoriesByName = new Map<string, Category[]>();
        categoriesData.forEach(cat => {
            const key = `${cat.name}_${cat.type}`;
            if (!categoriesByName.has(key)) {
                categoriesByName.set(key, []);
            }
            categoriesByName.get(key)!.push(cat);
        });

        const batch = writeBatch(firestore);
        let duplicatesFound = false;

        categoriesByName.forEach((cats, key) => {
            if (cats.length > 1) {
                duplicatesFound = true;
                // Keep the first one, delete the rest
                const [first, ...duplicates] = cats;
                duplicates.forEach(dup => {
                    const docRef = doc(firestore, 'users', userId, 'categories', dup.id);
                    batch.delete(docRef);
                });
            }
        });

        if (duplicatesFound) {
            try {
                // Also set a flag to not run this again
                batch.update(doc(firestore, 'users', userId), { hasRunCategoryCleanup: true });
                await batch.commit();
                toast({
                    title: "Database Cleanup",
                    description: "Successfully removed duplicate categories."
                });
            } catch (error) {
                console.error("Error cleaning up duplicate categories:", error);
                toast({
                    title: "Cleanup Failed",
                    description: "Could not remove duplicate categories.",
                    variant: "destructive"
                });
            }
        } else {
            // No duplicates found, just set the flag so we don't run this check again
            await updateDocumentNonBlocking(doc(firestore, 'users', userId), { hasRunCategoryCleanup: true }, encryptionKeyForHooks);
        }
    };

    cleanupDuplicateCategories();
  }, [firestore, userId, categoriesData, userData, toast]);


  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!userId) return;
    // CRITICAL: Validate encryption state before write
    validateEncryptionState();
    const ref = transaction.type === 'income' ? incomesRef : expensesRef;
    if (ref) {
      addDocumentNonBlocking(ref, { ...transaction, userId }, encryptionKeyForHooks);
    }
  }, [userId, incomesRef, expensesRef, encryptionKeyForHooks, validateEncryptionState]);
  
  // Handle Recurring Transactions
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
  
  const incomeCategories = useMemo(() => {
    if (!categoriesData) return [];
    const uniqueIds = new Set<string>();
    return categoriesData.filter(cat => {
        if (cat.type === 'income' && !uniqueIds.has(cat.id)) {
            uniqueIds.add(cat.id);
            return true;
        }
        return false;
    });
  }, [categoriesData]);

  const expenseCategories = useMemo(() => {
    if (!categoriesData) return [];
    const uniqueIds = new Set<string>();
    return categoriesData.filter(cat => {
        if (cat.type === 'expense' && !uniqueIds.has(cat.id)) {
            uniqueIds.add(cat.id);
            return true;
        }
        return false;
    });
  }, [categoriesData]);
  
  // Actions
  const updateTransaction = (id: string, type: 'income' | 'expense', data: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
    if (!userId || !firestore) return;
    // CRITICAL: Validate encryption state before write
    validateEncryptionState();
    const path = type === 'income' ? `users/${userId}/incomes/${id}` : `users/${userId}/expenses/${id}`;
    updateDocumentNonBlocking(doc(firestore, path), data, encryptionKeyForHooks);
  };

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
    // CRITICAL: Validate encryption state before write
    validateEncryptionState();
    const currentMonth = format(new Date(), "yyyy-MM");
    const existingBudget = budgetsData?.find(b => b.month === currentMonth);

    const budgetData = {
      userId,
      month: currentMonth,
      amount: Number(newBudget.amount),
    };

    if (existingBudget) {
      const docRef = doc(firestore, "users", userId, "budgets", existingBudget.id);
      setDocumentNonBlocking(docRef, budgetData, { merge: true }, encryptionKeyForHooks);
    } else {
      addDocumentNonBlocking(budgetsRef, budgetData, encryptionKeyForHooks);
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'userId'>) => {
    if (!categoriesRef || !userId) return;
    // CRITICAL: Validate encryption state before write
    validateEncryptionState();
    addDocumentNonBlocking(categoriesRef, { ...category, userId }, encryptionKeyForHooks);
  };

  const updateCategory = (category: Category) => {
    if (!userId || !firestore) return;
    // CRITICAL: Validate encryption state before write
    validateEncryptionState();
    const docRef = doc(firestore, "users", userId, "categories", category.id);
    const { id, ...categoryData } = category;
    setDocumentNonBlocking(docRef, categoryData, { merge: true }, encryptionKeyForHooks);
  };

  const deleteCategory = (id: string) => {
    if (!userId || !firestore) return;
    const docRef = doc(firestore, "users", userId, "categories", id);
    deleteDocumentNonBlocking(docRef);
  };

  const deleteUnusedCategories = useCallback(async (type: 'income' | 'expense') => {
    if (!userId || !firestore) return;

    const relevantTransactions = type === 'income' ? incomes : expenses;
    const relevantCategories = type === 'income' ? incomeCategories : expenseCategories;

    const usedCategoryNames = new Set(relevantTransactions.map(t => t.category));
    
    const unusedCategories = relevantCategories.filter(cat => !usedCategoryNames.has(cat.name));

    if (unusedCategories.length === 0) {
      toast({
        title: "No Unused Categories",
        description: `All ${type} categories are currently in use.`,
      });
      return;
    }

    const batch = writeBatch(firestore);
    const categoriesCollectionRef = collection(firestore, 'users', userId, 'categories');

    unusedCategories.forEach(category => {
      const docRef = doc(categoriesCollectionRef, category.id);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      toast({
        title: "Success",
        description: `Removed ${unusedCategories.length} unused ${type} categories.`,
      });
    } catch (error) {
      console.error("Failed to delete unused categories:", error);
      toast({
        title: "Error",
        description: "An error occurred while removing unused categories.",
        variant: "destructive",
      });
    }
  }, [userId, firestore, incomes, expenses, incomeCategories, expenseCategories, toast]);

  const updateUser = (data: Partial<UserData>) => {
    if (!userDocRef || !firestore || !userId) return;
    // CRITICAL: Validate encryption state before write (unless updating non-encrypted fields only)
    // Note: User fields are no longer encrypted (bank integrations removed)
    // If encryption is re-enabled in the future, add validation here

    setDocumentNonBlocking(userDocRef, data, { merge: true }, encryptionKeyForHooks);
  };

  const canMakeAiRequest = useCallback(() => {
    if (isLoadingUser || !userData) {
      return { canRequest: false, reason: 'User data not loaded.' };
    }
    if (userData.tier !== 'premium') {
      return { canRequest: false, reason: 'Upgrade to premium to use AI features.' };
    }
    const today = format(new Date(), 'yyyy-MM-dd');
    const requestCount = userData.lastAiRequestDate === today ? (userData.aiRequestCount || 0) : 0;
    
    if (requestCount >= AI_REQUEST_LIMIT) {
      return { canRequest: false, reason: `You have reached your daily limit of ${AI_REQUEST_LIMIT} AI requests.` };
    }

    return { canRequest: true, reason: '', remaining: AI_REQUEST_LIMIT - requestCount };
  }, [userData, isLoadingUser]);


  const incrementAiRequestCount = useCallback(() => {
    if (!userDocRef || !userData) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    if (userData.lastAiRequestDate === today) {
        updateDocumentNonBlocking(userDocRef, {
            aiRequestCount: increment(1)
        }, encryptionKeyForHooks);
    } else {
        updateDocumentNonBlocking(userDocRef, {
            aiRequestCount: 1,
            lastAiRequestDate: today
        }, encryptionKeyForHooks);
    }
  }, [userDocRef, userData]);


  const resetData = () => {
    console.warn("Resetting all user data from Firestore is a destructive operation and should be implemented server-side for safety.");
  };

  const value = useMemo(() => ({
    transactions,
    incomes,
    expenses,
    currentMonthExpenses,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearTransactions,
    budget,
    setBudget,
    incomeCategories,
    expenseCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteUnusedCategories,
    userData: userData || null,
    updateUser,
    resetData,
    isLoading: loadingUser || loadingIncomes || loadingExpenses || loadingBudgets || loadingCategories || loadingRecurring || isLoadingUser,
    isLoadingCategories: loadingCategories,
    canMakeAiRequest,
    incrementAiRequestCount,
  }), [transactions, incomes, expenses, currentMonthExpenses, addTransaction, budget, incomeCategories, expenseCategories, userData, loadingUser, loadingIncomes, loadingExpenses, loadingBudgets, loadingCategories, loadingRecurring, isLoadingUser, canMakeAiRequest, incrementAiRequestCount, deleteTransaction, updateTransaction, updateUser, setBudget, addCategory, updateCategory, deleteCategory, deleteUnusedCategories, encryptionKeyForHooks]);

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

// Custom hook to manage AI request logic
export const useAiRequest = <T, U>(
  aiFlow: (input: T) => Promise<U>
) => {
  const { canMakeAiRequest, incrementAiRequestCount } = useFinancials();
  const { isEncryptionEnabled, isUnlocked } = useEncryption();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const makeRequest = useCallback(async (input: T): Promise<U | null> => {
    // Check if encryption is enabled but not unlocked
    if (isEncryptionEnabled && !isUnlocked) {
      toast({
        title: "Encryption Locked",
        description: "Please unlock encryption in settings to use AI features.",
        variant: "destructive",
      });
      return null;
    }
    
    const { canRequest, reason } = canMakeAiRequest();
    if (!canRequest) {
      toast({
        title: "Cannot perform AI request",
        description: reason,
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    try {
      const result = await aiFlow(input);
      incrementAiRequestCount();
      return result;
    } catch (error: any) {
      console.error("AI flow failed:", error);
      toast({
        title: "AI Assistant Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [aiFlow, canMakeAiRequest, incrementAiRequestCount, toast, isEncryptionEnabled, isUnlocked]);

  return { makeRequest, isLoading };
};
