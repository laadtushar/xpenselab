
"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  initialStep?: number
  steps: {
    label: string
    description?: string
    icon?: React.ReactNode
  }[]
  children?: React.ReactNode
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  icon?: React.ReactNode
  isCompleted?: boolean
  isCurrent?: boolean
  isLoading?: boolean
  isLastStep?: boolean
  isOptional?: boolean
  checkIcon?: React.ReactNode
  errorIcon?: React.ReactNode
}

interface StepperContextValue extends StepperProps {
  activeStep: number
  isLastStep: boolean
  isOptionalStep: boolean
  isDisabledStep: boolean
  nextStep: () => void
  prevStep: () => void
  resetSteps: () => void
  setStep: (step: number) => void
}

const StepperContext = React.createContext<StepperContextValue>(
  {} as StepperContextValue
)

const useStepper = () => React.useContext(StepperContext)

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      children,
      initialStep = 0,
      steps,
      ...props
    },
    ref
  ) => {
    const [activeStep, setActiveStep] = React.useState(initialStep)
    const isLastStep = activeStep === steps.length - 1
    const isOptionalStep = !!steps[activeStep]?.isOptional
    const isDisabledStep = !!steps[activeStep]?.isDisabled

    const nextStep = () => {
      if (!isLastStep) {
        setActiveStep((prev) => prev + 1)
      }
    }

    const prevStep = () => {
      if (activeStep > 0) {
        setActiveStep((prev) => prev - 1)
      }
    }

    const resetSteps = () => {
      setActiveStep(initialStep)
    }

    const setStep = (step: number) => {
      setActiveStep(step)
    }

    return (
      <StepperContext.Provider
        value={{
          steps,
          activeStep,
          isLastStep,
          isOptionalStep,
          isDisabledStep,
          nextStep,
          prevStep,
          resetSteps,
          setStep,
          initialStep,
        }}
      >
        <div
          ref={ref}
          className={cn(
            "flex w-full flex-col gap-4",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.label}>
                <Step
                  label={step.label}
                  description={step.description}
                  icon={step.icon}
                  isCompleted={index < activeStep}
                  isCurrent={index === activeStep}
                />
                {index < steps.length - 1 && (
                  <div className="h-px w-full flex-1 bg-border" />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="h-full">
            {React.Children.toArray(children)[activeStep]}
          </div>
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  (
    {
      className,
      label,
      description,
      icon,
      isCompleted,
      isCurrent,
      isLoading,
      isLastStep,
      checkIcon,
      errorIcon,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground",
          isCurrent && "text-foreground",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex size-6 items-center justify-center rounded-full border text-xs",
            isCompleted && "border-primary bg-primary text-primary-foreground",
            isCurrent && "border-primary"
          )}
        >
          {isCompleted ? (
            checkIcon || <Check className="size-4" />
          ) : isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            icon || <span>{label?.[0]}</span>
          )}
        </div>
        <div className="text-center">{label}</div>
      </div>
    )
  }
)
Step.displayName = "Step"

const StepButtons = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const {
    activeStep,
    isLastStep,
    isOptionalStep,
    isDisabledStep,
    nextStep,
    prevStep,
  } = useStepper()

  return (
    <div
      ref={ref}
      className={cn("flex w-full justify-end gap-2", className)}
      {...props}
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={prevStep}
        disabled={activeStep === 0}
      >
        Previous
      </Button>
      <Button size="sm" onClick={nextStep} disabled={isDisabledStep}>
        {isLastStep ? "Finish" : isOptionalStep ? "Skip" : "Next"}
      </Button>
    </div>
  )
})
StepButtons.displayName = "StepButtons"

export { Stepper, Step, StepButtons, useStepper }
