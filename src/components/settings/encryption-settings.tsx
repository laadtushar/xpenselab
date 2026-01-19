"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEncryption } from "@/context/encryption-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, LockOpen, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EncryptionMigrationDialog } from "./encryption-migration-dialog";

const enableFormSchema = z.object({
  code: z.string().min(8, "Encryption code must be at least 8 characters"),
  confirmCode: z.string().min(8),
  understandRisk: z.boolean().refine(val => val === true, "You must acknowledge the risk"),
}).refine(data => data.code === data.confirmCode, {
  message: "Encryption codes do not match",
  path: ["confirmCode"],
});

const unlockFormSchema = z.object({
  code: z.string().min(1, "Encryption code is required"),
});

const changeCodeFormSchema = z.object({
  oldCode: z.string().min(1, "Old encryption code is required"),
  newCode: z.string().min(8, "New encryption code must be at least 8 characters"),
  confirmNewCode: z.string().min(8),
  understandRisk: z.boolean().refine(val => val === true, "You must acknowledge the risk"),
}).refine(data => data.newCode === data.confirmNewCode, {
  message: "New encryption codes do not match",
  path: ["confirmNewCode"],
});

export function EncryptionSettings() {
  const {
    isEncryptionEnabled,
    isUnlocked,
    hasExistingData,
    isLoading,
    enableEncryption,
    unlockEncryption,
    changeEncryptionCode,
    disableEncryption,
    lockEncryption,
    validateCode,
    isCryptoAvailable,
  } = useEncryption();
  
  const { toast } = useToast();
  const [enableDialogOpen, setEnableDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [changeCodeDialogOpen, setChangeCodeDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check browser compatibility
  if (!isCryptoAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Encryption
          </CardTitle>
          <CardDescription>
            End-to-end encryption for your financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Browser Not Supported</AlertTitle>
            <AlertDescription>
              Your browser does not support the Web Crypto API required for encryption.
              Please use a modern browser like Chrome, Firefox, Safari, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // State 1: Encryption Not Enabled
  if (!isEncryptionEnabled) {
    const enableForm = useForm<z.infer<typeof enableFormSchema>>({
      resolver: zodResolver(enableFormSchema),
      defaultValues: {
        code: "",
        confirmCode: "",
        understandRisk: false,
      },
    });

    const onEnableSubmit = async (values: z.infer<typeof enableFormSchema>) => {
      setIsProcessing(true);
      try {
        await enableEncryption(values.code);
        setEnableDialogOpen(false);
        enableForm.reset();
        
        // Show migration prompt if user has existing data
        if (hasExistingData) {
          // Show migration dialog after a short delay
          setTimeout(() => {
            setMigrationDialogOpen(true);
          }, 500);
        }
      } catch (error: any) {
        toast({
          title: "Failed to Enable Encryption",
          description: error.message || "An error occurred while enabling encryption.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Encryption
          </CardTitle>
          <CardDescription>
            Protect your financial data with end-to-end encryption. Only you can decrypt your data with your encryption code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Benefits of Encryption</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your sensitive data (amounts, descriptions) is encrypted before storage</li>
              <li>Even if someone gains access to your account, they cannot read your data without your encryption code</li>
              <li>Your data remains private and secure</li>
            </ul>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              If you lose your encryption code, your encrypted data cannot be recovered. 
              Make sure to store your encryption code in a safe place.
            </AlertDescription>
          </Alert>

          <Dialog open={enableDialogOpen} onOpenChange={setEnableDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Enable Encryption
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enable Encryption</DialogTitle>
                <DialogDescription>
                  Create an encryption code to protect your financial data. This code will be used to encrypt and decrypt your data.
                </DialogDescription>
              </DialogHeader>
              <Form {...enableForm}>
                <form onSubmit={enableForm.handleSubmit(onEnableSubmit)} className="space-y-4">
                  <FormField
                    control={enableForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Encryption Code</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter encryption code (min 8 characters)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Choose a strong code that you can remember. This cannot be recovered if lost.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={enableForm.control}
                    name="confirmCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Encryption Code</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm encryption code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={enableForm.control}
                    name="understandRisk"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I understand that I cannot recover my data if I lose this code
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEnableDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isProcessing}>
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enable Encryption
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // State 2: Encryption Enabled but Not Unlocked
  if (!isUnlocked) {
    const unlockForm = useForm<z.infer<typeof unlockFormSchema>>({
      resolver: zodResolver(unlockFormSchema),
      defaultValues: {
        code: "",
      },
    });

    const onUnlockSubmit = async (values: z.infer<typeof unlockFormSchema>) => {
      setIsProcessing(true);
      try {
        const success = await unlockEncryption(values.code);
        if (success) {
          setUnlockDialogOpen(false);
          unlockForm.reset();
          toast({
            title: "Encryption Unlocked",
            description: "Your data is now accessible.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Unlock Failed",
          description: error.message || "Invalid encryption code.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Encryption
          </CardTitle>
          <CardDescription>
            Enter your encryption code to unlock your encrypted data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Encryption Active</AlertTitle>
            <AlertDescription>
              Your data is encrypted. Enter your encryption code to view and manage your financial data.
            </AlertDescription>
          </Alert>

          <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <LockOpen className="mr-2 h-4 w-4" />
                Unlock Encryption
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Unlock Encryption</DialogTitle>
                <DialogDescription>
                  Enter your encryption code to decrypt and access your data.
                </DialogDescription>
              </DialogHeader>
              <Form {...unlockForm}>
                <form onSubmit={unlockForm.handleSubmit(onUnlockSubmit)} className="space-y-4">
                  <FormField
                    control={unlockForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Encryption Code</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your encryption code" {...field} autoFocus />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setUnlockDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isProcessing}>
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Unlock
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <div className="text-sm text-muted-foreground">
            <p>Forgot your code? Unfortunately, there is no way to recover encrypted data without the encryption code.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 3: Encryption Enabled and Unlocked
  const changeCodeForm = useForm<z.infer<typeof changeCodeFormSchema>>({
    resolver: zodResolver(changeCodeFormSchema),
    defaultValues: {
      oldCode: "",
      newCode: "",
      confirmNewCode: "",
      understandRisk: false,
    },
  });

  const onChangeCodeSubmit = async (values: z.infer<typeof changeCodeFormSchema>) => {
    setIsProcessing(true);
    try {
      await changeEncryptionCode(values.oldCode, values.newCode);
      setChangeCodeDialogOpen(false);
      changeCodeForm.reset();
      toast({
        title: "Encryption Code Changed",
        description: "Your encryption code has been updated. Existing data will need to be re-encrypted.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Change Code",
        description: error.message || "An error occurred while changing the encryption code.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDisableEncryption = async () => {
    setIsProcessing(true);
    try {
      await disableEncryption();
      setDisableDialogOpen(false);
      toast({
        title: "Encryption Disabled",
        description: "Encryption has been disabled. Existing encrypted data will remain encrypted.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Disable Encryption",
        description: error.message || "An error occurred while disabling encryption.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Encryption
          <Badge variant="default" className="ml-2">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </CardTitle>
        <CardDescription>
          Your financial data is encrypted and secure. Encryption is unlocked for this session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Encryption Active</AlertTitle>
          <AlertDescription>
            Your sensitive data is encrypted. New data will be automatically encrypted.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <Dialog open={changeCodeDialogOpen} onOpenChange={setChangeCodeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Change Encryption Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Encryption Code</DialogTitle>
                <DialogDescription>
                  Change your encryption code. You will need your old code and a new code.
                </DialogDescription>
              </DialogHeader>
              <Form {...changeCodeForm}>
                <form onSubmit={changeCodeForm.handleSubmit(onChangeCodeSubmit)} className="space-y-4">
                  <FormField
                    control={changeCodeForm.control}
                    name="oldCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Encryption Code</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter current code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={changeCodeForm.control}
                    name="newCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Encryption Code</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter new code (min 8 characters)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={changeCodeForm.control}
                    name="confirmNewCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Encryption Code</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm new code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={changeCodeForm.control}
                    name="understandRisk"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I understand that existing data will need to be re-encrypted
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setChangeCodeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isProcessing}>
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Change Code
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="w-full" onClick={lockEncryption}>
            <Lock className="mr-2 h-4 w-4" />
            Lock Encryption
          </Button>

          {hasExistingData && (
            <Button variant="outline" className="w-full" onClick={() => setMigrationDialogOpen(true)}>
              Encrypt Existing Data
            </Button>
          )}

          <EncryptionMigrationDialog 
            open={migrationDialogOpen} 
            onOpenChange={setMigrationDialogOpen} 
          />

          <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Disable Encryption
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Disable Encryption?</DialogTitle>
                <DialogDescription>
                  This will disable encryption for new data. Existing encrypted data will remain encrypted and cannot be decrypted without your code.
                </DialogDescription>
              </DialogHeader>
              <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Disabling encryption means new data will not be encrypted. This reduces the security of your financial data.
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDisableDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={onDisableEncryption} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Disable Encryption
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
