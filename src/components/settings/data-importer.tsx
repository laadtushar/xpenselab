
"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFinancials } from "@/context/financial-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Transaction, expenseCategories, ExpenseCategory } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ImportType = 'income' | 'expense';

type Log = {
  successful: number;
  failed: number;
  errors: { row: any; reason: string; rowIndex: number }[];
};

function normalizeCategory(category: string): string {
  if (!category) return 'Other';
  const lowerCaseCategory = category.toLowerCase().trim();
  const mapping: { [key: string]: ExpenseCategory } = {
    'bills': 'Bills',
    'subscriptions': 'Subscriptions',
    'entertainment': 'Entertainment',
    'food & drink': 'Food & Drink',
    'groceries': 'Groceries',
    'health & wellbeing': 'Health & Wellbeing',
    'other': 'Other',
    'shopping': 'Shopping',
    'transport': 'Transportation',
    'travel': 'Travel',
    'education loan repayment': 'Education Loan Repayment',
    'gifts': 'Gifts',
    'rent': 'Rent',
    'utilities': 'Utilities',
    'transportation': 'Transportation',
    'dining out': 'Dining Out',
    'healthcare': 'Healthcare',
    'education': 'Education',
    'personal care': 'Personal Care',
  };

  const found = Object.keys(mapping).find(key => key === lowerCaseCategory);
  if (found) {
    return mapping[found];
  }

  const existingCategory = expenseCategories.find(c => c.toLowerCase() === lowerCaseCategory);
  if (existingCategory) {
    return existingCategory;
  }
  
  return 'Other';
}

function excelDateToJSDate(serial: number) {
  if (typeof serial !== 'number' || isNaN(serial)) {
    return null;
  }
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);

  const fractional_day = serial - Math.floor(serial) + 0.0000001;

  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;
  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

export function DataImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>('expense');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<Log | null>(null);
  const { addTransaction } = useFinancials();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setLogs(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV, TSV or XLSX file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLogs(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      const importLogs: Log = { successful: 0, failed: 0, errors: [] };

      try {
        const workbook = XLSX.read(data, {
          type: 'binary',
          cellDates: true,
          dateNF: 'm/d/yyyy', 
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null });

        if (json.length < 2) {
          throw new Error("File is empty or has no data.");
        }
        
        const header: string[] = json[0].map((h: any) => String(h || '').trim().toLowerCase());
        const dataRows = json.slice(1);

        const transactions: Omit<Transaction, 'id' | 'userId'>[] = dataRows.map((rowArray: any[], index) => {
          const rowIndex = index + 2;

          if (!Array.isArray(rowArray) || rowArray.every(cell => cell === null || cell === '')) {
             importLogs.errors.push({ row: rowArray, reason: 'Empty row', rowIndex });
             importLogs.failed++;
             return null;
          }
          
          const row = header.reduce((obj, h, i) => {
              if (rowArray[i] !== null) {
                  obj[h] = rowArray[i];
              }
              return obj;
          }, {} as Record<string, any>);

          const dateString = row['purchase date'] || row['date'] || row['timestamp'];
          let date;

          if (typeof dateString === 'number') { // Excel date serial number
            date = excelDateToJSDate(dateString);
          } else if (dateString instanceof Date) {
            date = dateString;
          } else if (typeof dateString === 'string') {
            date = new Date(dateString);
          }
          
          if (!date || isNaN(date.getTime())) {
            importLogs.errors.push({ row, reason: `Invalid or missing date: ${dateString}`, rowIndex });
            importLogs.failed++;
            return null;
          }
          
          const amountString = row['amount'] || row['income amount'] || row['income'];
          const amount = parseFloat(String(amountString).replace(/[^0-9.-]+/g, ''));
          
          const description = row['item'] || row['description/invoice no.'] || row['income source'] || 'Imported Transaction';

          if (isNaN(amount) || !description || String(description).trim() === '') {
            importLogs.errors.push({ row, reason: `Missing or invalid amount/description. Amount: ${amountString}, Desc: ${description}`, rowIndex });
            importLogs.failed++;
            return null;
          }
          
          importLogs.successful++;

          if (importType === 'income') {
            return {
              type: 'income',
              date: date.toISOString(),
              description: String(description),
              amount: amount,
            };
          } else { // expense
            const category = row['category'] ? normalizeCategory(String(row['category'])) : 'Other';
            return {
              type: 'expense',
              date: date.toISOString(),
              description: String(description),
              amount: amount,
              category: category,
            };
          }
        }).filter((t): t is Omit<Transaction, 'id' | 'userId'> => t !== null);
        
        if (transactions.length > 0) {
            transactions.forEach(t => addTransaction(t));
          toast({
            title: "Import Successful",
            description: `Successfully imported ${transactions.length} transactions.`,
          });
        } else {
           toast({
            title: "Import Complete",
            description: "No valid transactions were found to import.",
            variant: "default",
          });
        }

      } catch (error: any) {
        console.error("Import failed", error);
        toast({
          title: "Import Failed",
          description: error.message || "Please check the file format and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setLogs(importLogs);
        setFile(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if(fileInput) fileInput.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
        <CardDescription>
          Import your income or expense data from a CSV, TSV, or XLSX file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <h3 className="font-medium text-sm">File Format</h3>
            <p className="text-xs text-muted-foreground">
                Ensure your file has a header row. For expenses, expected headers are `Purchase Date` or `Date`, `Item` or `Description/Invoice No.`, `Amount`, and `Category`. For income, expected headers are `Date`, `Income Source` or `Description/Invoice No.`, and `Income Amount` or `Income`. Variations are handled. Dates can be in formats like `m/d/yyyy` or parsable strings.
            </p>
        </div>
        <RadioGroup
          value={importType}
          onValueChange={(value: any) => setImportType(value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expense" id="r-expense" />
            <Label htmlFor="r-expense">Expense</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="income" id="r-income" />
            <Label htmlFor="r-income">Income</Label>
          </div>
        </RadioGroup>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFileChange} className="max-w-xs" />
          <Button onClick={handleImport} disabled={isLoading || !file}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import
          </Button>
        </div>
        
        {logs && (
          <Card>
            <CardHeader>
              <CardTitle>Import Log</CardTitle>
              <CardDescription>
                Successfully imported {logs.successful} rows. Failed to import {logs.failed} rows.
              </CardDescription>
            </CardHeader>
            {logs.failed > 0 && (
              <CardContent>
                <h3 className="font-semibold mb-2">Rows with Errors</h3>
                <div className="max-h-60 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row #</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Row Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.rowIndex}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{error.reason}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{JSON.stringify(error.row)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  );

    
