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
import { useEncryption } from "@/context/encryption-context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ReportGenerator() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { transactions } = useFinancials();
  const { toast } = useToast();
  const { isEncryptionEnabled, isUnlocked } = useEncryption();
  const [showExportWarning, setShowExportWarning] = useState(false);

  const handleDownloadCsv = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: "Please select a date range.", variant: "destructive" });
      return;
    }

    // Check if encryption is enabled but not unlocked
    if (isEncryptionEnabled && !isUnlocked) {
      toast({
        title: "Encryption Locked",
        description: "Please unlock encryption in settings to export data.",
        variant: "destructive",
      });
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

    // Show warning if encryption is enabled
    if (isEncryptionEnabled && isUnlocked) {
      setShowExportWarning(true);
      return;
    }

    downloadCsv(filteredTransactions);
  };

  const downloadCsv = (transactionsToExport: typeof transactions) => {
    const headers = ["ID", "Type", "Description", "Category", "Amount", "Date"];
    const csvRows = [
      headers.join(','),
      ...transactionsToExport.map(t => [
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
        {isEncryptionEnabled && (
          <div className="text-xs text-muted-foreground">
            ⚠️ Exported CSV files will contain unencrypted data. Keep them secure.
          </div>
        )}
      </CardContent>
      
      <AlertDialog open={showExportWarning} onOpenChange={setShowExportWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Unencrypted Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Your data is encrypted in the database, but the exported CSV file will contain unencrypted data.
              Make sure to store the exported file securely and delete it when no longer needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const filteredTransactions = transactions.filter(t => {
                const txDate = new Date(t.date);
                return dateRange && txDate >= dateRange.from! && txDate <= dateRange.to!;
              });
              downloadCsv(filteredTransactions);
              setShowExportWarning(false);
            }}>
              Continue Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
