import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean
  loadingText?: React.ReactNode
  spinnerPosition?: "start" | "end"
}

const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(
  (
    {
      loading = false,
      loadingText,
      spinnerPosition = "start",
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const spinner = (
      <Loader2
        className={cn(
          "h-4 w-4 animate-spin",
          children || loadingText ? "" : "mx-auto"
        )}
      />
    )

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn("gap-2", className)}
        {...props}
      >
        {loading && spinnerPosition === "start" && spinner}
        {loading ? (loadingText ?? children) : children}
        {loading && spinnerPosition === "end" && spinner}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
