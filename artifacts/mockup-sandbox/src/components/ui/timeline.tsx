import * as React from "react"

import { cn } from "@/lib/utils"

export type TimelineItem = {
  title: React.ReactNode
  description?: React.ReactNode
  timestamp?: React.ReactNode
  icon?: React.ReactNode
  variant?: "default" | "success" | "warning" | "destructive"
}

export type TimelineProps = {
  items: TimelineItem[]
  className?: string
}

const dotVariants: Record<NonNullable<TimelineItem["variant"]>, string> = {
  default: "bg-primary border-primary",
  success: "bg-emerald-500 border-emerald-500",
  warning: "bg-amber-500 border-amber-500",
  destructive: "bg-destructive border-destructive",
}

function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("relative flex flex-col", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const variant = item.variant ?? "default"

        return (
          <li key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="bg-border absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px"
              />
            )}

            <span
              className={cn(
                "relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-background text-xs font-medium text-white",
                item.icon ? "bg-background text-foreground" : dotVariants[variant]
              )}
            >
              {item.icon}
            </span>

            <div className="flex flex-1 flex-col gap-0.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium leading-none">
                  {item.title}
                </span>
                {item.timestamp && (
                  <time className="text-muted-foreground text-xs">
                    {item.timestamp}
                  </time>
                )}
              </div>
              {item.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Timeline }
