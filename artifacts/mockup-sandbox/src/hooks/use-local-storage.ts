import * as React from "react"

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue

  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : initialValue
  } catch {
    return initialValue
  }
}

export function useLocalStorage<T>(
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
            window.localStorage.setItem(key, JSON.stringify(next))
            window.dispatchEvent(
              new CustomEvent("local-storage", { detail: { key } })
            )
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
      window.localStorage.removeItem(key)
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }))
    }
    setStoredValue(initialValue)
  }, [key, initialValue])

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      if ("key" in event && event.key && event.key !== key) return
      if (
        "detail" in event &&
        (event as CustomEvent).detail?.key &&
        (event as CustomEvent).detail.key !== key
      ) {
        return
      }
      setStoredValue(readValue(key, initialValue))
    }

    window.addEventListener("storage", handleStorageChange as EventListener)
    window.addEventListener(
      "local-storage",
      handleStorageChange as EventListener
    )

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange as EventListener
      )
      window.removeEventListener(
        "local-storage",
        handleStorageChange as EventListener
      )
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
