'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
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
import { PlusCircle, Trash2, Users } from 'lucide-react';

const memberSchema = z.object({
  email: z.string().email('Invalid email address.'),
});

const formSchema = z.object({
  name: z.string().min(1, 'Group name is required.'),
  members: z.array(memberSchema).min(1, 'At least one member is required.'),
});

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      members: [{ email: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'members',
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a group.',
        variant: 'destructive',
      });
      return;
    }
  
    // TODO: In a real app, you would verify these emails correspond to actual users
    // For now, we'll just store the emails. We'll create a map of placeholder UIDs.
    const memberDetails: { [uid: string]: { email: string; name?: string } } = {};
    const memberUIDs: string[] = [user.uid];
  
    memberDetails[user.uid] = { email: user.email!, name: user.displayName };
  
    values.members.forEach(member => {
        // Simple placeholder for UID - in a real app, you'd fetch this.
        const memberUID = `user_${member.email.replace(/[@.]/g, '_')}`;
        if (!memberUIDs.includes(memberUID)) {
            memberUIDs.push(memberUID);
            memberDetails[memberUID] = { email: member.email };
        }
    });

    try {
      const groupsCol = collection(firestore, 'groups');
      await addDocumentNonBlocking(groupsCol, {
        name: values.name,
        members: memberUIDs,
        memberDetails: memberDetails,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
  
      toast({
        title: 'Group Created',
        description: `The group "${values.name}" has been created.`,
      });
      form.reset({ name: '', members: [{ email: '' }] });
      setOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: 'Error Creating Group',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Users className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Add members to your group to start splitting expenses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Trip to Bali" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Group Members</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`members.${index}.email`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="member@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ email: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Member
            </Button>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
