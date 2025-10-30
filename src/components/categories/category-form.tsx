
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle } from "lucide-react";
import { useFinancials } from "@/context/financial-context";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { IconPicker } from "../icons/icon-picker";

const formSchema = z.object({
  name: z.string().min(1, "Category name is required."),
  icon: z.string().min(1, "Icon is required."),
});

type CategoryDialogProps = {
  category?: Category;
  type: 'income' | 'expense';
  children?: React.ReactNode;
};

export function CategoryDialog({ category, type, children }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const { addCategory, updateCategory } = useFinancials();
  const { toast } = useToast();
  const isEditing = !!category;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || "",
      icon: category?.icon || "MoreHorizontal",
    },
  });
  
  const selectedIcon = form.watch("icon");

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing) {
      updateCategory({ ...category, ...values });
      toast({
        title: "Category Updated",
        description: `Updated the ${values.name} category.`,
      });
    } else {
      addCategory({ ...values, type });
      toast({
        title: "Category Added",
        description: `Added the ${values.name} category.`,
      });
    }
    form.reset({ name: "", icon: "MoreHorizontal" });
    setOpen(false);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset({
        name: category?.name || "",
        icon: category?.icon || "MoreHorizontal",
      });
    }
    setOpen(isOpen);
  };

  const title = isEditing 
    ? `Edit ${type} Category` 
    : `Add New ${type} Category`;
    
  const description = isEditing
    ? "Edit your custom category."
    : `Create a new custom category for your ${type}.`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add {type === 'income' ? 'Income' : 'Expense'} Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Coffee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <IconPicker selectedIcon={selectedIcon} onSelect={(iconName) => form.setValue('icon', iconName)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
