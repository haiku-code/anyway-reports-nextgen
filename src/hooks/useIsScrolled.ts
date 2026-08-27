import { useEffect, useState } from 'react'

// The sticky header sits in normal flow, so collapsing it removes its height
// difference from the document: 32px on mobile (80 -> 48) and 36px on desktop
// (92 -> 56). The browser's scroll anchoring compensates for content that
// disappears above the viewport by pulling the scroll position back by the same
// amount, which with a single threshold immediately re-crosses it and expands
// the header again. That feedback loop is what makes the header shake.
//
// The fix is a dead band wider than the largest height difference. Collapsing
// at 48 and expanding at 8 leaves 40px of slack against a 36px pull, so one
// compensation can never reach the opposite threshold.
const COLLAPSE_AT_PX = 48
const EXPAND_AT_PX = 8

/**
 * Tracks whether the page is scrolled far enough for the header to collapse.
 *
 * The two thresholds are deliberately not equal. See the note above: a single
 * threshold oscillates against scroll anchoring because the header's own
 * collapse moves the scroll position back across it.
 */
export function useIsScrolled(): boolean {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled((wasScrolled) => {
        const y = window.scrollY
        if (wasScrolled) return y >= EXPAND_AT_PX
        return y > COLLAPSE_AT_PX
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return isScrolled
}
