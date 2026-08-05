import { useEffect, useState } from 'react'

// The sticky header is 48px tall on mobile and 56px on desktop while scrolled.
// Using a slightly larger offset means an element only counts as passed once it
// is fully hidden behind the header, and the extra pixels act as hysteresis so
// the flag does not flip while the element sits exactly on the boundary.
const STICKY_HEADER_OFFSET_PX = 64

// The observer root is extended this far below the viewport, so an element that
// has not been reached yet always intersects it. Without that, jumping the
// viewport clean over the element (End key, find in page, restored scroll
// position) crosses no threshold and the observer never fires.
const LOOKAHEAD_PX = 100000

/**
 * Tracks whether `element` has scrolled above the top of the viewport.
 *
 * Deliberately not "is out of view": an element below the fold is also out of
 * view, and treating that as passed would activate the sticky search at the top
 * of the page, before the reader ever reached the real one.
 */
export function useIsScrolledPast(
  element: HTMLElement | null,
  offsetPx: number = STICKY_HEADER_OFFSET_PX
): boolean {
  const [isScrolledPast, setIsScrolledPast] = useState(false)

  useEffect(() => {
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // rootBounds can be null when the document is throttled or framed, in
        // which case the margin we asked for is the same value.
        const rootTop = entry.rootBounds?.top ?? offsetPx
        setIsScrolledPast(!entry.isIntersecting && entry.boundingClientRect.bottom <= rootTop)
      },
      { rootMargin: `-${offsetPx}px 0px ${LOOKAHEAD_PX}px 0px`, threshold: 0 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [element, offsetPx])

  return isScrolledPast
}
