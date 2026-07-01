import * as React from "react"

type WindowSize = {
  width: number | undefined
  height: number | undefined
}

export function useWindowSize(debounceMs = 150): WindowSize {
  const [size, setSize] = React.useState<WindowSize>({
    width: typeof window !== "undefined" ? window.innerWidth : undefined,
    height: typeof window !== "undefined" ? window.innerHeight : undefined,
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return

    let timeoutId: ReturnType<typeof setTimeout>

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, debounceMs)
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [debounceMs])

  return size
}
