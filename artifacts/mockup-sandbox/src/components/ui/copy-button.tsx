"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CopyButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "onClick" | "children"
> & {
  value: string
  onCopy?: (value: string) => void
  resetMs?: number
  icon?: React.ReactNode
  successIcon?: React.ReactNode
}

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      onCopy,
      resetMs = 2000,
      icon,
      successIcon,
      variant = "ghost",
      size = "icon",
      className,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }, [])

    const handleClick = async () => {
      try {
        await navigator.clipboard.writeText(value)
      } catch {
        const textarea = document.createElement("textarea")
        textarea.value = value
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }

      onCopy?.(value)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), resetMs)
    }

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className={cn("transition-colors", className)}
        {...props}
      >
        {copied
          ? (successIcon ?? <Check className="h-4 w-4 text-emerald-500" />)
          : (icon ?? <Copy className="h-4 w-4" />)}
      </Button>
    )
  }
)
CopyButton.displayName = "CopyButton"

export { CopyButton }
