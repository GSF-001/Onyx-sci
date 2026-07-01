"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CodeBlockProps = {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = code
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }

    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const lines = code.replace(/\n$/, "").split("\n")

  return (
    <div
      className={cn(
        "border-border bg-muted/40 relative overflow-hidden rounded-lg border",
        className
      )}
    >
      {(filename || language) && (
        <div className="border-border bg-muted/60 flex items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground text-xs font-medium">
            {filename ?? language}
          </span>
          {filename && language && (
            <span className="text-muted-foreground/70 text-xs">
              {language}
            </span>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label="Copy code"
        className={cn(
          "absolute right-2 h-7 w-7 text-muted-foreground hover:text-foreground",
          filename || language ? "top-1.5" : "top-2"
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>

      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={cn("font-mono", language && `language-${language}`)}>
          {showLineNumbers ? (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td className="text-muted-foreground/50 select-none pr-4 text-right align-top">
                      {index + 1}
                    </td>
                    <td className="whitespace-pre">{line || "\u00A0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            code
          )}
        </code>
      </pre>
    </div>
  )
}

export { CodeBlock }
