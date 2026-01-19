"use client"

import * as React from "react"
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

function ToastWithCheckmark({ 
  id, 
  title, 
  description, 
  action, 
  variant, 
  open, 
  ...props 
}: any) {
  // No hooks - use CSS animations instead to avoid hook order issues
  const isSuccess = !variant || variant === 'default';
  
  return (
    <Toast {...props} variant={variant} open={open}>
      <div className="flex items-start gap-3">
        {isSuccess && (
          <div 
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white mt-0.5",
              open 
                ? "animate-in fade-in-0 zoom-in-95 duration-300 delay-100" 
                : "scale-0 opacity-0"
            )}
          >
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
  // Call hook unconditionally at the top level - this is critical
  const { toasts } = useToast()

  // Render toasts with stable keys - Radix UI handles hook order internally
  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastWithCheckmark key={toast.id} {...toast} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
