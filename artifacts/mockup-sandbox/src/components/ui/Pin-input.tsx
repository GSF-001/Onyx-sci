"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type PinInputProps = {
  length?: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  mask?: boolean
  type?: "numeric" | "alphanumeric"
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  slotClassName?: string
}

const NUMERIC_PATTERN = /^[0-9]$/
const ALPHANUMERIC_PATTERN = /^[a-zA-Z0-9]$/

const PinInput = React.forwardRef<HTMLDivElement, PinInputProps>(
  (
    {
      length = 6,
      value,
      defaultValue = "",
      onChange,
      onComplete,
      mask = false,
      type = "numeric",
      disabled = false,
      autoFocus = false,
      className,
      slotClassName,
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const pin = (isControlled ? (value as string) : internalValue).slice(
      0,
      length
    )

    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
    const pattern = type === "numeric" ? NUMERIC_PATTERN : ALPHANUMERIC_PATTERN

    const setPin = (next: string) => {
      const trimmed = next.slice(0, length)
      if (!isControlled) setInternalValue(trimmed)
      onChange?.(trimmed)
      if (trimmed.length === length) onComplete?.(trimmed)
    }

    const focusSlot = (index: number) => {
      inputRefs.current[index]?.focus()
      inputRefs.current[index]?.select()
    }

    const handleChange = (index: number, raw: string) => {
      const char = raw.slice(-1)
      if (char && !pattern.test(char)) return

      const chars = pin.split("")
      chars[index] = char
      const next = chars.join("").slice(0, length)
      setPin(next)

      if (char && index < length - 1) {
        focusSlot(index + 1)
      }
    }

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Backspace") {
        if (pin[index]) {
          const chars = pin.split("")
          chars[index] = ""
          setPin(chars.join(""))
        } else if (index > 0) {
          const chars = pin.split("")
          chars[index - 1] = ""
          setPin(chars.join(""))
          focusSlot(index - 1)
        }
        e.preventDefault()
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault()
        focusSlot(index - 1)
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault()
        focusSlot(index + 1)
      }
    }

    const handlePaste = (
      index: number,
      e: React.ClipboardEvent<HTMLInputElement>
    ) => {
      e.preventDefault()
      const pasted = e.clipboardData
        .getData("text")
        .split("")
        .filter((c) => pattern.test(c))
        .join("")

      if (!pasted) return

      const chars = pin.split("")
      for (let i = 0; i < pasted.length && index + i < length; i++) {
        chars[index + i] = pasted[i]
      }
      const next = chars.join("").slice(0, length)
      setPin(next)

      const nextIndex = Math.min(index + pasted.length, length - 1)
      focusSlot(nextIndex)
    }

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type={mask ? "password" : "text"}
            inputMode={type === "numeric" ? "numeric" : "text"}
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            value={pin[index] ?? ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "border-input dark:bg-input/30 shadow-xs h-11 w-10 rounded-md border text-center text-lg font-medium outline-none transition-[color,box-shadow]",
              "focus:border-ring focus:ring-1 focus:ring-ring",
              disabled && "cursor-not-allowed opacity-50",
              slotClassName
            )}
          />
        ))}
      </div>
    )
  }
)
PinInput.displayName = "PinInput"

export { PinInput }
