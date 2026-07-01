import * as React from "react"

let lockCount = 0

export function useScrollLock(locked = true) {
  React.useEffect(() => {
    if (!locked) return
    if (typeof document === "undefined") return

    const body = document.body
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth

    if (lockCount === 0) {
      const originalOverflow = body.style.overflow
      const originalPaddingRight = body.style.paddingRight

      body.style.overflow = "hidden"
      if (scrollBarWidth > 0) {
        const currentPaddingRight =
          parseFloat(window.getComputedStyle(body).paddingRight) || 0
        body.style.paddingRight = `${currentPaddingRight + scrollBarWidth}px`
      }

      body.dataset.scrollLockOverflow = originalOverflow
      body.dataset.scrollLockPaddingRight = originalPaddingRight
    }

    lockCount++

    return () => {
      lockCount = Math.max(lockCount - 1, 0)

      if (lockCount === 0) {
        body.style.overflow = body.dataset.scrollLockOverflow ?? ""
        body.style.paddingRight = body.dataset.scrollLockPaddingRight ?? ""
        delete body.dataset.scrollLockOverflow
        delete body.dataset.scrollLockPaddingRight
      }
    }
  }, [locked])
}
