
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
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
import { Loader2, PlusCircle, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  lender: z.string().min(1, "Lender name is required."),
  initialAmount: z.coerce.number().positive("Initial amount must be positive."),
  interestRate: z.coerce.number().min(0, "Interest rate cannot be negative."),
  termMonths: z.coerce.number().int().positive("Term must be a positive number of months."),
  startDate: z.date({ required_error: "Start date is required." }),
});

export function AddLoanDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lender: '',
      initialAmount: '' as unknown as number,
      interestRate: '' as unknown as number,
      termMonths: '' as unknown as number,
      startDate: new Date(),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;

    try {
      const loansCol = collection(firestore, 'users', user.uid, 'loans');
      await addDocumentNonBlocking(loansCol, {
        ...values,
        userId: user.uid,
        amountRemaining: values.initialAmount,
        status: 'active',
        startDate: values.startDate.toISOString(),
      });

      toast({
        title: 'Loan Added',
        description: 'Your new loan has been successfully recorded.',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding loan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the loan.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New Loan</DialogTitle>
          <DialogDescription>
            Enter the details of your loan or EMI to track it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lender Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Bank of America" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="initialAmount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Principal Amount</FormLabel>
                    <FormControl><Input type="number" step="100" placeholder="e.g., 10000" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="e.g., 5.5" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="termMonths"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Term (Months)</FormLabel>
                        <FormControl><Input type="number" step="1" placeholder="e.g., 60" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
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
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : 'Add Loan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
