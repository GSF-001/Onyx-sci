"use client"

import * as React from "react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export type CommandPaletteItem = {
  value: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  keywords?: string[]
  onSelect: () => void
  disabled?: boolean
}

export type CommandPaletteGroup = {
  heading: string
  items: CommandPaletteItem[]
}

export type CommandPaletteProps = {
  groups: CommandPaletteGroup[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  shortcutKey?: string
  placeholder?: string
  emptyMessage?: string
}

function CommandPalette({
  groups,
  open,
  onOpenChange,
  shortcutKey = "k",
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
}: CommandPaletteProps) {
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = isControlled ? (open as boolean) : internalOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === shortcutKey.toLowerCase() &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault()
        setOpen(!isOpen)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, setOpen, shortcutKey])

  const runCommand = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {groups.map((group, index) => (
          <React.Fragment key={group.heading}>
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                  disabled={item.disabled}
                  onSelect={() => runCommand(item.onSelect)}
                  className="gap-2"
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {index < groups.length - 1 && <CommandSeparator />}
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export { CommandPalette }
