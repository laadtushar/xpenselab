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

// Type for toast - matches what useToast returns
type ToastItem = ReturnType<typeof useToast>['toasts'][number]

// Separate component for individual toast - NO HOOKS in this component
// Use CSS animation with delay instead of React state to show checkmark
function ToastWithCheckmark({ 
  toast
}: { 
  toast: ToastItem
}) {
  const isSuccess = !toast.variant || toast.variant === 'default'

  return (
    <Toast 
      variant={toast.variant} 
      open={toast.open}
      onOpenChange={toast.onOpenChange}
    >
      <div className="flex items-start gap-3">
        {isSuccess && toast.open && (
          <div 
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white mt-0.5",
              "animate-fade-in-scale"
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
        )}
        <div className="grid gap-1 flex-1">
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description && (
            <ToastDescription>{toast.description}</ToastDescription>
          )}
        </div>
      </div>
      {toast.action}
      <ToastClose />
    </Toast>
  )
}

export function Toaster() {
  // CRITICAL: Only ONE hook called here - useToast()
  // This ensures hooks are always called in the same order on every render
  // No state, no effects, no refs - just the toast hook
  const { toasts } = useToast()

  // Render toasts directly - no conditional hook calls
  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastWithCheckmark 
          key={toast.id}
          toast={toast}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
