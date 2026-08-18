import React, { useMemo } from 'react'
import type { School } from '../types'
import { getCityName } from '../lib/school'
import { SchoolMarkerPin } from './SchoolMarkerPin'
import { MAP_BASE_URL, MAP_EMBED_FILTERS } from '../constants/map'

type Props = {
  school: School
  schoolId: number | null
}

function getLink(school: School, simpleView: boolean) {
  const base = `${MAP_BASE_URL}?zoom=17&lat=${school.latitude}&lon=${school.longitude}`
  return simpleView ? `${base}&${MAP_EMBED_FILTERS}` : base
}

export const Map: React.FC<Props> = ({ school }) => {
  const simpleView = true
  const url = useMemo(() => getLink(school, simpleView), [school, simpleView])
  const linkText = simpleView
    ? 'לצפיה במפה המלאה עם אפשרויות חיפוש מתקדמות'
    : 'לצפיה במפה פשוטה בלבד'

  // The map itself is a cross origin iframe served by anyway.co.il, so the green
  // pin inside it cannot be labelled from here. This caption names the
  // institution instead, and stays right whatever the reader pans the map to.
  const city = getCityName(school)
  const markerLabel = city ? `${school.school_name}, ${city}` : school.school_name

  return (
    <div className="rounded-lg border border-neutral-200/70 p-4 h-full flex flex-col min-h-[50vh]">
      <div className="text-lg font-semibold mb-1">
        תאונות עם נפגעים (הולכי רגל, רוכבי אופניים וקורקינט) בסביבת מוסד הלימודים
      </div>
      <div className="text-sm text-neutral-600 mb-3">
        {linkText}{' '}
        <a
          className="text-blue-700 hover:underline"
          href={getLink(school, false)}
          target="_blank"
          rel="noreferrer"
        >
          לחצו כאן
        </a>
      </div>
      <div className="flex items-start gap-1.5 text-sm text-neutral-700 mb-2">
        <SchoolMarkerPin className="shrink-0 mt-[1px]" />
        <span>
          המוסד מסומן בירוק: <span className="font-semibold text-neutral-900">{markerLabel}</span>
        </span>
      </div>
      <div className="flex-1 w-full overflow-hidden rounded-md ring-1 ring-black/5 min-h-[50vh] flex">
        <iframe title="anyway-map" src={url} className="flex-1 w-full border-0"></iframe>
      </div>
    </div>
  )
}
