
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useEncryption } from '@/context/encryption-context';
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
import { Loader2, UserPlus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formSchema = z.object({
  otherPartyName: z.string().min(1, 'Please enter a name.'),
  otherPartyEmail: z.string().email('Please enter a valid email.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  description: z.string().min(1, 'Description is required.'),
  direction: z.enum(['iOwe', 'theyOwe'], { required_error: 'You must select who owes whom.'}),
});

type AddDebtDialogProps = {
  trigger?: React.ReactNode;
};

export function AddDebtDialog({ trigger }: AddDebtDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: '' as unknown as number,
      otherPartyName: '',
      otherPartyEmail: '',
      direction: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;

    if (values.otherPartyEmail.toLowerCase() === user.email?.toLowerCase()) {
        toast({
            title: 'Invalid Entry',
            description: "You cannot create a debt with yourself.",
            variant: 'destructive'
        });
        return;
    }
    
    // Virtual user ID based on email
    const otherPartyVirtualId = `virtual_${values.otherPartyEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const fromUserId = values.direction === 'iOwe' ? user.uid : otherPartyVirtualId;
    const toUserId = values.direction === 'iOwe' ? otherPartyVirtualId : user.uid;

    const fromUserName = values.direction === 'iOwe' ? user.displayName || user.email : values.otherPartyName;
    const toUserName = values.direction === 'iOwe' ? values.otherPartyName : user.displayName || user.email;

    // Check if encryption is enabled but not unlocked
    if (isEncryptionEnabled && !isUnlocked) {
      toast({
        title: 'Encryption Locked',
        description: 'Please unlock encryption in settings to add debts.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const debtsCol = collection(firestore, 'debts');
      const encryptionKeyForWrite = isEncryptionEnabled && isUnlocked ? encryptionKey : null;
      addDocumentNonBlocking(debtsCol, {
        fromUserId,
        toUserId,
        fromUserName,
        toUserName,
        amount: values.amount,
        description: values.description,
        settled: false,
        createdBy: user.uid,
      }, encryptionKeyForWrite);

      toast({
        title: 'Debt Recorded',
        description: 'The debt has been successfully recorded.',
      });
      form.reset({ description: '', amount: '' as unknown as number, otherPartyName: '', otherPartyEmail: '' });
      setOpen(false);
    } catch (error) {
      console.error('Error adding debt:', error);
      toast({
        title: 'Error',
        description: 'Failed to record the debt.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> Add Debt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a New Debt</DialogTitle>
          <DialogDescription>
            Add a debt between you and another person.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Who owes whom?</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="iOwe" />
                            </FormControl>
                            <FormLabel className="font-normal">I owe them</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="theyOwe" />
                            </FormControl>
                            <FormLabel className="font-normal">They owe me</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="otherPartyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Their Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPartyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Their Email</FormLabel>
                  <FormControl>
                    <Input placeholder="friend@example.com" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 25.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., For lunch last week" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                    <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Saving...
                    </>
                ) : 'Record Debt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
