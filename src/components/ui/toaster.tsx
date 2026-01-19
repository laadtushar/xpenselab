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

function ToastWithCheckmark({ id, title, description, action, variant, ...props }: any) {
  const isSuccess = !variant || variant === 'default';
  
  return (
    <Toast key={id} {...props} variant={variant}>
      <div className="flex items-start gap-3">
        {isSuccess && (
          <div className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-all duration-300 mt-0.5 animate-in zoom-in-50 fade-in-0",
            props.open ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}>
            <Check className="h-3 w-3 animate-in fade-in-0 slide-in-from-left-2 delay-150" strokeWidth={3} />
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
