"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

export type HoverToolbarAction = {
  value: string
  label: string
  icon: React.ReactNode
  onClick: (selectedText: string) => void
  isActive?: (selectedText: string) => boolean
}

export type HoverToolbarProps = {
  containerRef: React.RefObject<HTMLElement>
  actions: HoverToolbarAction[]
  offset?: number
  className?: string
}

type Position = { top: number; left: number }

function HoverToolbar({
  containerRef,
  actions,
  offset = 10,
  className,
}: HoverToolbarProps) {
  const [position, setPosition] = React.useState<Position | null>(null)
  const [selectedText, setSelectedText] = React.useState("")
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleSelectionChange = () => {
      const selection = window.getSelection()

      if (
        !selection ||
        selection.isCollapsed ||
        selection.rangeCount === 0
      ) {
        setPosition(null)
        return
      }

      const range = selection.getRangeAt(0)
      const anchorNode = selection.anchorNode

      if (!anchorNode || !container.contains(anchorNode)) {
        setPosition(null)
        return
      }

      const text = selection.toString().trim()
      if (!text) {
        setPosition(null)
        return
      }

      const rect = range.getBoundingClientRect()
      setSelectedText(text)
      setPosition({
        top: rect.top + window.scrollY - offset,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange)
  }, [containerRef, offset])

  React.useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        setPosition(null)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  if (!mounted || !position) return null

  return createPortal(
    <div
      ref={toolbarRef}
      role="toolbar"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -100%)",
      }}
      className={cn(
        "bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 z-50 flex items-center gap-0.5 rounded-md border p-1 shadow-md",
        className
      )}
    >
      {actions.map((action) => {
        const active = action.isActive?.(selectedText) ?? false
        return (
          <button
            key={action.value}
            type="button"
            aria-label={action.label}
            aria-pressed={active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => action.onClick(selectedText)}
            className={cn(
              "hover:bg-accent hover:text-accent-foreground flex size-7 items-center justify-center rounded-sm transition-colors [&_svg]:size-4",
              active && "bg-accent text-accent-foreground"
            )}
          >
            {action.icon}
          </button>
        )
      })}
    </div>,
    document.body
  )
}

export { HoverToolbar }
