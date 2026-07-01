import * as React from "react"

type CopyStatus = "idle" | "copied" | "error"

export function useCopyToClipboard(resetMs = 2000) {
  const [status, setStatus] = React.useState<CopyStatus>("idle")
  const [copiedText, setCopiedText] = React.useState<string | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const copy = React.useCallback(
    async (text: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          const textarea = document.createElement("textarea")
          textarea.value = text
          textarea.style.position = "fixed"
          textarea.style.opacity = "0"
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand("copy")
          document.body.removeChild(textarea)
        }

        setCopiedText(text)
        setStatus("copied")
        timeoutRef.current = setTimeout(() => setStatus("idle"), resetMs)
        return true
      } catch (error) {
        setStatus("error")
        setCopiedText(null)
        timeoutRef.current = setTimeout(() => setStatus("idle"), resetMs)
        return false
      }
    },
    [resetMs]
  )

  return {
    copy,
    copiedText,
    status,
    isCopied: status === "copied",
  } as const
}
