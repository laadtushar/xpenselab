

export type User = {
  id: string;
  email: string;
  createdAt: string; // ISO string
  currency?: string;
  tier?: 'basic' | 'premium';
  saltEdgeCustomerId?: string;
  saltEdgeConnections?: {
    connectionId: string;
    providerCode: string;
    providerName: string;
    status: string;
    createdAt: string;
  }[];
  aiRequestCount?: number;
  lastAiRequestDate?: string; // YYYY-MM-DD
  hasCreatedDefaultCategories?: boolean;
  hasRunCategoryCleanup?: boolean;
  monzoTokens?: {
    access_token: string;
    client_id: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    user_id: string;
  };
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

// Salt Edge Types
export interface SaltEdgeAccount {
  id: string;
  connection_id: string;
  name: string;
  nature: string;
  balance: number;
  currency_code: string;
  extra?: {
    account_number?: string;
    iban?: string;
    sort_code?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SaltEdgeTransaction {
  id: string;
  connection_id: string;
  account_id: string;
  made_on: string;
  amount: number;
  currency_code: string;
  description: string;
  category?: string;
  subcategory?: string;
  duplicated?: boolean;
  mode?: string;
  status?: string;
  extra?: {
    original_amount?: number;
    original_currency_code?: string;
    merchant?: {
      name?: string;
      logo?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface SaltEdgeConnection {
  id: string;
  customer_id: string;
  provider_code: string;
  provider_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Loan/EMI Types
export type Loan = {
  id: string;
  userId: string;
  lender: string;
  initialAmount: number;
  amountRemaining: number;
  interestRate: number; // Annual percentage rate
  termMonths: number;
  startDate: string; // ISO string
  status: 'active' | 'paid';
};

export type Repayment = {
  id: string;
  loanId: string;
  amount: number;
  date: string; // ISO string
  notes?: string;
};
