"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFinancials } from "@/context/financial-context";
import { useEncryption } from "@/context/encryption-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Transaction } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ImportType = 'income' | 'expense';
type ImportMode = 'append' | 'replace';

type Log = {
  successful: number;
  failed: number;
  errors: { row: any; reason: string; rowIndex: number }[];
};

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
  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<Log | null>(null);
  const { addTransaction, addCategory, expenseCategories, clearTransactions } = useFinancials();
  const { isEncryptionEnabled, isUnlocked, encryptionKey } = useEncryption();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setLogs(null);
    }
  };

  const handleDownloadSample = () => {
    let headers: string[];
    let data: string[][];
    let filename: string;

    if (importType === 'expense') {
      headers = ['Date', 'Description', 'Amount', 'Category'];
      data = [
        ['2023-10-26', 'Weekly Groceries', '125.50', 'Groceries'],
        ['2023-10-25', 'Movie Tickets', '30.00', 'Entertainment'],
      ];
      filename = 'sample_expenses.csv';
    } else { // income
      headers = ['Date', 'Description', 'Amount', 'Category'];
      data = [
        ['2023-10-01', 'Monthly Salary', '5000.00', 'Salary'],
        ['2023-10-15', 'Freelance Project', '750.00', 'Freelance'],
      ];
      filename = 'sample_income.csv';
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to import.",
      });
      return;
    }

    // Security: Limit file size to prevent ReDoS attacks (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Please use a smaller file.`,
      });
      return;
    }

    // Security: Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv', '.tsv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please upload a file with one of these extensions: ${validExtensions.join(', ')}`,
      });
      return;
    }

    setIsLoading(true);
    setLogs(null);
    
    if (importMode === 'replace') {
      try {
        await clearTransactions(importType);
        toast({
          title: `Existing ${importType} data cleared`,
          description: `Ready to import new data.`,
        });
      } catch (error) {
        console.error(`Error clearing ${importType} data:`, error);
        toast({
          title: "Error Clearing Data",
          description: `Could not clear existing ${importType} data. Aborting import.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const data = e.target?.result;
      const importLogs: Log = { successful: 0, failed: 0, errors: [] };
      const newCategories = new Set<string>();

      try {
        // Security: Add timeout protection and limits to prevent ReDoS
        const MAX_ROWS = 10000; // Limit rows to prevent memory exhaustion
        const MAX_COLUMNS = 100; // Limit columns to prevent ReDoS
        
        const workbook = XLSX.read(data, {
          type: 'binary',
          cellDates: true,
          dateNF: 'm/d/yyyy',
          // Security: Limit sheet access to first sheet only
          sheetStubs: false,
          // Security: Limit cell parsing to prevent ReDoS
          cellNF: false,
          cellStyles: false,
        });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("File contains no sheets.");
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          throw new Error("Unable to read worksheet data.");
        }
        
        // Security: Limit data extraction to prevent ReDoS
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          raw: false, 
          defval: null,
          // Limit range to prevent processing huge files
          range: MAX_ROWS > 0 ? `A1:${String.fromCharCode(64 + Math.min(MAX_COLUMNS, 26))}${MAX_ROWS}` : undefined,
        });

        if (!json || json.length < 2) {
          throw new Error("File is empty or has no data.");
        }
        
        // Security: Enforce row limit
        if (json.length > MAX_ROWS) {
          toast({
            variant: "default",
            title: "File truncated",
            description: `File contains ${json.length} rows. Only the first ${MAX_ROWS} rows will be imported.`,
          });
        }
        
        const header: string[] = json[0].map((h: any) => String(h || '').trim().toLowerCase());
        const dataRows = json.slice(1);

        const existingCategoryNames = new Set(expenseCategories.map(c => c.name.toLowerCase()));

        const transactions = dataRows.map((rowArray: any[], index) => {
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
              category: 'Imported', // Default category for imported income
            };
          } else { // expense
            let category = 'Other';
            if (row['category'] && String(row['category']).trim()) {
                const importedCategoryName = String(row['category']).trim();
                const formattedCategoryName = importedCategoryName.charAt(0).toUpperCase() + importedCategoryName.slice(1).toLowerCase();
                category = formattedCategoryName;
                if (!existingCategoryNames.has(category.toLowerCase())) {
                    newCategories.add(category);
                }
            }
            return {
              type: 'expense',
              date: date.toISOString(),
              description: String(description),
              amount: amount,
              category: category,
            };
          }
        }).filter((t) => t !== null) as Omit<Transaction, 'id' | 'userId'>[];
        
        // Create new categories found during import
        if (newCategories.size > 0) {
          const categoryCreationPromises = Array.from(newCategories).map(catName =>
            addCategory({
              name: catName,
              icon: 'MoreHorizontal', // Default icon for imported categories
              type: 'expense',
            })
          );
          await Promise.all(categoryCreationPromises);
          toast({
            title: "New Categories Created",
            description: `Created ${newCategories.size} new expense categories from your import file.`,
          });
        }
        
        if (transactions.length > 0) {
          // Check if encryption is enabled but not unlocked
          if (isEncryptionEnabled && !isUnlocked) {
            toast({
              title: 'Encryption Locked',
              description: 'Please unlock encryption in settings to import data.',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
          
          // Additional check: if encryption is enabled, ensure we have the key
          if (isEncryptionEnabled && !encryptionKey) {
            console.error('[IMPORT ERROR] Encryption is enabled but encryption key is not available');
            toast({
              title: 'Encryption Error',
              description: 'Encryption is enabled but the key is not available. Please unlock encryption and try again.',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
          
          transactions.forEach(t => addTransaction(t));
          toast({
            title: "Import Successful",
            description: `Successfully imported ${transactions.length} transactions.`,
          });
        } else if (newCategories.size === 0) { // Only show if no transactions AND no new cats
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
          Import your income or expense data from a CSV, TSV, or XLSX file. New expense categories will be created automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <h3 className="font-medium text-sm">File Format</h3>
            <div className="text-xs text-muted-foreground space-y-1">
                <p>
                    Ensure your file has a header row. For both expenses and income, the expected headers are `Date`, `Description`, `Amount`, and `Category`.
                </p>
                <p>
                    Variations like `Purchase Date` for `Date` are handled. Dates can be in formats like `m/d/yyyy` or other standard date strings. If a category doesn't exist, it will be created.
                </p>
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleDownloadSample}>
                    <Download className="mr-2 h-3 w-3" />
                    Download sample {importType} sheet
                </Button>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RadioGroup
              value={importType}
              onValueChange={(value: any) => setImportType(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="r-expense" />
                <Label htmlFor="r-expense">Expenses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="r-income" />
                <Label htmlFor="r-income">Income</Label>
              </div>
            </RadioGroup>
            
            <RadioGroup
              value={importMode}
              onValueChange={(value: any) => setImportMode(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="append" id="r-append" />
                <Label htmlFor="r-append">Append</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="r-replace" />
                <Label htmlFor="r-replace">Replace</Label>
              </div>
            </RadioGroup>
        </div>

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
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Row #</TableHead>
                                <TableHead>Reason</TableHead>

                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {logs.errors.map((error, index) => (
                                <TableRow key={index}>
                                <TableCell>{error.rowIndex}</TableCell>
                                <TableCell>
                                    <Badge variant="destructive">{error.reason}</Badge>
                                </TableCell>
                                
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

    
