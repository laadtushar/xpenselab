# XpenseLab Application Guide

This document provides a detailed overview of the XpenseLab application, its features, architecture, and project structure.

## 1. Introduction

XpenseLab is a comprehensive personal finance management tool designed to provide users with a clear and intelligent way to track their income, expenses, budgets, and shared debts. It leverages a modern web stack and integrates AI to automate and simplify financial management.

## 2. Core Features

### 2.1. Financial Tracking
- **Dashboard:** The main landing page provides a summary of total income, expenses, and net savings. It features a 7-day overview chart and a list of recent transactions.
- **Income & Expenses:** Dedicated pages for logging and viewing all personal income and expense records. Supports filtering by description, category, and date range, as well as sorting.
- **Budgeting:** Users can set a monthly budget. A progress tracker visualizes spending against the set budget and highlights top spending categories.

### 2.2. Categorization
- **Custom Categories:** Users can create, edit, and delete their own categories for both income and expenses, choosing from a wide range of icons.
- **AI Auto-Categorization:** When adding an expense, the description is sent to a Genkit AI flow (`categorizeExpense`) which suggests an appropriate category, streamlining the data entry process.

### 2.3. Shared Finances
- **Groups & Expense Splitting:** Users can create groups with other people (real or virtual users via email). Within a group, they can log shared expenses, specify who paid, and how the cost should be split among members.
- **Balance Tracking:** The application automatically calculates balances within each group, showing who owes whom.
- **Individual Debts:** A separate feature for tracking simple one-on-one debts that are not tied to a specific group expense.

### 2.4. Integrations & Data Management
- **Data Import:** Users can import historical transaction data from CSV, TSV, or XLSX files. The importer is designed to be flexible with column headers.
- **Report Generation:** Users can export their transaction data as a CSV file for a selected date range.

### 2.5. AI & Security
- **Budgeting Assistant:** An AI-powered feature that analyzes a user's spending habits and provides actionable advice and recommendations for budget improvements.
- **Firebase Security:** The app is secured using Firebase Authentication and detailed Firestore Security Rules, ensuring users can only access their own data.
- **App Check:** Firebase App Check is integrated with reCAPTCHA v3 to protect backend resources from abuse by verifying that requests come from the genuine application.

## 3. Technical Architecture

- **Framework:** **Next.js 15 (App Router)** is used for its powerful hybrid rendering capabilities, file-based routing, and React Server Components.
- **Language:** **TypeScript** is used throughout the project for type safety and improved developer experience.
- **Styling:** **Tailwind CSS** is used for utility-first styling, with **ShadCN/UI** providing a set of pre-built, accessible, and customizable components. The theme is defined in `src/app/globals.css`.
- **Backend-as-a-Service (BaaS):** **Firebase** provides the backend infrastructure.
  - **Firebase Authentication:** Handles user sign-up and sign-in (Google & GitHub).
  - **Firestore:** A NoSQL database used to store all user data, including transactions, categories, groups, and debts.
- **Generative AI:** **Genkit** is used to create and manage server-side AI flows that connect to Google's Gemini models for features like expense categorization and financial advice.

## 4. Project Structure

Below is an overview of the key directories and their purpose.

```
/
├── docs/
│   ├── backend.json         # Defines data entities and Firestore structure.
│   └── APPLICATION_GUIDE.md # This file.
├── firestore.rules          # Security rules for the Firestore database.
├── public/                  # Static assets.
├── src/
│   ├── app/                 # Next.js App Router pages and layouts.
│   │   ├── (app)/           # Authenticated routes (dashboard, expenses, etc.).
│   │   ├── (auth)/          # Authentication routes (login).
│   │   ├── layout.tsx       # Root layout.
│   │   └── page.tsx         # Root page (redirects to /login).
│   ├── components/          # Reusable React components.
│   │   ├── budget/          # Components related to budgeting.
│   │   ├── categories/      # Components for managing categories.
│   │   ├── shared/          # Components used across multiple features.
│   │   └── ui/              # Core UI components from ShadCN.
│   ├── context/
│   │   └── financial-context.tsx # React context for managing all financial data.
│   ├── firebase/
│   │   ├── config.ts        # Firebase project configuration.
│   │   ├── index.ts         # Main Firebase initialization and exports.
│   │   ├── provider.tsx     # Core Firebase context provider and hooks.
│   │   └── ...              # Other Firebase-related hooks and utilities.
│   ├── hooks/
│   │   └── use-toast.ts     # Custom hook for showing toast notifications.
│   ├── lib/
│   │   ├── types.ts         # Core TypeScript types for the application.
│   │   ├── utils.ts         # Utility functions (e.g., `cn`, `formatCurrency`).
│   │   └── ...
│   └── ai/
│       ├── genkit.ts        # Genkit initialization.
│       └── flows/           # Directory for all Genkit AI flows.
└── ...
```

### Key Files & Concepts

- **`src/context/financial-context.tsx`**: This is the heart of the application's client-side state management. The `FinancialProvider` fetches all necessary user data (transactions, categories, budgets) from Firestore and provides it to the rest of the app via the `useFinancials` hook. It also contains the logic for adding, updating, and deleting data.

- **`src/firebase/provider.tsx`**: This file sets up the core Firebase context. The `FirebaseProvider` initializes the Firebase SDK and user authentication state, making services like `auth` and `firestore` available throughout the app via hooks like `useAuth()`, `useFirestore()`, and `useUser()`.

- **`src/ai/flows/`**: This directory contains all server-side Genkit flows. Each flow is a self-contained module that defines its input/output schemas (using Zod) and orchestrates calls to an AI model to perform a specific task.

- **`docs/backend.json`**: This file acts as a blueprint for the application's data model. It defines the schema for each data entity (like `User`, `Expense`, `Group`) and maps these entities to specific paths in the Firestore database. It serves as a single source of truth for the data structure.

- **`firestore.rules`**: This file defines the security rules for the Firestore database. It is critical for ensuring data privacy and security, specifying who can read, write, update, or delete data at every path in the database.
