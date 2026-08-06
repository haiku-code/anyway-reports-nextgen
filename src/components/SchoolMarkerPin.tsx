import React from 'react'
import { cn } from '../lib/utils'
import { SCHOOL_MARKER_GREEN } from '../constants/map'

type Props = {
  className?: string
}

/**
 * A miniature of the green pin anyway.co.il drops on the institution, drawn so
 * the caption above the map shows the reader the very shape they are looking
 * for. Decorative only: the caption beside it already carries the meaning.
 */
export const SchoolMarkerPin: React.FC<Props> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('w-[18px] h-[18px]', className)}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 22s7-7.75 7-13A7 7 0 0 0 5 9c0 5.25 7 13 7 13z" fill={SCHOOL_MARKER_GREEN} />
    <circle cx="12" cy="9" r="3.6" fill="#ffffff" />
    <circle cx="12" cy="9" r="1.5" fill={SCHOOL_MARKER_GREEN} />
  </svg>
)
