"use client";

import { useState, useEffect } from "react";
import { useEncryption } from "@/context/encryption-context";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase";
import { migrateUserDataToEncrypted, type MigrationProgress } from "@/lib/migration/encrypt-existing-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface EncryptionMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EncryptionMigrationDialog({ open, onOpenChange }: EncryptionMigrationDialogProps) {
  const { encryptionKey, isUnlocked } = useEncryption();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setIsMigrating(false);
      setProgress(null);
      setMigrationResult(null);
    }
  }, [open]);

  const handleStartMigration = async () => {
    if (!firestore || !user || !encryptionKey || !isUnlocked) {
      toast({
        title: "Cannot Start Migration",
        description: "Please unlock encryption first.",
        variant: "destructive",
      });
      return;
    }

    setIsMigrating(true);
    setProgress({
      totalProcessed: 0,
      totalEncrypted: 0,
      totalFailed: 0,
      lastProcessedId: null,
      status: 'in-progress',
      errors: [],
    });

    try {
      const result = await migrateUserDataToEncrypted(
        firestore,
        user.uid,
        encryptionKey,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setMigrationResult({
        success: result.success,
        message: result.message,
      });

      // Update user document with migration status
      if (result.success && user) {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDocumentNonBlocking(userRef, {
          migrationState: {
            totalProcessed: result.progress.totalProcessed,
            status: 'completed',
          },
        });
      }

      if (result.success) {
        toast({
          title: "Migration Completed",
          description: `Successfully encrypted ${result.progress.totalEncrypted} documents.`,
        });
      } else {
        toast({
          title: "Migration Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setMigrationResult({
        success: false,
        message: error.message || "Migration failed unexpectedly.",
      });
      toast({
        title: "Migration Error",
        description: error.message || "An error occurred during migration.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClose = () => {
    if (!isMigrating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encrypt Existing Data</DialogTitle>
          <DialogDescription>
            Encrypt your existing financial data with your encryption code. This process may take a few minutes.
          </DialogDescription>
        </DialogHeader>

        {!isMigrating && !migrationResult && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This will encrypt all your existing data. Make sure you have your encryption code saved safely.
                The process cannot be undone.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleStartMigration}>
                Start Migration
              </Button>
            </DialogFooter>
          </div>
        )}

        {isMigrating && progress && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress.totalEncrypted} encrypted, {progress.totalFailed} failed</span>
              </div>
              <Progress 
                value={
                  progress.totalProcessed > 0
                    ? (progress.totalEncrypted / progress.totalProcessed) * 100
                    : 0
                } 
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Status: {progress.status}
              </p>
            </div>
            {progress.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Some Errors Occurred</AlertTitle>
                <AlertDescription className="text-xs">
                  {progress.errors.length} document(s) failed to encrypt. The migration will continue.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {migrationResult && !isMigrating && (
          <div className="space-y-4">
            {migrationResult.success ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Migration Completed</AlertTitle>
                <AlertDescription>{migrationResult.message}</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Migration Failed</AlertTitle>
                <AlertDescription>{migrationResult.message}</AlertDescription>
              </Alert>
            )}
            {progress && progress.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto">
                <p className="text-xs font-medium mb-2">Errors:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {progress.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>
                      {error.docId}: {error.error}
                    </li>
                  ))}
                  {progress.errors.length > 5 && (
                    <li>... and {progress.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
