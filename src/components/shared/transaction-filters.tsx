
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { useFinancials } from "@/context/financial-context";
import { useDebounce } from "@/hooks/use-debounce";
import { format, subDays, subMonths, subYears } from "date-fns";
import type { DateRange } from "react-day-picker";

interface TransactionFiltersProps {
  onFilterChange: (filters: {
    search?: string;
    category?: string;
    dateRange?: DateRange;
  }) => void;
  type: 'income' | 'expense';
}

export function TransactionFilters({ onFilterChange, type }: TransactionFiltersProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [openDate, setOpenDate] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const { incomeCategories, expenseCategories } = useFinancials();
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const presets = [
    { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: 'Last 30 Days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: 'Last 6 Months', getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { label: 'Last Year', getValue: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
    { label: 'All Time', getValue: () => undefined },
  ];

  useEffect(() => {
    onFilterChange({
      search: debouncedSearch,
      category,
      dateRange,
    });
  }, [debouncedSearch, category, dateRange, onFilterChange]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setDateRange(undefined);
  };

  const hasActiveFilters = search || category || dateRange;

  return (
    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
      <Input
        placeholder="Filter by description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <Select value={category} onValueChange={(value) => setCategory(value === "all" ? "" : value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover open={openDate} onOpenChange={setOpenDate}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>All Time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col md:flex-row">
            <div className="flex flex-col gap-1 p-2 border-b md:border-b-0 md:border-r overflow-y-auto max-h-[300px] md:max-h-none">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start font-normal text-left"
                  onClick={() => {
                    setDateRange(preset.getValue());
                    setOpenDate(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="p-0">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
