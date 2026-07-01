"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type MultiSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type MultiSelectProps = {
  options: MultiSelectOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  maxDisplay?: number
  className?: string
  contentClassName?: string
}

function MultiSelect({
  options,
  value,
  defaultValue = [],
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  maxDisplay = 2,
  className,
  contentClassName,
}: MultiSelectProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] =
    React.useState<string[]>(defaultValue)
  const selectedValues = isControlled ? (value as string[]) : internalValue

  const [open, setOpen] = React.useState(false)

  const setValues = (next: string[]) => {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  const toggleValue = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      setValues(selectedValues.filter((v) => v !== optionValue))
    } else {
      setValues([...selectedValues, optionValue])
    }
  }

  const removeValue = (optionValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setValues(selectedValues.filter((v) => v !== optionValue))
  }

  const selectedOptions = options.filter((o) =>
    selectedValues.includes(o.value)
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-auto min-h-9 w-[280px] justify-between font-normal",
            className
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selectedOptions.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}

            {selectedOptions.slice(0, maxDisplay).map((option) => (
              <span
                key={option.value}
                className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
              >
                {option.label}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => removeValue(option.value, e)}
                  className="hover:text-destructive rounded-sm transition-colors"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}

            {selectedOptions.length > maxDisplay && (
              <span className="text-muted-foreground text-xs">
                +{selectedOptions.length - maxDisplay} more
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-[280px] p-0", contentClassName)}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => toggleValue(option.value)}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        "border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { MultiSelect }
