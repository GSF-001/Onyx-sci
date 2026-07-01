import * as React from "react"

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debouncedValue
}

export function useDebouncedCallback<
  T extends (...args: never[]) => void
>(callback: T, delayMs = 300): T {
  const callbackRef = React.useRef(callback)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delayMs)
    },
    [delayMs]
  ) as T
}
