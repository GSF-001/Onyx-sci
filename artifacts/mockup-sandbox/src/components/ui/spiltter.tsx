"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type SplitterProps = {
  children: [React.ReactNode, React.ReactNode]
  direction?: "horizontal" | "vertical"
  defaultSize?: number
  minSize?: number
  maxSize?: number
  onResize?: (size: number) => void
  className?: string
}

function Splitter({
  children,
  direction = "horizontal",
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  onResize,
  className,
}: SplitterProps) {
  const [size, setSize] = React.useState(defaultSize)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isHorizontal = direction === "horizontal"

  const clampSize = React.useCallback(
    (value: number) => Math.min(Math.max(value, minSize), maxSize),
    [minSize, maxSize]
  )

  const updateSizeFromPointer = React.useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const ratio = isHorizontal
        ? ((clientX - rect.left) / rect.width) * 100
        : ((clientY - rect.top) / rect.height) * 100

      const next = clampSize(ratio)
      setSize(next)
      onResize?.(next)
    },
    [isHorizontal, clampSize, onResize]
  )

  React.useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (e: PointerEvent) => {
      updateSizeFromPointer(e.clientX, e.clientY)
    }
    const handlePointerUp = () => setIsDragging(false)

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp)
    document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize"
    document.body.style.userSelect = "none"

    return () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging, isHorizontal, updateSizeFromPointer])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2
    if (
      (isHorizontal && e.key === "ArrowLeft") ||
      (!isHorizontal && e.key === "ArrowUp")
    ) {
      e.preventDefault()
      const next = clampSize(size - step)
      setSize(next)
      onResize?.(next)
    } else if (
      (isHorizontal && e.key === "ArrowRight") ||
      (!isHorizontal && e.key === "ArrowDown")
    ) {
      e.preventDefault()
      const next = clampSize(size + step)
      setSize(next)
      onResize?.(next)
    }
  }

  const [first, second] = children

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full w-full",
        isHorizontal ? "flex-row" : "flex-col",
        className
      )}
    >
      <div
        style={{ flexBasis: `${size}%` }}
        className="min-h-0 min-w-0 overflow-auto"
      >
        {first}
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-orientation={isHorizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(size)}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        onPointerDown={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-border hover:bg-primary/40 focus-visible:bg-primary shrink-0 touch-none transition-colors focus:outline-none",
          isHorizontal ? "w-px cursor-col-resize" : "h-px cursor-row-resize",
          isDragging && "bg-primary"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            isHorizontal
              ? "h-full w-2.5 -translate-x-1"
              : "h-2.5 w-full -translate-y-1"
          )}
        />
      </div>

      <div
        style={{ flexBasis: `${100 - size}%` }}
        className="min-h-0 min-w-0 overflow-auto"
      >
        {second}
      </div>
    </div>
  )
}

export { Splitter }
