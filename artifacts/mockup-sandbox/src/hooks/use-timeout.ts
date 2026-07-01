import * as React from "react"

export function useTimeout(
  callback: () => void,
  delayMs: number | null
) {
  const callbackRef = React.useRef(callback)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const clear = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const reset = React.useCallback(() => {
    clear()
    if (delayMs !== null) {
      timeoutRef.current = setTimeout(() => callbackRef.current(), delayMs)
    }
  }, [clear, delayMs])

  React.useEffect(() => {
    if (delayMs === null) return

    timeoutRef.current = setTimeout(() => callbackRef.current(), delayMs)
    return clear
  }, [delayMs, clear])

  return { clear, reset } as const
}
