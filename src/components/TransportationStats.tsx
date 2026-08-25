import { useState } from 'react'
import { REPORT_PERIODS } from '../data/periods'
import { TRANSPORTATION_MODES } from '../data/transportation'
import { TransportMode } from '../types'
import CasualtyOverviewCard from './CasualtyOverviewCard'
import KeyFindingsPanel from './KeyFindingsPanel'
import TransportationModeCard from './TransportationModeCard'
import Typography, { TableCaption } from './Typography'

export default function TransportationStats() {
  // Independent rather than single-open: the panels are one line each, and
  // closing a card the reader opened earlier would shift everything below it
  // just as they arrive there. The scooter card starts open because it is the
  // one whose previous-period counts explain the headline finding.
  const [expanded, setExpanded] = useState<TransportMode[]>([TransportMode.EScooter])

  const toggle = (mode: TransportMode) =>
    setExpanded((current) =>
      current.includes(mode) ? current.filter((id) => id !== mode) : [...current, mode]
    )

  return (
    <div className="w-full mb-16">
      {/* Same tinted cap and white body the tables above this one use, so the
          section keeps its place in the page's rhythm even though what sits
          inside it is cards rather than rows. */}
      <div
        className="rounded-t-lg border border-gray-200 p-4"
        style={{ backgroundColor: '#E8F7FC' }}
      >
        <TableCaption className="text-center">נפגעים בסביבת מוסדות לימוד</TableCaption>
        <Typography variant="table-body" className="mt-1 text-center text-gray-600">
          השוואה בין התקופות: <span dir="ltr">{REPORT_PERIODS.previous}</span> מול{' '}
          <span dir="ltr">{REPORT_PERIODS.current}</span>
        </Typography>
      </div>

      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-4">
        {/* Narrow screens read the cards one after another, so the column stays
            measured rather than stretching to the width of the tables above.
            From lg the cards go four across and the section takes the full
            width, because that is what lets a reader compare the modes. */}
        <div className="mx-auto max-w-[560px] lg:max-w-none">
          {/* The two summaries share a row once there is width for it. They
              are a pair: the overview gives the scale of the rise across
              every mode, the findings say which modes are driving it, and side
              by side that reads as one thought rather than two stacked
              announcements. */}
          <div className="lg:mb-5 lg:grid lg:grid-cols-2 lg:gap-4">
            {/* Wide screens only. Narrow ones show this card up in the article,
                rendered from the same component. Swapped with responsive classes
                rather than a viewport hook, so there is no first-paint flash of
                the wrong one, and display:none keeps the hidden copy out of the
                accessibility tree rather than reading the figures out twice. */}
            {/* Centred rather than top-aligned: the grid stretches this card to
                the findings panel's height, which is the taller of the two at
                four findings, and its two figures would otherwise sit against
                the top edge over a pool of empty white. */}
            <CasualtyOverviewCard className="mb-3 hidden md:block lg:mb-0 lg:flex lg:flex-col lg:justify-center" />

            {/* Hidden on narrow screens for the same reason as the card above
                it: there the two are joined into one block up in the article,
                so leaving this copy here would print the findings twice. */}
            <KeyFindingsPanel className="mb-5 hidden md:block lg:mb-0" />
          </div>

          <Typography variant="table-header" className="mb-3 text-gray-700">
            פילוח לפי אמצעי תחבורה
          </Typography>

          {/* Three across from lg, and no five across row at any width. Five
              cards would be the tidier grid, but a card needs about 230px to
              keep a severity row on one line, and this page never reliably
              offers that in a five column row: the container is 1055px at
              1280px and 863px at 1536px, where 2xl:px-72 takes 576px of the
              viewport away, so five across wraps ten of the fifteen severity
              rows at both. It only clears at roughly 1890px and up. Three
              across measures clean at every width from 1024px, so the section
              is served whole rather than broken between 1280px and 1890px.

              items-stretch is what makes the panels a set rather than loose
              cards: equal height, so their bottom rows share a line. */}
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-stretch">
            {TRANSPORTATION_MODES.map((stats) => (
              <TransportationModeCard
                key={stats.id}
                stats={stats}
                expanded={expanded.includes(stats.id)}
                onToggle={() => toggle(stats.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
