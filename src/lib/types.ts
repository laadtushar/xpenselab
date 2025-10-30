export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // ISO string
  description: string;
  category?: string;
};

export type Budget = {
  id: string;
  amount: number;
  month: string; // YYYY-MM
};

export const expenseCategories = [
  "Groceries", "Rent", "Utilities", "Transportation", "Entertainment", 
  "Dining Out", "Shopping", "Travel", "Healthcare", "Education", 
  "Personal Care", "Bills", "Subscriptions", "Food & Drink",
  "Health & Wellbeing", "Education Loan Repayment", "Gifts", "Other"
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

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
  fromUserId: string;
  toUserId: string;
  amount: number;
  groupId: string;
};

export type MemberBalance = {
  userId: string;
  name: string;
  email: string;
  balance: number;
};
