import React from 'react'
import { TransportMode } from '../types'
import { cn } from '../lib/utils'

type Props = {
  mode: TransportMode
  className?: string
}

// Line art rather than the solid glyphs the concept drew with Material Symbols.
// The report loads no icon font, and one more webfont for four pictures is not
// worth the request; drawn at the same 1.6 weight the four silhouettes stay
// distinguishable at the 23px they actually render at.

// A diamond frame between two wheels. Shared, because the only thing that
// separates אופניים from אופניים חשמליים is the bolt, and drawing the bike
// twice would let the two drift apart.
const BIKE_FRAME = (
  <>
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M5.5 17.5 10 8.5h5.5l3 9" />
    <path d="m10 8.5 2 9" />
    <path d="M5.5 17.5h6.5" />
  </>
)

// Filled, so the one mark that distinguishes an electric vehicle from its
// unpowered twin still reads once the icon is down at 23px and the strokes
// around it have thinned to a hairline. It sits clear of the frame rather than
// inside it, where at that size it silted up into the tubes it crossed.
const BOLT_ABOVE_FRAME = 'M13.4 2.6 11 6.5h1.7l-.7 2.7 2.6-4h-1.7z'

// Two wheels, a deck and a T stem. Shared for the same reason BIKE_FRAME is:
// the only thing separating קורקינט from קורקינט חשמלי is the bolt, and the
// pair has to stay identical everywhere else for that to read.
const SCOOTER_FRAME = (
  <>
    <circle cx="5" cy="18" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M7.5 18h8M15.5 18 17.4 8M15.4 7.5h4" />
  </>
)

const PATHS: Record<TransportMode, React.ReactNode> = {
  [TransportMode.Pedestrian]: (
    <>
      <circle cx="12.5" cy="4" r="2" />
      <path d="M12.5 6.5 11 13l-2.5 7.5M11 13l3 3 .5 4.5M12 8.5 9 11m3-2.5 3 1.5 1 3.5" />
    </>
  ),
  [TransportMode.Bike]: BIKE_FRAME,
  [TransportMode.EBike]: (
    <>
      {BIKE_FRAME}
      <path d={BOLT_ABOVE_FRAME} fill="currentColor" stroke="none" />
    </>
  ),
  [TransportMode.EScooter]: (
    <>
      {SCOOTER_FRAME}
      {/* Over the deck, which is the empty part of a scooter, so this one needs
          no clearance the way the bike's does. */}
      <path d="M10.4 9.4 8 13.4h1.8l-.7 3 2.7-4.2h-1.9z" fill="currentColor" stroke="none" />
    </>
  ),
  [TransportMode.Scooter]: SCOOTER_FRAME,
}

export const TransportIcon: React.FC<Props> = ({ mode, className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    // Decorative: the mode's name sits right beside it in every place it renders.
    aria-hidden="true"
    className={cn('size-[23px]', className)}
  >
    {PATHS[mode]}
  </svg>
)

export default TransportIcon
