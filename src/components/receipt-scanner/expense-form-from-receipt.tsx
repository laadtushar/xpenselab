
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useFinancials } from "@/context/financial-context";
import { categorizeExpense } from "@/ai/flows/categorize-expenses";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const formSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.date({ required_error: "Date is required." }),
  category: z.string().min(1, "Category is required."),
});

interface ExpenseFormFromReceiptProps {
  receiptData: Partial<Expense>;
  onCancel: () => void;
}

export function ExpenseFormFromReceipt({ receiptData, onCancel }: ExpenseFormFromReceiptProps) {
  const [isCategorizing, setIsCategorizing] = useState(false);
  const { addTransaction, expenseCategories } = useFinancials();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: receiptData.description || "",
      amount: receiptData.amount || '' as unknown as number,
      date: receiptData.date ? new Date(receiptData.date) : new Date(),
      category: receiptData.category || "",
    },
  });

  const descriptionValue = form.watch("description");
  const debouncedDescription = useDebounce(descriptionValue, 500);

  useEffect(() => {
    const autoCategorize = async () => {
      // Don't re-categorize if a category was already suggested by the receipt scan
      if (receiptData.category && expenseCategories.some(c => c.name === receiptData.category)) {
        form.setValue("category", receiptData.category, { shouldValidate: true });
        return;
      }

      if (debouncedDescription && debouncedDescription.length >= 3) {
        setIsCategorizing(true);
        try {
          const response = await categorizeExpense({ description: debouncedDescription });
          if (response.success && response.data) {
            const result = response.data;
            const categoryExists = expenseCategories.some(c => c.name === result.category);
            if (result.category && categoryExists) {
              form.setValue("category", result.category, { shouldValidate: true });
            }
          }
        } catch (error) {
          console.error("AI categorization failed:", error);
        } finally {
          setIsCategorizing(false);
        }
      }
    };
    autoCategorize();
  }, [debouncedDescription, form, expenseCategories, receiptData.category]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    addTransaction({
      type: 'expense',
      ...values,
      date: values.date.toISOString(),
    });
    toast({
      title: "Expense Added",
      description: `Added ${values.description} to your expenses.`,
    });
    onCancel(); // Return to scanner
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Scanned Expense</CardTitle>
        <CardDescription>AI has extracted the following details from your receipt. Please review and confirm.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="e.g., Weekly groceries" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="e.g., 75.50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="relative">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isCategorizing && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Expense
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
