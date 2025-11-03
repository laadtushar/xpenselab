"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useFinancials } from "@/context/financial-context";
import { useToast } from "@/hooks/use-toast";

export function ReportGenerator() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { transactions } = useFinancials();
  const { toast } = useToast();

  const handleDownloadCsv = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: "Please select a date range.", variant: "destructive" });
      return;
    }

    const filteredTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= dateRange.from! && txDate <= dateRange.to!;
    });

    if (filteredTransactions.length === 0) {
      toast({ title: "No data in selected range.", description: "Please select a different date range." });
      return;
    }

    const headers = ["ID", "Type", "Description", "Category", "Amount", "Date"];
    const csvRows = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.type,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category || '',
        t.amount,
        t.date
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `xpenselab_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Report Downloaded", description: "Your CSV report has been downloaded." });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>
          Select a date range to generate a financial report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-[300px] justify-start text-left font-normal"
                >
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
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleDownloadCsv}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Export as PDF
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Note: "Export as PDF" uses your browser's print functionality. Set the destination to "Save as PDF" for the best result.
        </div>
      </CardContent>
    </Card>
  );
}
