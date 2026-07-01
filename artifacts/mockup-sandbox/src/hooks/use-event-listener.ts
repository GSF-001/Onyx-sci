import * as React from "react"

type EventTarget = Window | Document | HTMLElement | MediaQueryList | null | undefined

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: React.RefObject<Window> | Window,
  options?: boolean | AddEventListenerOptions
): void
export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: React.RefObject<Document> | Document,
  options?: boolean | AddEventListenerOptions
): void
export function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement = HTMLElement
>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: React.RefObject<T>,
  options?: boolean | AddEventListenerOptions
): void
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: React.RefObject<EventTarget> | EventTarget,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = React.useRef(handler)

  React.useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  React.useEffect(() => {
    const targetElement: EventTarget =
      element && "current" in element ? element.current : (element ?? window)

    if (!targetElement?.addEventListener) return

    const eventListener = (event: Event) => savedHandler.current(event)

    targetElement.addEventListener(eventName, eventListener, options)

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options)
    }
  }, [eventName, element, options])
}
