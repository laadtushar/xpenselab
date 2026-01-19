'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Toast, ToastDescription, ToastTitle } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface SuccessToastProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duration?: number;
}

export function SuccessToast({
  title,
  description,
  open,
  onOpenChange,
  duration = 3000,
}: SuccessToastProps) {
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    if (open) {
      // Show checkmark after a brief delay
      const checkmarkTimer = setTimeout(() => setShowCheckmark(true), 100);
      
      // Auto-close after duration
      const closeTimer = setTimeout(() => {
        onOpenChange(false);
        setShowCheckmark(false);
      }, duration);

      return () => {
        clearTimeout(checkmarkTimer);
        clearTimeout(closeTimer);
      };
    } else {
      setShowCheckmark(false);
    }
  }, [open, duration, onOpenChange]);

  return (
    <Toast open={open} onOpenChange={onOpenChange} className="border-green-500 bg-green-50 dark:bg-green-950">
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-all duration-300",
          showCheckmark ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}>
          <Check className="h-4 w-4" strokeWidth={3} />
        </div>
        <div className="flex-1">
          <ToastTitle className="text-green-900 dark:text-green-100">{title}</ToastTitle>
          {description && (
            <ToastDescription className="text-green-700 dark:text-green-300">
              {description}
            </ToastDescription>
          )}
        </div>
      </div>
    </Toast>
  );
}
