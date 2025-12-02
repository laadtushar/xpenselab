
'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { useFinancials } from "@/context/financial-context";
import { useToast } from "@/hooks/use-toast";
import { SaltEdgeTransaction } from "@/lib/types";
import { categorizeExpense } from "@/ai/flows/categorize-expenses";
import { useDebounce } from "@/hooks/use-debounce";

const formSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.date({ required_error: "Date is required." }),
  category: z.string().min(1, "Category is required."),
});

interface ExpenseFormFromSaltEdgeProps {
  transaction: SaltEdgeTransaction;
}

export function ExpenseFormFromSaltEdge({ transaction }: ExpenseFormFromSaltEdgeProps) {
  const [open, setOpen] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const { addTransaction, expenseCategories } = useFinancials();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction.description || "",
      amount: Math.abs(transaction.amount),
      date: new Date(transaction.made_on),
      category: "",
    },
  });

  const descriptionValue = form.watch("description");
  const debouncedDescription = useDebounce(descriptionValue, 500);

  useEffect(() => {
    const autoCategorize = async () => {
      // Try to use Salt Edge category if available
      if (transaction.category) {
        const categoryName = transaction.category.replace(/_/g, ' ');
        const categoryExists = expenseCategories.some(c => c.name.toLowerCase() === categoryName.toLowerCase());
        if (categoryExists) {
          form.setValue("category", expenseCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())!.name, { shouldValidate: true });
          return;
        }
      }
      
      if (debouncedDescription && debouncedDescription.length >= 3) {
        setIsCategorizing(true);
        try {
          const result = await categorizeExpense({ description: debouncedDescription });
          const suggestedCategoryExists = expenseCategories.some(c => c.name === result.category);
          if (result.category && suggestedCategoryExists) {
            form.setValue("category", result.category, { shouldValidate: true });
          }
        } catch (error) {
          console.error("AI categorization failed:", error);
        } finally {
          setIsCategorizing(false);
        }
      }
    };
    autoCategorize();
  }, [debouncedDescription, form, expenseCategories, transaction.category]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    addTransaction({
      id: `saltedge-${transaction.id}`,
      type: 'expense',
      ...values,
      date: values.date.toISOString(),
    });
    toast({
      title: "Expense Imported",
      description: `Imported "${values.description}" from bank.`,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowDownLeft className="mr-2 h-4 w-4"/> Import Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Bank Expense</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="date" render={({ field }) => (
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
            )}/>
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="relative">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isCategorizing && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

