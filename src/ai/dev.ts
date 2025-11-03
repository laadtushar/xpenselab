
import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-expenses.ts';
import '@/ai/flows/budgeting-assistance.ts';
import '@/ai/flows/monzo-exchange-token.ts';
import '@/ai/flows/monzo-list-accounts.ts';
import '@/ai/flows/monzo-list-transactions.ts';
