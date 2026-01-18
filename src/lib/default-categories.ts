

import type { Category } from "./types";

type DefaultCategory = Omit<Category, 'id' | 'userId'>;

export const defaultCategories: DefaultCategory[] = [
    // Expenses
    { name: 'Groceries', icon: 'ShoppingCart', type: 'expense' },
    { name: 'Rent', icon: 'Home', type: 'expense' },
    { name: 'Utilities', icon: 'Zap', type: 'expense' },
    { name: 'Transportation', icon: 'Car', type: 'expense' },
    { name: 'Entertainment', icon: 'Ticket', type: 'expense' },
    { name: 'Dining Out', icon: 'UtensilsCrossed', type: 'expense' },
    { name: 'Shopping', icon: 'ShoppingBag', type: 'expense' },
    { name: 'Travel', icon: 'Plane', type: 'expense' },
    { name: 'Healthcare', icon: 'Stethoscope', type: 'expense' },
    { name: 'Education', icon: 'GraduationCap', type: 'expense' },
    { name: 'Personal Care', icon: 'Smile', type: 'expense' },
    { name: 'Bills', icon: 'Receipt', type: 'expense' },
    { name: 'Subscriptions', icon: 'CreditCard', type: 'expense' },
    { name: 'Gifts', icon: 'Gift', type: 'expense' },
    { name: 'Loan Repayment', icon: 'HandCoins', type: 'expense' },
    { name: 'Bad Debt', icon: 'FileX', type: 'expense' },
    { name: 'Other', icon: 'MoreHorizontal', type: 'expense' },

    // Income
    { name: 'Salary', icon: 'HandCoins', type: 'income' },
    { name: 'Freelance', icon: 'Briefcase', type: 'income' },
    { name: 'Investment', icon: 'BarChart', type: 'income' },
    { name: 'Gift', icon: 'Gift', type: 'income' },
    { name: 'Loan', icon: 'Landmark', type: 'income' },
    { name: 'Other', icon: 'MoreHorizontal', type: 'income' },
];
