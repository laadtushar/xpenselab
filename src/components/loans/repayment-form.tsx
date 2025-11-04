
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, CalendarIcon, HandCoins } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Loan } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { useFinancials } from '@/context/financial-context';

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.date({ required_error: "Payment date is required." }),
  notes: z.string().optional(),
});

interface AddRepaymentDialogProps {
    loan: Loan;
}

export function AddRepaymentDialog({ loan }: AddRepaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { addTransaction } = useFinancials();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as unknown as number,
      date: new Date(),
      notes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;

    try {
      const loanRef = doc(firestore, 'users', user.uid, 'loans', loan.id);
      const repaymentsCol = collection(loanRef, 'repayments');
      
      // 1. Add the repayment document
      await addDocumentNonBlocking(repaymentsCol, {
        ...values,
        loanId: loan.id,
        date: values.date.toISOString(),
      });

      // 2. Add as an expense transaction for cash-flow tracking
      addTransaction({
          type: 'expense',
          amount: values.amount,
          date: values.date.toISOString(),
          description: `Repayment for ${loan.lender} loan`,
          category: 'Loan Repayment',
      });

      // 3. Update the loan's amountRemaining
      const newAmountRemaining = loan.amountRemaining - values.amount;
      const loanUpdate: Partial<Loan> = {
          amountRemaining: newAmountRemaining,
      };

      // 4. If loan is paid off, update status
      if (newAmountRemaining <= 0) {
        loanUpdate.status = 'paid';
        toast({
            title: "Loan Paid Off!",
            description: `Congratulations on paying off your loan from ${loan.lender}.`
        })
      }
      
      await updateDocumentNonBlocking(loanRef, loanUpdate);

      toast({
        title: 'Repayment Recorded',
        description: 'Your payment has been successfully recorded and added as an expense.',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding repayment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the repayment.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HandCoins className="mr-2 h-4 w-4" /> Add Repayment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Repayment</DialogTitle>
          <DialogDescription>
            Log a payment for your loan from {loan.lender}. This will also be added to your expenses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="e.g., 250.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="e.g., Extra payment for October" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />


            <DialogFooter className="pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
