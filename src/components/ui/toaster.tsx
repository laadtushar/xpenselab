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
import { useEffect, useState } from "react"

function ToastWithCheckmark({ id, title, description, action, variant, open, ...props }: any) {
  // Always call hooks in the same order, regardless of conditions
  const isSuccess = !variant || variant === 'default';
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Always call useEffect with consistent cleanup function
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    if (open && isSuccess) {
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
  }, [open, isSuccess]);
  
  return (
    <Toast key={id} {...props} variant={variant} open={open}>
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

  return (
    <ToastProvider>
      {toasts.map(function (toast) {
        return <ToastWithCheckmark key={toast.id} {...toast} />
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
