export type Transaction = {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // ISO string
  description: string;
  category?: string; // name of the category
};

export type Income = Omit<Transaction, 'type' | 'category'>;
export type Expense = Omit<Transaction, 'type'>;


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
}

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
