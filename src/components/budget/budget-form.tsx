"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  amount: z.coerce.number().positive("Budget must be a positive number."),
});

export function BudgetForm() {
  const { budget, setBudget } = useFinancials();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: budget?.amount || undefined,
    },
  });

  useEffect(() => {
    if (budget) {
      form.reset({ amount: budget.amount });
    }
  }, [budget, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setBudget({
      amount: values.amount,
    });
    toast({
      title: "Budget Updated",
      description: `Your budget for this month is set to $${values.amount}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Monthly Budget</CardTitle>
        <CardDescription>Define your spending limit for the current month.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="100" placeholder="e.g., 2000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set Budget
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
