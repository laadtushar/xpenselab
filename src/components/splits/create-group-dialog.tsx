
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
import { ScrollArea } from '../ui/scroll-area';

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
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
      members: [{ name: '', email: '' }],
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
  
    const memberDetails: { [uid: string]: { email: string; name?: string | null } } = {};
    const memberUIDs: string[] = [user.uid];
  
    memberDetails[user.uid] = { email: user.email!, name: user.displayName };
  
    values.members.forEach(member => {
        const memberUID = `virtual_${member.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        if (!memberUIDs.includes(memberUID)) {
            memberUIDs.push(memberUID);
            memberDetails[memberUID] = { email: member.email, name: member.name };
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
      form.reset({ name: '', members: [{ name: '', email: '' }] });
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
      <DialogContent className="sm:max-w-lg h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Add members to your group to start splitting expenses.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-4">
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
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <FormField
                            control={form.control}
                            name={`members.${index}.name`}
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Input placeholder="Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`members.${index}.email`}
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Input placeholder="member@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="mt-1"
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
                onClick={() => append({ name: '', email: '' })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Member
              </Button>

              <DialogFooter className='pt-4 mt-auto'>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Group'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
