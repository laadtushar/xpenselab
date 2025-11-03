

export type User = {
    id: string;
    email: string;
    createdAt: string; // ISO string
    currency?: string;
    tier?: 'basic' | 'premium';
    monzoTokens?: {
        accessToken: string;
        refreshToken: string;
        expiresAt: string;
    }
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // ISO string
  description: string;
  category?: string; // name of the category
};

export type Income = Omit<Transaction, 'type' | 'category'> & { category: string };
export type Expense = Omit<Transaction, 'type'> & { category: string };


export type Budget = {
  id: string;
  userId: string;
  amount: number;
  month: string; // YYYY-MM
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  icon: string; // lucide-react icon name
  type: 'income' | 'expense';
}

export type RecurringTransaction = {
    id: string;
    userId: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: string; // ISO string
    nextDueDate: string; // ISO string
};

export type FinancialInsight = {
    id: string;
    userId: string;
    generatedAt: string; // ISO string
    summary: string;
    suggestions: string[];
};

// Types for Split functionality
export type Group = {
  id: string;
  name: string;
  members: string[]; // array of user UIDs
  memberDetails: { [uid: string]: { email: string; name?: string | null } };
  createdBy: string;
  createdAt: string; // ISO string
};

export type SharedExpense = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // user UID
  date: string; // ISO string
  splits: {
    userId: string; // user UID
    amount: number;
  }[];
};

export type Debt = {
  id: string;
  fromUserId: string; // Can be a real UID or a virtual ID
  toUserId: string; // Can be a real UID or a virtual ID
  fromUserName?: string;
  toUserName?: string;
  amount: number;
  description: string;
  settled: boolean;
  createdBy: string; // The real UID of the user who created the record
};

export type MemberBalance = {
  userId: string;
  name: string;
  email: string;
  balance: number;
};

// Monzo Types
export interface MonzoAccount {
  id: string;
  description: string;
  type: 'uk_retail' | 'uk_retail_joint' | 'uk_business';
  created: string;
}

export interface MonzoTransaction {
  id: string;
  created: string;
  description: string;
  amount: number; // in pennies
  currency: string;
  merchant: {
    id: string;
    name: string;
    logo: string;
    category: string;
  } | null;
  notes: string;
  settled: string;
  category: string;
}
