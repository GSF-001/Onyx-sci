"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * Mask tokens:
 *  9 - digit (0-9)
 *  A - letter (a-zA-Z)
 *  * - alphanumeric
 * Any other character in the mask is treated as a literal separator.
 *
 * Example masks:
 *  "(999) 999-9999"        -> phone
 *  "999.999.999-99"        -> CPF
 *  "9999 9999 9999 9999"   -> card number
 *  "99/99/9999"            -> date
 */

const TOKEN_PATTERNS: Record<string, RegExp> = {
  "9": /[0-9]/,
  A: /[a-zA-Z]/,
  "*": /[a-zA-Z0-9]/,
}

function formatWithMask(rawValue: string, mask: string) {
  const chars = rawValue.split("")
  let result = ""
  let charIndex = 0

  for (let i = 0; i < mask.length && charIndex < chars.length; i++) {
    const maskChar = mask[i]
    const pattern = TOKEN_PATTERNS[maskChar]

    if (pattern) {
      while (charIndex < chars.length && !pattern.test(chars[charIndex])) {
        charIndex++
      }
      if (charIndex >= chars.length) break
      result += chars[charIndex]
      charIndex++
    } else {
      result += maskChar
      if (chars[charIndex] === maskChar) charIndex++
    }
  }

  return result
}

function unmask(value: string, mask: string) {
  return value
    .split("")
    .filter((char, i) => {
      const maskChar = mask[i]
      return maskChar && TOKEN_PATTERNS[maskChar]?.test(char)
    })
    .join("")
}

export type InputMaskProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> & {
  mask: string
  value?: string
  defaultValue?: string
  onChange?: (formatted: string, raw: string) => void
}

const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ mask, value, defaultValue, onChange, className, ...props }, ref) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(() =>
      formatWithMask(defaultValue ?? "", mask)
    )
    const displayValue = isControlled
      ? formatWithMask(value as string, mask)
      : internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value
      const formatted = formatWithMask(rawInput, mask)
      const raw = unmask(formatted, mask)

      if (!isControlled) setInternalValue(formatted)
      onChange?.(formatted, raw)
    }

    return (
      <Input
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        inputMode="text"
        className={cn("font-mono tracking-wide", className)}
        {...props}
      />
    )
  }
)
InputMask.displayName = "InputMask"

export { InputMask, formatWithMask, unmask }
