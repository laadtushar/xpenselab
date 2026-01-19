'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, LockOpen, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useEncryption } from '@/context/encryption-context';
import { useToast } from '@/hooks/use-toast';

const unlockFormSchema = z.object({
  code: z.string().min(1, "Encryption code or recovery code is required"),
});

export function EncryptionUnlockModal() {
  const {
    isEncryptionEnabled,
    isUnlocked,
    isLoading,
    unlockEncryption,
    unlockAttempts,
    maxUnlockAttempts,
  } = useEncryption();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof unlockFormSchema>>({
    resolver: zodResolver(unlockFormSchema),
    defaultValues: {
      code: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isEncryptionEnabled && !isUnlocked && !isLoading) {
      form.reset();
      setError(null);
    }
  }, [isEncryptionEnabled, isUnlocked, isLoading, form]);

  const onUnlockSubmit = async (values: z.infer<typeof unlockFormSchema>) => {
    if (!isEncryptionEnabled) return;

    setIsProcessing(true);
    setError(null);

    try {
      const success = await unlockEncryption(values.code);
      if (success) {
        form.reset();
        // Show toast after a brief delay to ensure modal closes first
        setTimeout(() => {
          toast({
            title: "Unlocked Successfully",
            description: "Your encrypted data is now accessible.",
          });
        }, 100);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to unlock encryption. Please check your code.";
      setError(errorMessage);
      form.setError('code', { message: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show modal when encryption is enabled but not unlocked
  // Hide when successfully unlocked
  const shouldShow = isEncryptionEnabled && !isUnlocked;

  // Don't allow closing the dialog without unlocking
  const handleOpenChange = (open: boolean) => {
    // Prevent closing if encryption is enabled and not unlocked
    if (!open && shouldShow) {
      return;
    }
  };

  // Don't show anything if encryption is not enabled or already unlocked
  if (!shouldShow) {
    return null;
  }

  const remainingAttempts = maxUnlockAttempts - unlockAttempts;

  return (
    <Dialog open={true} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          {isLoading ? (
            <>
              <DialogTitle>Loading encryption</DialogTitle>
              <DialogDescription className="sr-only">
                Please wait while we load your encryption settings.
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-destructive" />
                <DialogTitle>Unlock Encryption Required</DialogTitle>
              </div>
              <DialogDescription>
                Your data is encrypted. Enter your encryption code or recovery code to access your financial data.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unlock Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {remainingAttempts < maxUnlockAttempts && remainingAttempts > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unlock Attempts</AlertTitle>
                <AlertDescription>
                  {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.
                </AlertDescription>
              </Alert>
            )}

            {unlockAttempts >= maxUnlockAttempts && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Too Many Failed Attempts</AlertTitle>
                <AlertDescription>
                  Please refresh the page to reset unlock attempts.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUnlockSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Encryption Code or Recovery Code</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your encryption code or recovery code"
                          {...field}
                          autoFocus
                          disabled={isProcessing || unlockAttempts >= maxUnlockAttempts}
                        />
                      </FormControl>
                      <FormDescription>
                        You can use either your main encryption code or one of your recovery codes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  {unlockAttempts < maxUnlockAttempts ? (
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full sm:w-auto"
                    >
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <LockOpen className="mr-2 h-4 w-4" />
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="w-full sm:w-auto"
                    >
                      Refresh Page
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
