# XpenseLab - Personal Finance Tracker

Welcome to XpenseLab, a modern and intelligent application for managing your personal finances. This application is built with a powerful stack including Next.js, Firebase, and Genkit, providing a robust platform for tracking income, expenses, budgets, and more.

For a detailed technical overview, project structure, and feature breakdown, please see the [**Application Guide**](./docs/APPLICATION_GUIDE.md).

## ✨ Core Features

- **Dashboard:** An at-a-glance overview of your financial health, including recent transactions and an income vs. expense chart.
- **Transaction Management:** Add, view, and manage your income and expenses with detailed information.
- **AI-Powered Categorization:** Expenses are automatically categorized using a Genkit AI flow to save you time.
- **Budgeting:** Set monthly budgets and track your spending progress against them.
- **Custom Categories:** Create and customize your own income and expense categories with unique icons.
- **Expense Splitting:** Create groups with friends or family to easily split shared expenses.
- **Debt Tracking:** Log and manage one-on-one debts.
- **Bank Integration:** Connect your Monzo bank account to automatically import transactions (via OAuth2).
- **Data Import/Export:** Import transactions from a CSV/XLSX file and export financial reports.
- **Secure Authentication:** User accounts are secured with Firebase Authentication, supporting Google and GitHub providers.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **UI:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [ShadCN/UI](https://ui.shadcn.com/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit)
- **Deployment:** Firebase App Hosting

## 🚀 Getting Started

The application is designed to be run within the Firebase Studio environment.

1.  **Environment Variables:** Before running, ensure your `.env` file is populated with the necessary keys, particularly the `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` for Firebase App Check.
2.  **Dependencies:** All required packages are listed in `package.json` and are installed automatically.
3.  **Run the App:** Use the standard `dev` script to start the Next.js development server:
    ```bash
    npm run dev
    ```

For more in-depth information, refer to the [**Application Guide**](./docs/APPLICATION_GUIDE.md).
