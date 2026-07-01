/**
 * React ref merging utilities.
 * Allows combining multiple refs (callback or object refs) into a single
 * callback ref, useful when a component needs to forward a ref while also
 * using it internally.
 */
import type { MutableRefObject, Ref, RefCallback } from "react";

export type PossibleRef<T> = Ref<T> | undefined | null;

/**
 * Assigns a value to a single ref, supporting both callback refs and
 * object refs (React.MutableRefObject).
 */
export function assignRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

/**
 * Merges multiple refs into a single callback ref. Any of the input refs
 * may be null/undefined (e.g. an optional forwarded ref) and will be skipped.
 *
 * @example
 * const Component = forwardRef<HTMLDivElement, Props>((props, forwardedRef) => {
 *   const localRef = useRef<HTMLDivElement>(null);
 *   return <div ref={mergeRefs(localRef, forwardedRef)} />;
 * });
 */
export function mergeRefs<T>(...refs: Array<PossibleRef<T>>): RefCallback<T> {
  return (value: T | null) => {
    for (const ref of refs) {
      assignRef(ref, value);
    }
  };
}

/**
 * Like mergeRefs, but memoizable: returns a stable callback ref for a given
 * array of refs, intended to be used inside useMemo/useCallback by the caller
 * if referential stability across renders is required.
 *
 * @example
 * const combinedRef = useMemo(() => createMergedRef(localRef, forwardedRef), [forwardedRef]);
 */
export function createMergedRef<T>(...refs: Array<PossibleRef<T>>): RefCallback<T> {
  return mergeRefs(...refs);
}
