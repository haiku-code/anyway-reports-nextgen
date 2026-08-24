import React, { useMemo, useEffect, useState } from 'react'
import _ from 'lodash'
import type { Options } from 'highcharts'
import { Graph } from './Graph'
import { GenderSplitBar } from './GenderSplitBar'
import type { InjuredYearRecord, MonthlyRecord, SexRecord } from '../types'

const years = ['2021', '2022', '2023', '2024', '2025', '2026'] as const
const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרס',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

const SEVERITIES = [
  { key: 'light_injured_count', name: 'פצועים קל', color: '#ffd82b' },
  { key: 'severly_injured_count', name: 'פצועים קשה', color: '#ff9f1c' },
  { key: 'killed_count', name: 'הרוגים', color: '#d81c32' },
] as const

function getFromStatsByYear(stats: InjuredYearRecord[], year: number, severity: string) {
  const yearRecord =
    _.find(stats, { accident_year: year }) ?? _.find(stats, { accident_year: String(year) })
  if (_.isUndefined(yearRecord)) return 0
  return parseInt((yearRecord as any)[severity] ?? 0)
}

function severityStatsByYear(
  stats: InjuredYearRecord[],
  severity: string,
  name: string,
  color: string
) {
  return {
    type: 'line' as const,
    name,
    color,
    data: years.map((year) => getFromStatsByYear(stats, Number(year), severity)),
    key: `${name}-${severity}`,
  }
}

function severityTotal(stats: InjuredYearRecord[], severity: string) {
  return _.sum(years.map((year) => getFromStatsByYear(stats, Number(year), severity)))
}

function lineOptions(stats: InjuredYearRecord[] | null): Options {
  const series = stats
    ? SEVERITIES.map((s) => severityStatsByYear(stats, s.key, s.name, s.color))
    : []
  return {
    chart: { height: 250, type: 'line' },
    credits: { enabled: false },
    title: { text: '' },
    tooltip: { enabled: false },
    series,
    xAxis: { categories: years as unknown as string[] },
    yAxis: {
      title: { text: '' },
      max: Math.max(_(series).map('data').flattenDeep().max() as number, 10),
    },
    plotOptions: {
      series: { enableMouseTracking: false, states: { hover: { enabled: false } } },
    },
  }
}

function columnOptions(stats: MonthlyRecord[] | null): Options {
  const series = [
    {
      type: 'column' as const,
      name: 'נפגעים',
      data: _.reduce(
        HEBREW_MONTHS,
        (res: number[], month) => {
          const current = _.find(stats, { accident_month_hebrew: month }) || { count_1: 0 }
          res.push((current as any).count_1)
          return res
        },
        []
      ),
      color: '#d81c32',
    },
  ]
  return {
    chart: { height: 250, type: 'column' },
    credits: { enabled: false },
    title: { text: '' },
    tooltip: { enabled: false },
    series,
    xAxis: { categories: HEBREW_MONTHS },
    yAxis: {
      title: { text: '' },
      max: Math.max(_(series).map('data').flattenDeep().max() as number, 10),
    },
    plotOptions: {
      series: { enableMouseTracking: false, states: { hover: { enabled: false } } },
    },
  }
}

type Props = {
  title: string
  injuredStats: InjuredYearRecord[] | null
  monthStats: MonthlyRecord[] | null
  genderStats: SexRecord[] | null
}

export const Stats: React.FC<Props> = ({ title, injuredStats, monthStats, genderStats }) => {
  const [isHighlighted, setIsHighlighted] = useState(false)
  const line = useMemo(() => lineOptions(injuredStats), [injuredStats])
  const column = useMemo(() => columnOptions(monthStats), [monthStats])
  const summary = useMemo(
    () =>
      injuredStats
        ? SEVERITIES.map((s) => ({ ...s, total: severityTotal(injuredStats, s.key) }))
        : null,
    [injuredStats]
  )

  useEffect(() => {
    if (title) {
      setIsHighlighted(true)
      const timer = setTimeout(() => setIsHighlighted(false), 800)
      return () => clearTimeout(timer)
    }
  }, [title])

  return (
    <div>
      <div
        className={`text-xl font-bold transition-all duration-300 ${
          isHighlighted ? 'text-blue-600 scale-[1.03] drop-shadow-lg' : 'text-gray-800'
        }`}
      >
        {title || ''}
      </div>

      {summary && (
        <p className="text-sm font-semibold leading-snug">
          {/* the intro and the three counts stay on one line of their own; the
              qualifier starts a new line. below lg the panel is too narrow to
              hold the counts on one line, so they are allowed to wrap there */}
          <span className="block lg:whitespace-nowrap">
            ב-5 השנים האחרונות,{' '}
            {summary.map((s, i) => (
              <React.Fragment key={s.key}>
                {s.total} <span style={{ color: s.color }}>{s.name}</span>
                {i < summary.length - 1 && <span className="me-2">,</span>}
              </React.Fragment>
            ))}
          </span>
          <span className="block">
            בקרב הולכי רגל, רוכבי אופניים וקורקינט בגיל{' '}
            <span className="whitespace-nowrap">5-19</span>
          </span>
        </p>
      )}

      {injuredStats && (
        <section>
          <div className="text-base font-semibold mb-1">נפגעים לפי שנה</div>
          <Graph options={line} />
        </section>
      )}

      {/* the new-cbs-format build answers the months endpoint with an empty
          array for every school, so an unguarded render would draw twelve empty
          bars and read as "no accidents all year". length check, same as the
          gender section below, so the heading goes away with the data. */}
      {monthStats && monthStats.length > 0 && (
        <section>
          <div className="text-base font-semibold mb-1">נפגעים לפי חודש</div>
          <Graph options={column} />
        </section>
      )}

      {genderStats && genderStats.length > 0 && (
        <section className="mt-3">
          <div className="text-base font-semibold mb-2">נפגעים לפי מין</div>
          <GenderSplitBar stats={genderStats} />
        </section>
      )}
    </div>
  )
}
