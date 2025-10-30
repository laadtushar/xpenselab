
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, addDocumentNonBlocking, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, type Firestore } from 'firebase/firestore';
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
import { Loader2, UserPlus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formSchema = z.object({
  otherPartyEmail: z.string().email('Please enter a valid email.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  description: z.string().min(1, 'Description is required.'),
  direction: z.enum(['iOwe', 'theyOwe'], { required_error: 'You must select who owes whom.'}),
});

// A function to find a user by email, now with proper error handling.
const findUserByEmail = async (firestore: Firestore, email: string) => {
    const q = query(collection(firestore, 'users'), where('email', '==', email));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
    } catch (e: any) {
        // This is likely a permission error on the 'users' collection query.
        // We throw a specific, rich error to be caught by the development overlay.
        if (e.code === 'permission-denied') {
            throw new FirestorePermissionError({
                path: 'users',
                operation: 'list',
            });
        }
        // Re-throw other errors
        throw e;
    }
}


export function AddDebtDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: '' as unknown as number,
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
    
    let otherUser;
    try {
      otherUser = await findUserByEmail(firestore, values.otherPartyEmail);
    } catch (error) {
      // If our custom error was thrown, re-throw it to the overlay.
      if (error instanceof FirestorePermissionError) {
        throw error;
      }
      // Handle other unexpected errors from findUserByEmail
      console.error("An unexpected error occurred while finding the user:", error);
      toast({
          title: "Error",
          description: "An unexpected error occurred while searching for the user.",
          variant: "destructive",
      });
      return;
    }


    if (!otherUser) {
        toast({
            title: "User not found",
            description: `No user found with email ${values.otherPartyEmail}. Please make sure they have signed up.`,
            variant: "destructive"
        });
        form.control.setError('otherPartyEmail', { message: 'User not found.' });
        return;
    }

    const fromUserId = values.direction === 'iOwe' ? user.uid : otherUser.id;
    const toUserId = values.direction === 'iOwe' ? otherUser.id : user.uid;

    try {
      const debtsCol = collection(firestore, 'debts');
      addDocumentNonBlocking(debtsCol, {
        fromUserId,
        toUserId,
        amount: values.amount,
        description: values.description,
        settled: false,
        createdBy: user.uid,
      });

      toast({
        title: 'Debt Recorded',
        description: 'The debt has been successfully recorded.',
      });
      form.reset({ description: '', amount: '' as unknown as number, otherPartyEmail: '' });
      setOpen(false);
    } catch (error) {
      console.error('Error adding debt:', error);
      // This catch is for addDocumentNonBlocking, which handles its own permission errors.
      // This is for other potential issues.
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
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Add Debt
        </Button>
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
