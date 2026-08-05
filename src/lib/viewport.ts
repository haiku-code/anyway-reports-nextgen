// Tailwind's md breakpoint, the line this report treats as mobile.
const MD_BREAKPOINT_PX = 768

export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MD_BREAKPOINT_PX
}
