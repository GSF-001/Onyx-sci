"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export type SearchInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  debounceMs?: number
  containerClassName?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      value,
      defaultValue,
      onValueChange,
      debounceMs = 0,
      placeholder = "Search...",
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(
      defaultValue ?? ""
    )
    const currentValue = isControlled ? value : internalValue

    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

    const emitChange = React.useCallback(
      (next: string) => {
        if (!onValueChange) return

        if (debounceMs > 0) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => onValueChange(next), debounceMs)
        } else {
          onValueChange(next)
        }
      },
      [onValueChange, debounceMs]
    )

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      if (!isControlled) setInternalValue(next)
      emitChange(next)
    }

    const handleClear = () => {
      if (!isControlled) setInternalValue("")
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      onValueChange?.("")
    }

    return (
      <div className={cn("relative w-full", containerClassName)}>
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          ref={ref}
          type="search"
          value={currentValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-9",
            currentValue && "pr-9",
            "[&::-webkit-search-cancel-button]:appearance-none",
            className
          )}
          {...props}
        />
        {currentValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
