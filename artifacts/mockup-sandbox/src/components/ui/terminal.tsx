"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type TerminalLine = {
  type: "command" | "output" | "error"
  content: string
}

export type TerminalProps = {
  lines: TerminalLine[]
  prompt?: string
  title?: string
  interactive?: boolean
  onCommand?: (command: string) => void
  className?: string
}

const Terminal = React.forwardRef<HTMLDivElement, TerminalProps>(
  (
    {
      lines,
      prompt = "$",
      title = "terminal",
      interactive = false,
      onCommand,
      className,
    },
    ref
  ) => {
    const [draft, setDraft] = React.useState("")
    const bodyRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight
      }
    }, [lines])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && draft.trim()) {
        onCommand?.(draft.trim())
        setDraft("")
      }
    }

    return (
      <div
        ref={ref}
        onClick={() => interactive && inputRef.current?.focus()}
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl",
          className
        )}
      >
        <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          <span className="ml-2 truncate text-xs font-medium text-zinc-400">
            {title}
          </span>
        </div>

        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto px-4 py-3 font-mono text-sm leading-relaxed"
        >
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                "whitespace-pre-wrap break-all",
                line.type === "command" && "text-zinc-100",
                line.type === "output" && "text-zinc-400",
                line.type === "error" && "text-red-400"
              )}
            >
              {line.type === "command" ? (
                <>
                  <span className="mr-2 text-emerald-400 select-none">
                    {prompt}
                  </span>
                  {line.content}
                </>
              ) : (
                line.content
              )}
            </div>
          ))}

          {interactive && (
            <div className="flex items-center">
              <span className="mr-2 text-emerald-400 select-none">
                {prompt}
              </span>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoComplete="off"
                className="flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                aria-label="Terminal input"
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)
Terminal.displayName = "Terminal"

export { Terminal }
