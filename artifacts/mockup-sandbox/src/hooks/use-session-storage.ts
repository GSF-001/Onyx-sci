import * as React from "react"

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue

  try {
    const item = window.sessionStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : initialValue
  } catch {
    return initialValue
  }
}

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() =>
    readValue(key, initialValue)
  )

  const setValue = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value

        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(key, JSON.stringify(next))
          } catch {
            // ignore write errors (quota exceeded, privacy mode, etc.)
          }
        }

        return next
      })
    },
    [key]
  )

  const removeValue = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(key)
    }
    setStoredValue(initialValue)
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
