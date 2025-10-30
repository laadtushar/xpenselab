
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Group, Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Split } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Step, Stepper, useStepper } from '../ui/stepper';

const splitSchema = z.object({
  userId: z.string(),
  amount: z.coerce.number().nonnegative(),
  isIncluded: z.boolean().default(true),
});

const formSchema = z.object({
  groupId: z.string().min(1, 'Please select a group.'),
  splits: z.array(splitSchema),
}).refine((data) => {
    // This validation is now dynamic based on the expense amount
    return true;
}, {});

interface SplitExpenseDialogProps {
  expense: Expense;
}

export function SplitExpenseDialog({ expense }: SplitExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'groups'), where('members', 'array-contains', user.uid));
  }, [firestore, user?.uid]);

  const { data: groups } = useCollection<Group>(groupsQuery);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: '',
      splits: [],
    },
  });
  
  const { fields, replace } = useFieldArray({ control: form.control, name: "splits" });

  const handleGroupSelect = (groupId: string) => {
    const group = groups?.find(g => g.id === groupId);
    if (group) {
        setSelectedGroup(group);
        form.setValue('groupId', groupId);
        const initialSplits = group.members.map(m => ({ userId: m, amount: 0, isIncluded: true }));
        replace(initialSplits); // use replace to update the field array
    }
  };

  const handleEqualSplit = () => {
    if (!expense) return;
    const amount = expense.amount;

    const includedMembers = form.getValues('splits').filter(s => s.isIncluded);
    const splitCount = includedMembers.length;
    if(splitCount === 0) return;

    const splitAmount = parseFloat((amount / splitCount).toFixed(2));
    const newSplits = form.getValues('splits').map(s => {
        if (s.isIncluded) return { ...s, amount: splitAmount };
        return { ...s, amount: 0 };
    });

    const total = newSplits.reduce((sum, s) => sum + s.amount, 0);
    const difference = amount - total;
    if(difference !== 0 && newSplits.length > 0) {
        const firstIncluded = newSplits.find(s => s.isIncluded);
        if(firstIncluded) firstIncluded.amount += difference;
    }
    form.setValue('splits', newSplits, { shouldValidate: true });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore || !selectedGroup) return;

    const totalSplit = values.splits.filter(s => s.isIncluded).reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(expense.amount - totalSplit) > 0.01) {
        form.setError("splits", { type: "manual", message: "The sum of splits must equal the total expense amount." });
        return;
    }

    const finalSplits = values.splits.filter(s => s.isIncluded).map(({userId, amount}) => ({userId, amount}));

    try {
      const expensesCol = collection(firestore, 'groups', selectedGroup.id, 'sharedExpenses');
      await addDocumentNonBlocking(expensesCol, {
        groupId: selectedGroup.id,
        description: expense.description,
        amount: expense.amount,
        paidBy: user.uid, // Assume the user splitting the expense paid for it.
        date: expense.date,
        splits: finalSplits,
      });

      toast({
        title: 'Expense Split',
        description: `Successfully split "${expense.description}".`,
      });
      form.reset({ groupId: '', splits: [] });
      setSelectedGroup(null);
      setOpen(false);
    } catch (error) {
      console.error('Error adding shared expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to split the expense.',
        variant: 'destructive',
      });
    }
  };
  
  const getMemberName = (userId: string) => {
    return selectedGroup?.memberDetails[userId]?.name || selectedGroup?.memberDetails[userId]?.email.split('@')[0] || 'Unknown';
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
            <Split className="h-4 w-4" />
            <span className="sr-only">Split Expense</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Split Expense: {expense.description}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-grow flex flex-col">
        <Stepper initialStep={0} steps={[{label: "Group"}, {label: "Splits"}]}>
            <Step label="Select Group">
                <div className="flex flex-col gap-4 my-4">
                    <p className="text-sm text-muted-foreground">Select the group you want to split this expense with.</p>
                     <FormField
                        control={form.control}
                        name="groupId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Group</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); handleGroupSelect(value); }} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a group" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {groups?.map(group => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </Step>
            <Step label="Define Splits">
                <ScrollArea className="flex-grow my-4" style={{maxHeight: 'calc(90vh - 300px)'}}>
                <div className="pr-6 space-y-4">
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
                         <FormMessage>{form.formState.errors.splits?.message}</FormMessage>
                    </div>
                </div>
                </ScrollArea>
                 <div className="pt-4 mt-auto">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Split Expense
                    </Button>
                </div>
            </Step>
            <StepperFooter />
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const StepperFooter = () => {
    const { activeStep, isLastStep, isOptionalStep, isDisabledStep, nextStep, prevStep } = useStepper();
    return (
        <div className="flex items-center justify-end gap-2 mt-4">
        {activeStep > 0 && (
            <Button onClick={prevStep} size="sm" variant="secondary">
            Go Back
            </Button>
        )}
        {!isLastStep && (
            <Button onClick={nextStep} size="sm">
            Next
            </Button>
        )}
        </div>
    );
};
