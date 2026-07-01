import * as React from "react"

const DOTS = "..." as const

export type UsePaginationOptions = {
  totalItems: number
  pageSize?: number
  initialPage?: number
  siblingCount?: number
}

export function usePagination({
  totalItems,
  pageSize = 10,
  initialPage = 1,
  siblingCount = 1,
}: UsePaginationOptions) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1)
  const [currentPage, setCurrentPageState] = React.useState(
    Math.min(Math.max(initialPage, 1), totalPages)
  )

  const setCurrentPage = React.useCallback(
    (page: number | ((prev: number) => number)) => {
      setCurrentPageState((prev) => {
        const next = typeof page === "function" ? page(prev) : page
        return Math.min(Math.max(next, 1), totalPages)
      })
    },
    [totalPages]
  )

  React.useEffect(() => {
    setCurrentPageState((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const nextPage = React.useCallback(
    () => setCurrentPage((prev) => prev + 1),
    [setCurrentPage]
  )
  const previousPage = React.useCallback(
    () => setCurrentPage((prev) => prev - 1),
    [setCurrentPage]
  )
  const firstPage = React.useCallback(() => setCurrentPage(1), [setCurrentPage])
  const lastPage = React.useCallback(
    () => setCurrentPage(totalPages),
    [setCurrentPage, totalPages]
  )

  const pageRange = React.useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 5

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const showLeftDots = leftSiblingIndex > 2
    const showRightDots = rightSiblingIndex < totalPages - 1

    if (!showLeftDots && showRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, DOTS, totalPages]
    }

    if (showLeftDots && !showRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      )
      return [1, DOTS, ...rightRange]
    }

    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    )
    return [1, DOTS, ...middleRange, DOTS, totalPages]
  }, [currentPage, totalPages, siblingCount])

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  return {
    currentPage,
    totalPages,
    pageSize,
    pageRange,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    setCurrentPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    DOTS,
  } as const
}
