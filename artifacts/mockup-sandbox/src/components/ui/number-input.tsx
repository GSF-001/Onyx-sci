"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type NumberInputProps = {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  placeholder?: string
  className?: string
  inputClassName?: string
}

function clamp(value: number, min?: number, max?: number) {
  let next = value
  if (min !== undefined) next = Math.max(min, next)
  if (max !== undefined) next = Math.min(max, next)
  return next
}

function roundToPrecision(value: number, precision: number) {
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      defaultValue = 0,
      onChange,
      min,
      max,
      step = 1,
      precision = 0,
      disabled = false,
      placeholder,
      className,
      inputClassName,
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState<number>(
      defaultValue
    )
    const numericValue = isControlled ? (value as number) : internalValue

    const [textValue, setTextValue] = React.useState(String(numericValue))

    React.useEffect(() => {
      setTextValue(String(numericValue))
    }, [numericValue])

    const commit = (next: number) => {
      const clamped = roundToPrecision(clamp(next, min, max), precision)
      if (!isControlled) setInternalValue(clamped)
      onChange?.(clamped)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw === "" || raw === "-" || /^-?\d*\.?\d*$/.test(raw)) {
        setTextValue(raw)
      }
    }

    const handleBlur = () => {
      const parsed = Number.parseFloat(textValue)
      if (Number.isNaN(parsed)) {
        setTextValue(String(numericValue))
        return
      }
      commit(parsed)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        commit(numericValue + step)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        commit(numericValue - step)
      }
    }

    const increment = () => commit(numericValue + step)
    const decrement = () => commit(numericValue - step)

    return (
      <div
        className={cn(
          "border-input dark:bg-input/30 shadow-xs flex h-9 w-full items-stretch overflow-hidden rounded-md border transition-[color,box-shadow] focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <Button
          type="button"
          variant="ghost"
          disabled={disabled || (min !== undefined && numericValue <= min)}
          onClick={decrement}
          tabIndex={-1}
          className="h-full shrink-0 rounded-none px-2.5 disabled:opacity-30"
          aria-label="Decrement"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>

        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 border-x bg-transparent text-center text-sm tabular-nums outline-none disabled:cursor-not-allowed",
            "border-input",
            inputClassName
          )}
        />

        <Button
          type="button"
          variant="ghost"
          disabled={disabled || (max !== undefined && numericValue >= max)}
          onClick={increment}
          tabIndex={-1}
          className="h-full shrink-0 rounded-none px-2.5 disabled:opacity-30"
          aria-label="Increment"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
