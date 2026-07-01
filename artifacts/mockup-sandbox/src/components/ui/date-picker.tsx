"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type DatePickerProps = {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  dateFormat?: string
  disabled?: boolean
  clearable?: boolean
  fromDate?: Date
  toDate?: Date
  disabledDates?: (date: Date) => boolean
  className?: string
}

function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  disabled = false,
  clearable = true,
  fromDate,
  toDate,
  disabledDates,
  className,
}: DatePickerProps) {
  const isControlled = value !== undefined
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    defaultValue
  )
  const date = isControlled ? value : internalDate

  const [open, setOpen] = React.useState(false)

  const handleSelect = (next: Date | undefined) => {
    if (!isControlled) setInternalDate(next)
    onChange?.(next)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isControlled) setInternalDate(undefined)
    onChange?.(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[240px] justify-start gap-2 text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">
            {date ? format(date, dateFormat) : placeholder}
          </span>
          {clearable && date && (
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
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => {
            if (disabledDates?.(d)) return true
            if (fromDate && d < fromDate) return true
            if (toDate && d > toDate) return true
            return false
          }}
          defaultMonth={date}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
