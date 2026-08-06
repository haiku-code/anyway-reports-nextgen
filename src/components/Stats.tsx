import React, { useMemo, useEffect, useState } from 'react'
import _ from 'lodash'
import type { Options } from 'highcharts'
import { Graph } from './Graph'
import { GenderSplitBar } from './GenderSplitBar'
import type { InjuredYearRecord, MonthlyRecord, SexRecord } from '../types'

const years = ['2020', '2021', '2022', '2023', '2024', '2025'] as const
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
    data: [
      getFromStatsByYear(stats, 2020, severity),
      getFromStatsByYear(stats, 2021, severity),
      getFromStatsByYear(stats, 2022, severity),
      getFromStatsByYear(stats, 2023, severity),
      getFromStatsByYear(stats, 2024, severity),
      getFromStatsByYear(stats, 2025, severity),
    ],
    key: `${name}-${severity}`,
  }
}

function lineOptions(stats: InjuredYearRecord[] | null): Options {
  const series = stats
    ? [
        severityStatsByYear(stats, 'light_injured_count', 'פצועים קל', '#ffd82b'),
        severityStatsByYear(stats, 'severly_injured_count', 'פצועים קשה', '#ff9f1c'),
        severityStatsByYear(stats, 'killed_count', 'הרוגים', '#d81c32'),
      ]
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

  useEffect(() => {
    if (title) {
      setIsHighlighted(true)
      const timer = setTimeout(() => setIsHighlighted(false), 800)
      return () => clearTimeout(timer)
    }
  }, [title])

  return (
    <div>
      <div className={`text-xl font-bold transition-all duration-300 ${
        isHighlighted 
          ? 'text-blue-600 scale-[1.03] drop-shadow-lg' 
          : 'text-gray-800'
      }`}>
        {title || ''}
      </div>

      {injuredStats && (
        <div className="text-sm font-semibold">
          <div className="mb-1">ב-5 השנים האחרונות,</div>
          {(() => {
            const series = [
              severityStatsByYear(injuredStats, 'light_injured_count', 'פצועים קל', '#ffd82b'),
              severityStatsByYear(injuredStats, 'severly_injured_count', 'פצועים קשה', '#ff9f1c'),
              severityStatsByYear(injuredStats, 'killed_count', 'הרוגים', '#d81c32'),
            ]
            const summary = series.reduce<Record<string, { sumInjured: number; color: string }>>(
              (acc, s: any) => {
                const sumInjured = _.sum(s.data as number[])
                acc[s.name] = { sumInjured, color: s.color }
                return acc
              },
              {}
            )
            return (
              <div>
                {Object.entries(summary).map(([k, v]) => (
                  <div key={k}>
                    {v.sumInjured} <span style={{ color: v.color }}>{k}</span>
                  </div>
                ))}
                <div>בקרב הולכי רגל, רוכבי אופניים וקורקינט בגיל 5-19</div>
              </div>
            )
          })()}
        </div>
      )}

      {injuredStats && (
        <section>
          <div className="text-base font-semibold mb-1">נפגעים לפי שנה</div>
          <Graph options={line} />
        </section>
      )}

      {monthStats && (
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
