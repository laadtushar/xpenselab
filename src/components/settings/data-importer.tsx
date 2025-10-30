"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFinancials } from "@/context/financial-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Transaction, expenseCategories, ExpenseCategory } from "@/lib/types";

type ImportType = 'income' | 'expense';

function normalizeCategory(category: string): string {
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
    'transport': 'Transportation',
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

export function DataImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>('expense');
  const [isLoading, setIsLoading] = useState(false);
  const { addTransactions } = useFinancials();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV or TSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headerLine = lines.shift()?.trim();
        if (!headerLine) {
          throw new Error("File is empty or has no header.");
        }
        
        const separator = headerLine.includes('\t') ? '\t' : ',';
        
        const header = headerLine.split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const transactions: Omit<Transaction, 'id'>[] = lines.map((line, index) => {
          if (!line.trim()) return null;

          const values = line.split(separator);
          const row = header.reduce((obj, h, i) => {
            obj[h] = values[i]?.trim().replace(/"/g, '');
            return obj;
          }, {} as Record<string, string>);

          const dateString = row['date'] || row['purchase date'];
          const date = new Date(dateString);
          
          const amountString = row['income amount'] || row['amount'] || row['income'];
          const amount = parseFloat(amountString?.replace(/[^0-9.-]+/g, ''));
          
          const description = row['description/invoice no.'] || row['income source'] || row['item'] || 'Imported Transaction';

          if (isNaN(date.getTime()) || !amountString || isNaN(amount) || !description.trim()) {
            console.warn(`Skipping invalid row ${index + 2}:`, line);
            return null;
          }

          if (importType === 'income') {
            return {
              type: 'income',
              date: date.toISOString(),
              description: description,
              amount: amount,
              category: 'Income',
            };
          } else { // expense
            const category = row['category'] ? normalizeCategory(row['category']) : 'Other';
            return {
              type: 'expense',
              date: date.toISOString(),
              description: description,
              amount: amount,
              category: category,
            };
          }
        }).filter((t): t is Omit<Transaction, 'id'> => t !== null);
        
        if (transactions.length > 0) {
          addTransactions(transactions);
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

      } catch (error) {
        console.error("Import failed", error);
        toast({
          title: "Import Failed",
          description: "Please check the file format and try again. Ensure it's a valid CSV or TSV file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if(fileInput) fileInput.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
        <CardDescription>
          Import your income or expense data from a CSV or TSV file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <h3 className="font-medium text-sm">File Format</h3>
            <p className="text-xs text-muted-foreground">
                Ensure your file has a header row. For expenses, expected headers are `Purchase Date`, `Item`, `Amount`, `Category`. For income, expected headers are `Date`, `Description/Invoice No.`, `Income Amount`. Variations are handled.
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
          <Input type="file" accept=".csv,.tsv,.txt" onChange={handleFileChange} className="max-w-xs" />
          <Button onClick={handleImport} disabled={isLoading || !file}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import
          </Button>
        </div>
        
      </CardContent>
    </Card>
  );
}
