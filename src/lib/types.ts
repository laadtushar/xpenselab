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
