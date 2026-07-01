"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type TransferListItem = {
  value: string
  label: string
  disabled?: boolean
}

export type TransferListProps = {
  items: TransferListItem[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (targetValues: string[]) => void
  sourceTitle?: string
  targetTitle?: string
  searchable?: boolean
  className?: string
}

function TransferPane({
  title,
  items,
  checked,
  onToggle,
  onToggleAll,
  searchable,
}: {
  title: string
  items: TransferListItem[]
  checked: Set<string>
  onToggle: (value: string) => void
  onToggleAll: (checked: boolean) => void
  searchable?: boolean
}) {
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, query])

  const allChecked = items.length > 0 && items.every((i) => checked.has(i.value))

  return (
    <div className="border-input flex h-72 w-64 flex-col overflow-hidden rounded-md border">
      <div className="border-input flex items-center justify-between gap-2 border-b px-3 py-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => onToggleAll(e.target.checked)}
            disabled={items.length === 0}
            className="accent-primary size-3.5"
          />
          {title}
        </label>
        <span className="text-muted-foreground text-xs">
          {checked.size > 0 ? `${checked.size}/${items.length}` : items.length}
        </span>
      </div>

      {searchable && (
        <div className="border-input border-b p-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-7 text-xs"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-1">
        {filtered.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-xs">
            No items
          </p>
        )}
        {filtered.map((item) => (
          <label
            key={item.value}
            className={cn(
              "hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
              item.disabled && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="checkbox"
              checked={checked.has(item.value)}
              onChange={() => onToggle(item.value)}
              disabled={item.disabled}
              className="accent-primary size-3.5"
            />
            <span className="truncate">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function TransferList({
  items,
  value,
  defaultValue = [],
  onChange,
  sourceTitle = "Available",
  targetTitle = "Selected",
  searchable = true,
  className,
}: TransferListProps) {
  const isControlled = value !== undefined
  const [internalTarget, setInternalTarget] =
    React.useState<string[]>(defaultValue)
  const targetValues = isControlled ? (value as string[]) : internalTarget

  const [sourceChecked, setSourceChecked] = React.useState<Set<string>>(
    new Set()
  )
  const [targetChecked, setTargetChecked] = React.useState<Set<string>>(
    new Set()
  )

  const setTarget = (next: string[]) => {
    if (!isControlled) setInternalTarget(next)
    onChange?.(next)
  }

  const sourceItems = items.filter((i) => !targetValues.includes(i.value))
  const targetItems = items.filter((i) => targetValues.includes(i.value))

  const toggleSource = (value: string) => {
    setSourceChecked((prev) => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  const toggleTarget = (value: string) => {
    setTargetChecked((prev) => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  const moveToTarget = () => {
    setTarget([...targetValues, ...Array.from(sourceChecked)])
    setSourceChecked(new Set())
  }

  const moveAllToTarget = () => {
    setTarget(items.map((i) => i.value))
    setSourceChecked(new Set())
  }

  const moveToSource = () => {
    setTarget(targetValues.filter((v) => !targetChecked.has(v)))
    setTargetChecked(new Set())
  }

  const moveAllToSource = () => {
    setTarget([])
    setTargetChecked(new Set())
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <TransferPane
        title={sourceTitle}
        items={sourceItems}
        checked={sourceChecked}
        onToggle={toggleSource}
        onToggleAll={(isChecked) =>
          setSourceChecked(
            isChecked ? new Set(sourceItems.map((i) => i.value)) : new Set()
          )
        }
        searchable={searchable}
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={sourceChecked.size === 0}
          onClick={moveToTarget}
          aria-label="Move selected to target"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={sourceItems.length === 0}
          onClick={moveAllToTarget}
          aria-label="Move all to target"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={targetItems.length === 0}
          onClick={moveAllToSource}
          aria-label="Move all to source"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={targetChecked.size === 0}
          onClick={moveToSource}
          aria-label="Move selected to source"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <TransferPane
        title={targetTitle}
        items={targetItems}
        checked={targetChecked}
        onToggle={toggleTarget}
        onToggleAll={(isChecked) =>
          setTargetChecked(
            isChecked ? new Set(targetItems.map((i) => i.value)) : new Set()
          )
        }
        searchable={searchable}
      />
    </div>
  )
}

export { TransferList }
