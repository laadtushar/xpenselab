
"use client";

import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ReportGenerator } from "@/components/reports/report-generator";
import { SpendingByCategoryChart } from "@/components/reports/spending-by-category-chart";
import { FinancialTrendsChart } from "@/components/reports/financial-trends-chart"; // Renamed from MonthlyTrendsChart
import { IncomeExpenseBarChart } from "@/components/reports/income-expense-bar-chart"; // Renamed from IncomeVsExpenseChart
import { CategoryTrendChart } from "@/components/reports/category-trend-chart";
import { SavingsRateCard } from "@/components/reports/savings-rate-card";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { useFinancials } from "@/context/financial-context";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { DateRange } from "react-day-picker";

export default function ReportsPage() {
  const { transactions, incomeCategories, expenseCategories, isLoading } = useFinancials();

  // Filter State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Combined Categories for Filter
  const allCategories = useMemo(() => [...incomeCategories, ...expenseCategories], [incomeCategories, expenseCategories]);

  // Derived Filtered Data
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Date Check
      if (dateRange?.from) {
        const txDate = new Date(t.date);
        const end = dateRange.to || dateRange.from; // If 'to' is null, assume single day selection
        if (!isWithinInterval(txDate, { start: dateRange.from, end: end })) {
          return false;
        }
      }

      // 2. Category Check
      if (selectedCategories.length > 0) {
        // The selectedCategories state holds category IDs.
        // We need to find the names corresponding to these IDs from allCategories
        // and then check if the transaction's category name is among them.
        const selectedCategoryNames = new Set(
          selectedCategories
            .map(id => allCategories.find(c => c.id === id)?.name)
            .filter(Boolean) as string[]
        );
        if (!t.category || !selectedCategoryNames.has(t.category)) {
          return false;
        }
      }

      // 3. Search Check
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchDescription = t.description.toLowerCase().includes(query);
        const matchAmount = t.amount.toString().includes(query);
        if (!matchDescription && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, dateRange, selectedCategories, searchQuery, allCategories]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <DashboardHeader title="Reports" />
        <DashboardFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          categories={allCategories}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SavingsRateCard transactions={filteredTransactions} isLoading={isLoading} />
        {/* Placeholder for future cards like 'Total Income', 'Total Expenses', 'Top Category' */}
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <FinancialTrendsChart transactions={filteredTransactions} isLoading={isLoading} />
        </div>
        <div className="col-span-3">
          <SpendingByCategoryChart transactions={filteredTransactions} isLoading={isLoading} />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <CategoryTrendChart transactions={filteredTransactions} isLoading={isLoading} />
        </div>
        <div className="col-span-3">
          <IncomeExpenseBarChart transactions={filteredTransactions} isLoading={isLoading} />
        </div>
      </div>

      <ReportGenerator />
    </div>
  );
}

