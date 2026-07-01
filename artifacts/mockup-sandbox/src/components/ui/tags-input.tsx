"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

export type TagsInputProps = {
  value?: string[]
  defaultValue?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  max?: number
  allowDuplicates?: boolean
  delimiters?: string[]
  validate?: (tag: string) => boolean
  className?: string
  inputClassName?: string
}

const TagsInput = React.forwardRef<HTMLDivElement, TagsInputProps>(
  (
    {
      value,
      defaultValue = [],
      onChange,
      placeholder = "Add a tag...",
      disabled = false,
      max,
      allowDuplicates = false,
      delimiters = [",", "Enter"],
      validate,
      className,
      inputClassName,
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalTags, setInternalTags] = React.useState<string[]>(
      defaultValue
    )
    const tags = isControlled ? (value as string[]) : internalTags

    const [inputValue, setInputValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const setTags = (next: string[]) => {
      if (!isControlled) setInternalTags(next)
      onChange?.(next)
    }

    const addTag = (raw: string) => {
      const tag = raw.trim()
      if (!tag) return
      if (max && tags.length >= max) return
      if (!allowDuplicates && tags.includes(tag)) return
      if (validate && !validate(tag)) return

      setTags([...tags, tag])
      setInputValue("")
    }

    const removeTag = (index: number) => {
      if (disabled) return
      setTags(tags.filter((_, i) => i !== index))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return

      if (delimiters.includes(e.key)) {
        e.preventDefault()
        addTag(inputValue)
        return
      }

      if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
        removeTag(tags.length - 1)
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text")
      if (delimiters.some((d) => d.length === 1 && pasted.includes(d))) {
        e.preventDefault()
        const splitPattern = new RegExp(
          `[${delimiters.filter((d) => d.length === 1).join("")}]`
        )
        pasted
          .split(splitPattern)
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => addTag(t))
      }
    }

    return (
      <div
        ref={ref}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "border-input dark:bg-input/30 shadow-xs flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none transition-[color,box-shadow] focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(index)
                }}
                aria-label={`Remove ${tag}`}
                className="hover:text-destructive -mr-0.5 rounded-sm transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => inputValue && addTag(inputValue)}
          disabled={disabled || (max !== undefined && tags.length >= max)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className={cn(
            "placeholder:text-muted-foreground min-w-[80px] flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed",
            inputClassName
          )}
        />
      </div>
    )
  }
)
TagsInput.displayName = "TagsInput"

export { TagsInput }
