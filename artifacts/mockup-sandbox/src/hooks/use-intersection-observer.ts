import * as React from "react"

export type UseIntersectionObserverOptions = {
  root?: Element | Document | null
  rootMargin?: string
  threshold?: number | number[]
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>({
  root = null,
  rootMargin = "0px",
  threshold = 0,
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}) {
  const ref = React.useRef<T>(null)
  const [entry, setEntry] = React.useState<IntersectionObserverEntry>()

  const frozen = entry?.isIntersecting && freezeOnceVisible

  React.useEffect(() => {
    const node = ref.current
    if (!node || frozen) return
    if (typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      ([observedEntry]) => setEntry(observedEntry),
      { root, rootMargin, threshold }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [root, rootMargin, JSON.stringify(threshold), frozen])

  return {
    ref,
    entry,
    isIntersecting: entry?.isIntersecting ?? false,
  } as const
}
