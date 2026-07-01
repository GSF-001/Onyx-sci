import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export type StepperStep = {
  title: string
  description?: string
  icon?: React.ReactNode
  optional?: boolean
}

export type StepperProps = {
  steps: StepperStep[]
  currentStep: number
  orientation?: "horizontal" | "vertical"
  onStepClick?: (index: number) => void
  className?: string
}

function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  onStepClick,
  className,
}: StepperProps) {
  const isHorizontal = orientation === "horizontal"

  return (
    <ol
      className={cn(
        "flex w-full",
        isHorizontal ? "flex-row items-start" : "flex-col",
        className
      )}
    >
      {steps.map((step, index) => {
        const status =
          index < currentStep
            ? "complete"
            : index === currentStep
              ? "current"
              : "upcoming"
        const isLast = index === steps.length - 1
        const clickable = Boolean(onStepClick)

        return (
          <li
            key={step.title}
            className={cn(
              "relative flex",
              isHorizontal
                ? "flex-1 flex-col items-center text-center"
                : "flex-row gap-4 pb-8 last:pb-0"
            )}
          >
            {!isLast && (
              <div
                aria-hidden
                className={cn(
                  "bg-border absolute transition-colors",
                  isHorizontal
                    ? "left-1/2 top-4 h-px w-full"
                    : "left-4 top-8 h-full w-px",
                  status === "complete" && "bg-primary"
                )}
              />
            )}

            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick?.(index)}
              aria-current={status === "current" ? "step" : undefined}
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                status === "complete" &&
                  "bg-primary border-primary text-primary-foreground",
                status === "current" &&
                  "border-primary text-primary bg-background",
                status === "upcoming" &&
                  "border-border text-muted-foreground bg-background",
                clickable && "cursor-pointer hover:opacity-80",
                !clickable && "cursor-default"
              )}
            >
              {status === "complete" ? (
                <Check className="h-4 w-4" />
              ) : (
                (step.icon ?? index + 1)
              )}
            </button>

            <div
              className={cn(
                "flex flex-col",
                isHorizontal ? "mt-2 max-w-[10rem] items-center" : "pt-1"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  status === "upcoming" && "text-muted-foreground"
                )}
              >
                {step.title}
                {step.optional && (
                  <span className="text-muted-foreground ml-1 font-normal">
                    (optional)
                  </span>
                )}
              </span>
              {step.description && (
                <span className="text-muted-foreground text-xs">
                  {step.description}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
