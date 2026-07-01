"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type DateRangePickerProps = {
  value?: DateRange
  defaultValue?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  dateFormat?: string
  numberOfMonths?: number
  disabled?: boolean
  clearable?: boolean
  fromDate?: Date
  toDate?: Date
  className?: string
}

function DateRangePicker({
  value,
  defaultValue,
  onChange,
  placeholder = "Pick a date range",
  dateFormat = "LLL dd, y",
  numberOfMonths = 2,
  disabled = false,
  clearable = true,
  fromDate,
  toDate,
  className,
}: DateRangePickerProps) {
  const isControlled = value !== undefined
  const [internalRange, setInternalRange] = React.useState<
    DateRange | undefined
  >(defaultValue)
  const range = isControlled ? value : internalRange

  const [open, setOpen] = React.useState(false)

  const handleSelect = (next: DateRange | undefined) => {
    if (!isControlled) setInternalRange(next)
    onChange?.(next)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isControlled) setInternalRange(undefined)
    onChange?.(undefined)
  }

  const label = React.useMemo(() => {
    if (!range?.from) return placeholder
    if (!range.to) return format(range.from, dateFormat)
    return `${format(range.from, dateFormat)} - ${format(range.to, dateFormat)}`
  }, [range, dateFormat, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[280px] justify-start gap-2 text-left font-normal",
            !range?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{label}</span>
          {clearable && range?.from && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="hover:text-foreground text-muted-foreground rounded-sm transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={numberOfMonths}
          defaultMonth={range?.from}
          disabled={(d) => {
            if (fromDate && d < fromDate) return true
            if (toDate && d > toDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
