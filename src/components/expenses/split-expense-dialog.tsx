
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
  DialogFooter
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
import { Loader2, Split, UserPlus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';


// Group Split Schemas
const groupSplitMemberSchema = z.object({
  userId: z.string(),
  amount: z.coerce.number().nonnegative(),
  isIncluded: z.boolean().default(true),
});

const groupSplitSchema = z.object({
  groupId: z.string().min(1, 'Please select a group.'),
  splits: z.array(groupSplitMemberSchema),
});


// Individual Debt Schema
const individualDebtSchema = z.object({
  otherPartyName: z.string().min(1, 'Please enter a name.'),
  otherPartyEmail: z.string().email('Please enter a valid email.'),
  direction: z.enum(['iOwe', 'theyOwe'], { required_error: 'You must select who owes whom.'}),
});

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

  // Form for Group Split
  const groupForm = useForm<z.infer<typeof groupSplitSchema>>({
    resolver: zodResolver(groupSplitSchema),
    defaultValues: { groupId: '', splits: [] },
  });
  
  const { fields: groupSplitFields, replace: replaceGroupSplits } = useFieldArray({ control: groupForm.control, name: "splits" });

  // Form for Individual Debt
  const debtForm = useForm<z.infer<typeof individualDebtSchema>>({
    resolver: zodResolver(individualDebtSchema),
    defaultValues: { otherPartyName: '', otherPartyEmail: '', direction: undefined }
  });

  const handleGroupSelect = (groupId: string) => {
    const group = groups?.find(g => g.id === groupId);
    if (group) {
        setSelectedGroup(group);
        groupForm.setValue('groupId', groupId);
        const initialSplits = group.members.map(m => ({ userId: m, amount: 0, isIncluded: true }));
        replaceGroupSplits(initialSplits);
    }
  };

  const handleEqualSplit = () => {
    if (!expense) return;
    const amount = expense.amount;

    const includedMembers = groupForm.getValues('splits').filter(s => s.isIncluded);
    const splitCount = includedMembers.length;
    if(splitCount === 0) return;

    const splitAmount = parseFloat((amount / splitCount).toFixed(2));
    const newSplits = groupForm.getValues('splits').map(s => {
        if (s.isIncluded) return { ...s, amount: splitAmount };
        return { ...s, amount: 0 };
    });

    const total = newSplits.reduce((sum, s) => sum + s.amount, 0);
    const difference = amount - total;
    if(difference !== 0 && newSplits.length > 0) {
        const firstIncluded = newSplits.find(s => s.isIncluded);
        if(firstIncluded) firstIncluded.amount += difference;
    }
    groupForm.setValue('splits', newSplits, { shouldValidate: true });
  }

  const onGroupSplitSubmit = async (values: z.infer<typeof groupSplitSchema>) => {
    if (!user || !firestore || !selectedGroup) return;

    const totalSplit = values.splits.filter(s => s.isIncluded).reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(expense.amount - totalSplit) > 0.01) {
        groupForm.setError("splits", { type: "manual", message: "The sum of splits must equal the total expense amount." });
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
      groupForm.reset({ groupId: '', splits: [] });
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

  const onIndividualDebtSubmit = async (values: z.infer<typeof individualDebtSchema>) => {
    if (!user || !firestore) return;

     if (values.otherPartyEmail.toLowerCase() === user.email?.toLowerCase()) {
        toast({
            title: 'Invalid Entry',
            description: "You cannot create a debt with yourself.",
            variant: 'destructive'
        });
        return;
    }
    
    const otherPartyVirtualId = `virtual_${values.otherPartyEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const fromUserId = values.direction === 'iOwe' ? user.uid : otherPartyVirtualId;
    const toUserId = values.direction === 'iOwe' ? otherPartyVirtualId : user.uid;
    const fromUserName = values.direction === 'iOwe' ? user.displayName || user.email : values.otherPartyName;
    const toUserName = values.direction === 'iOwe' ? values.otherPartyName : user.displayName || user.email;

    try {
      const debtsCol = collection(firestore, 'debts');
      addDocumentNonBlocking(debtsCol, {
        fromUserId,
        toUserId,
        fromUserName,
        toUserName,
        amount: expense.amount,
        description: expense.description,
        settled: false,
        createdBy: user.uid,
      });

      toast({
        title: 'Debt Recorded',
        description: 'The debt has been successfully recorded from the expense.',
      });
      debtForm.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding debt:', error);
      toast({
        title: 'Error',
        description: 'Failed to record the debt.',
        variant: 'destructive',
      });
    }
  }
  
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
        <Tabs defaultValue="group" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="group"><Split className="mr-2" />Split with Group</TabsTrigger>
            <TabsTrigger value="individual"><UserPlus className="mr-2" />Individual Debt</TabsTrigger>
          </TabsList>
          
          {/* Group Split Tab */}
          <TabsContent value="group" className="flex-grow flex flex-col">
            <Form {...groupForm}>
              <form onSubmit={groupForm.handleSubmit(onGroupSplitSubmit)} className="space-y-4 flex-grow flex flex-col">
                <p className="text-sm text-muted-foreground">Select a group to divide this expense among its members.</p>
                <FormField
                    control={groupForm.control}
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
                
                {selectedGroup && (
                  <ScrollArea className="flex-grow my-4" style={{maxHeight: 'calc(90vh - 400px)'}}>
                    <div className="pr-6 space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                          <FormLabel>Split Between</FormLabel>
                          <Button type="button" variant="link" size="sm" onClick={handleEqualSplit}>Split Equally</Button>
                          </div>
                          <div className="space-y-2">
                          {groupSplitFields.map((field, index) => (
                              <div key={field.id} className="flex items-center gap-3">
                                  <FormField
                                      control={groupForm.control}
                                      name={`splits.${index}.isIncluded`}
                                      render={({ field }) => (
                                          <FormItem>
                                              <FormControl>
                                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                              </FormControl>
                                          </FormItem>
                                      )}
                                  />
                                  <FormLabel className="flex-1 text-sm font-normal">{getMemberName(groupForm.getValues(`splits.${index}.userId`))}</FormLabel>
                                  <FormField
                                      control={groupForm.control}
                                      name={`splits.${index}.amount`}
                                      render={({ field }) => (
                                          <FormItem>
                                          <FormControl>
                                              <Input type="number" step="0.01" className="w-24 h-8" {...field} disabled={!groupForm.getValues(`splits.${index}.isIncluded`)} />
                                          </FormControl>
                                          </FormItem>
                                      )}
                                  />
                              </div>
                          ))}
                          </div>
                            <FormMessage>{groupForm.formState.errors.splits?.message}</FormMessage>
                        </div>
                    </div>
                  </ScrollArea>
                )}

                <DialogFooter className="pt-4 mt-auto">
                    <Button type="submit" disabled={groupForm.formState.isSubmitting || !selectedGroup}>
                        {groupForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Split Expense
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Individual Debt Tab */}
          <TabsContent value="individual" className="flex-grow flex flex-col">
             <Form {...debtForm}>
                <form onSubmit={debtForm.handleSubmit(onIndividualDebtSubmit)} className="space-y-4 flex-grow flex flex-col">
                    <p className="text-sm text-muted-foreground">
                        Create a one-on-one debt for this expense. The amount is fixed to the expense total of <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.amount)}</span>.
                    </p>
                    <FormField
                        control={debtForm.control}
                        name="direction"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Who owes whom?</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="iOwe" /></FormControl>
                                    <FormLabel className="font-normal">I owe them</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="theyOwe" /></FormControl>
                                    <FormLabel className="font-normal">They owe me</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={debtForm.control}
                        name="otherPartyName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Their Name</FormLabel>
                            <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={debtForm.control}
                        name="otherPartyEmail"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Their Email</FormLabel>
                            <FormControl><Input placeholder="friend@example.com" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter className="pt-4 mt-auto">
                        <Button type="submit" disabled={debtForm.formState.isSubmitting}>
                        {debtForm.formState.isSubmitting ? 'Saving...' : 'Record Debt'}
                        </Button>
                    </DialogFooter>
                </form>
             </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
