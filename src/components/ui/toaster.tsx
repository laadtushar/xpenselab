"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState, useMemo, useCallback } from "react"

// Pure presentational component - no hooks
function ToastWithCheckmark({ 
  id, 
  title, 
  description, 
  action, 
  variant, 
  open, 
  showCheckmark,
  ...props 
}: any) {
  const isSuccess = !variant || variant === 'default';
  
  return (
    <Toast {...props} variant={variant} open={open}>
      <div className="flex items-start gap-3">
        {isSuccess && (
          <div className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-all duration-300 mt-0.5",
            showCheckmark ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}>
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
        )}
        <div className="grid gap-1 flex-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && (
            <ToastDescription>{description}</ToastDescription>
          )}
        </div>
      </div>
      {action}
      <ToastClose />
    </Toast>
  );
}

export function Toaster() {
  const { toasts } = useToast()

  // Since TOAST_LIMIT = 1, get the current toast
  const currentToast = toasts[0]

  // Move all hooks to parent component to ensure stable hook order
  // Always call hooks in the same order regardless of whether toast exists
  const isSuccess = useMemo(() => {
    const variant = currentToast?.variant;
    return !variant || variant === 'default';
  }, [currentToast?.variant]);

  const [showCheckmark, setShowCheckmark] = useState(false);

  // Always call useEffect with consistent cleanup function
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    if (currentToast?.open && isSuccess) {
      timer = setTimeout(() => setShowCheckmark(true), 100);
    } else {
      setShowCheckmark(false);
    }
    
    // Always return a cleanup function for consistency
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [currentToast?.open, isSuccess]);

  // Stable no-op callback for empty toast state
  const noOpCallback = useCallback(() => {}, [])

  // Always render the same component structure to maintain stable hook order
  // Use open prop to control visibility instead of conditional rendering
  const toastProps = useMemo(() => {
    if (currentToast) {
      return {
        ...currentToast,
        showCheckmark,
      }
    }
    // Return default props when no toast exists - component stays mounted but hidden
    return {
      id: 'toast-singleton',
      open: false,
      title: '',
      description: '',
      variant: 'default' as const,
      action: undefined,
      onOpenChange: noOpCallback,
      showCheckmark: false,
    }
  }, [currentToast, showCheckmark, noOpCallback])

  return (
    <ToastProvider>
      {/* Always render Toast component to maintain stable component structure */}
      {/* Use stable key to prevent React from remounting when toast changes */}
      {/* Radix UI handles open={false} gracefully without creating visible portals */}
      <ToastWithCheckmark 
        key="toast-singleton"
        {...toastProps}
      />
      <ToastViewport />
    </ToastProvider>
  )
}
