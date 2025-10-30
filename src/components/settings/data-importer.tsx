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
import { Transaction } from "@/lib/types";

type ImportType = 'income' | 'expense';

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
        description: "Please select a CSV file to import.",
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
        const header = lines.shift()?.split(',').map(h => h.trim().toLowerCase()) || [];
        
        const transactions: Omit<Transaction, 'id'>[] = lines.map(line => {
          const values = line.split(',');
          const row = header.reduce((obj, h, i) => {
            obj[h] = values[i]?.trim();
            return obj;
          }, {} as Record<string, string>);

          if (importType === 'income') {
            return {
              type: 'income',
              date: new Date(row['date']).toISOString(),
              description: row['description/invoice no.'] || row['income source'] || 'Imported Income',
              amount: parseFloat(row['income amount']),
              category: 'Income',
            };
          } else { // expense
            return {
              type: 'expense',
              date: new Date(row['purchase date']).toISOString(),
              description: row['item'] || 'Imported Expense',
              amount: parseFloat(row['amount']),
              category: row['category'] || 'Other',
            };
          }
        }).filter(t => !isNaN(t.amount) && t.date);
        
        addTransactions(transactions);

        toast({
          title: "Import Successful",
          description: `Successfully imported ${transactions.length} transactions.`,
        });

      } catch (error) {
        console.error("Import failed", error);
        toast({
          title: "Import Failed",
          description: "Please check the file format and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setFile(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
        <CardDescription>
          Import your income or expense data from a CSV file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <h3 className="font-medium text-sm">File Format</h3>
            <p className="text-xs text-muted-foreground">
                Ensure your CSV file has a header row. For expenses, we expect headers like `Purchase Date`, `Item`, `Amount`, `Category`. For income, `Date`, `Description/Invoice No.`, `Income Amount`.
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
          <Input type="file" accept=".csv" onChange={handleFileChange} className="max-w-xs" />
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
