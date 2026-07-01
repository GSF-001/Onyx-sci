import * as React from "react"

export function useHover<T extends HTMLElement = HTMLElement>(): [
  React.RefObject<T>,
  boolean,
] {
  const ref = React.useRef<T>(null)
  const [isHovered, setIsHovered] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    node.addEventListener("mouseenter", handleMouseEnter)
    node.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      node.removeEventListener("mouseenter", handleMouseEnter)
      node.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return [ref, isHovered]
}
