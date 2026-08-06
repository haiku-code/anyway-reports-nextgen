import React, { useMemo } from 'react'
import type { School } from '../types'
import { getCityName } from '../lib/school'
import { SchoolMarkerPin } from './SchoolMarkerPin'

type Props = {
  school: School
  schoolId: number | null
}

function getLink(school: School, simpleView: boolean) {
  const lat = school.latitude
  const long = school.longitude
  let link = `https://www.anyway.co.il/?zoom=17&lat=${lat}&lon=${long}`
  if (simpleView) {
    link = `${link}&start_date=2020-06-01&end_date=2025-05-31&show_fatal=1&show_severe=1&show_light=1&approx=1&accurate=1&show_markers=1&show_discussions=&show_urban=3&show_intersection=3&show_lane=3&show_day=7&show_holiday=0&show_time=24&start_time=7&end_time=19&weather=0&road=0&separation=0&surface=0&acctype=0&controlmeasure=0&district=0&case_type=0&show_rsa=0&age_groups=234&hide_search=true&map_only=true&hide_search=true`
  }
  return link
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
