'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

const splitSchema = z.object({
  userId: z.string(),
  amount: z.coerce.number().nonnegative(),
  isIncluded: z.boolean().default(true),
});

const formSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  paidBy: z.string().min(1, 'Please select who paid.'),
  date: z.date(),
  splits: z.array(splitSchema),
}).refine(data => {
    const totalSplit = data.splits.filter(s => s.isIncluded).reduce((sum, s) => sum + s.amount, 0);
    // Allow for small floating point inaccuracies
    return Math.abs(data.amount - totalSplit) < 0.01;
}, {
    message: "The sum of splits must equal the total amount.",
    path: ["amount"],
});

interface AddSharedExpenseDialogProps {
  group: Group;
}

export function AddSharedExpenseDialog({ group }: AddSharedExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      date: new Date(),
      paidBy: user?.uid || '',
      splits: group.members.map(m => ({ userId: m, amount: 0, isIncluded: true })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "splits",
  });

  const watchAmount = form.watch('amount');
  const watchSplits = form.watch('splits');

  const handleEqualSplit = () => {
    const amount = form.getValues('amount');
    if (!amount || amount <= 0) {
        toast({ title: "Please enter a valid amount first", variant: 'destructive' });
        return;
    }
    const includedMembers = form.getValues('splits').filter(s => s.isIncluded);
    const splitCount = includedMembers.length;
    if(splitCount === 0) return;

    const splitAmount = parseFloat((amount / splitCount).toFixed(2));
    const newSplits = form.getValues('splits').map(s => {
        if (s.isIncluded) {
            return { ...s, amount: splitAmount };
        }
        return { ...s, amount: 0 };
    });

    // Adjust for rounding issues
    const total = newSplits.reduce((sum, s) => sum + s.amount, 0);
    const difference = amount - total;
    if(difference !== 0 && newSplits.length > 0) {
        const firstIncluded = newSplits.find(s => s.isIncluded);
        if(firstIncluded) firstIncluded.amount += difference;
    }

    form.setValue('splits', newSplits, { shouldValidate: true });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;

    const finalSplits = values.splits.filter(s => s.isIncluded).map(({userId, amount}) => ({userId, amount}));

    try {
      const expensesCol = collection(firestore, 'groups', group.id, 'sharedExpenses');
      await addDocumentNonBlocking(expensesCol, {
        groupId: group.id,
        description: values.description,
        amount: values.amount,
        paidBy: values.paidBy,
        date: values.date.toISOString(),
        splits: finalSplits,
      });

      toast({
        title: 'Expense Added',
        description: `Successfully added "${values.description}" to the group.`,
      });
      form.reset({
          description: '',
          amount: undefined,
          date: new Date(),
          paidBy: user.uid,
          splits: group.members.map(m => ({ userId: m, amount: 0, isIncluded: true })),
      });
      setOpen(false);
    } catch (error) {
      console.error('Error adding shared expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add shared expense.',
        variant: 'destructive',
      });
    }
  };

  const getMemberName = (userId: string) => {
    return group.memberDetails[userId]?.name || group.memberDetails[userId]?.email.split('@')[0] || 'Unknown';
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Shared Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Shared Expense to "{group.name}"</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dinner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                   <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                          <FormItem className="flex-1">
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                              <Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                   <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                          <FormItem className="flex-1 flex flex-col pt-2">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                              <PopoverTrigger asChild>
                              <FormControl>
                                  <Button
                                  variant={"outline"}
                                  className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
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
              
              <FormField
                control={form.control}
                name="paidBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid By</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select who paid" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {group.members.map(memberId => (
                          <SelectItem key={memberId} value={memberId}>
                            {getMemberName(memberId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel>Split Between</FormLabel>
                  <Button type="button" variant="link" size="sm" onClick={handleEqualSplit}>Split Equally</Button>
                </div>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3">
                           <FormField
                              control={form.control}
                              name={`splits.${index}.isIncluded`}
                              render={({ field }) => (
                                  <FormItem>
                                      <FormControl>
                                          <Checkbox
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                          />
                                      </FormControl>
                                  </FormItem>
                              )}
                          />
                          <FormLabel className="flex-1 text-sm font-normal">{getMemberName(form.getValues(`splits.${index}.userId`))}</FormLabel>
                          <FormField
                              control={form.control}
                              name={`splits.${index}.amount`}
                              render={({ field }) => (
                                  <FormItem>
                                  <FormControl>
                                      <Input 
                                          type="number" 
                                          step="0.01" 
                                          className="w-24 h-8" {...field} 
                                          disabled={!form.getValues(`splits.${index}.isIncluded`)}
                                      />
                                  </FormControl>
                                  </FormItem>
                              )}
                          />
                      </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 !mt-8">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Expense
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
