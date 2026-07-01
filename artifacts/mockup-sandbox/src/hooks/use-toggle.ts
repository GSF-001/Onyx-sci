import * as React from "react"

export function useToggle(
  initialValue = false
): [boolean, (value?: boolean) => void] {
  const [value, setValue] = React.useState(initialValue)

  const toggle = React.useCallback((next?: boolean) => {
    setValue((prev) => (typeof next === "boolean" ? next : !prev))
  }, [])

  return [value, toggle]
}
