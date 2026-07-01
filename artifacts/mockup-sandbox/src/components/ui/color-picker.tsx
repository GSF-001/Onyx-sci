"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const DEFAULT_PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#71717a",
  "#000000",
]

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

export type ColorPickerProps = {
  value?: string
  defaultValue?: string
  onChange?: (color: string) => void
  presets?: string[]
  disabled?: boolean
  className?: string
}

function ColorPicker({
  value,
  defaultValue = "#3b82f6",
  onChange,
  presets = DEFAULT_PRESETS,
  disabled = false,
  className,
}: ColorPickerProps) {
  const isControlled = value !== undefined
  const [internalColor, setInternalColor] = React.useState(defaultValue)
  const color = isControlled ? (value as string) : internalColor

  const [hexInput, setHexInput] = React.useState(color)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setHexInput(color)
  }, [color])

  const setColor = (next: string) => {
    if (!isControlled) setInternalColor(next)
    onChange?.(next)
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setHexInput(next)
    if (HEX_PATTERN.test(next)) {
      setColor(next)
    }
  }

  const handleHexBlur = () => {
    if (!HEX_PATTERN.test(hexInput)) {
      setHexInput(color)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-[140px] justify-start gap-2 font-normal", className)}
        >
          <span
            className="border-border h-4 w-4 shrink-0 rounded-sm border"
            style={{ backgroundColor: color }}
          />
          <span className="truncate uppercase">{color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3">
        <div className="flex flex-col gap-3">
          <div className="relative h-24 w-full overflow-hidden rounded-md border">
            <input
              type="color"
              value={HEX_PATTERN.test(color) ? color : "#000000"}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Pick a color"
              className="absolute -left-1 -top-1 h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer border-none p-0"
            />
          </div>

          <div className="grid grid-cols-9 gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={preset}
                onClick={() => setColor(preset)}
                className={cn(
                  "size-5 rounded-sm ring-offset-background transition-transform hover:scale-110",
                  color.toLowerCase() === preset.toLowerCase() &&
                    "ring-ring ring-2 ring-offset-2"
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>

          <Input
            value={hexInput}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            spellCheck={false}
            maxLength={7}
            className="h-8 font-mono text-xs uppercase"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker }
