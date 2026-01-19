

export type TimeGrain = 'day' | 'week' | 'month' | 'year';

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
  // Encryption fields
  isEncrypted?: boolean; // Indicates encryption is enabled
  encryptionEnabledAt?: string; // ISO string timestamp
  migrationState?: {
    lastProcessedId?: string;
    totalProcessed: number;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  };
  // Recovery codes: array of recovery code hashes (SHA-256 hashes)
  recoveryCodeHashes?: string[]; // SHA-256 hashes of recovery codes
  recoveryCodeSalt?: string; // Base64-encoded salt for deriving recovery code keys
  encryptedMainCodes?: string[]; // Main code encrypted with each recovery code's key
  // Encryption salt: stored in Firestore for cross-browser compatibility
  encryptionSalt?: string; // Base64-encoded salt for deriving main encryption key
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

// Monzo Types
export type MonzoAccount = {
  id: string;
  description: string;
  created: string;
  type: string;
  currency: string;
  country_code: string;
  owners: {
    user_id: string;
    preferred_name: string;
    preferred_first_name: string;
  }[];
  account_number?: string;
  sort_code?: string;
};

export type MonzoTransaction = {
  id: string;
  created: string;
  description: string;
  amount: number;
  fees: {
    [key: string]: number;
  };
  currency: string;
  merchant?: {
    id: string;
    group_id: string;
    name: string;
    logo: string;
    emoji: string;
    category: string;
    online: boolean;
    atm: boolean;
    address: {
      short_formatted: string;
      formatted: string;
      address: string;
      city: string;
      region: string;
      country: string;
      postcode: string;
      latitude: number;
      longitude: number;
      zoom_level: number;
      approximate: boolean;
    };
    created: string;
    updated: string;
    metadata: {
      [key: string]: string;
    };
    disable_feedback: boolean;
  } | null;
  notes: string;
  metadata: {
    [key: string]: string;
  };
  account_balance: number;
  attachments: {
    created: string;
    external_id: string;
    file_type: string;
    file_url: string;
    id: string;
    type: string;
    url: string;
    user_id: string;
  }[];
  category: string;
  is_load: boolean;
  settled: string; // ISO string
  local_amount: number;
  local_currency: string;
  updated: string;
  account_id: string;
  user_id: string;
  counterparty?: {
    account_number: string;
    name: string;
    sort_code: string;
    user_id: string;
  };
  scheme: string;
  dedupe_id: string;
  originator: boolean;
  include_in_spending: boolean;
  can_be_excluded_from_breakdown: boolean;
  can_be_made_subscription: boolean;
  can_split_the_bill: boolean;
  can_add_to_tab: boolean;
  amount_is_pending: boolean;
};
