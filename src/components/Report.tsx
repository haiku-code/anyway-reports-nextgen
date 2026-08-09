import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Map } from './Map'
import { Stats } from './Stats'
import { SchoolSelect } from './SchoolSelect'
import { VisionZero } from './VisionZero'
import MunicipalityTable from './MunicipalityTable'
import TopCitiesTable from './TopCitiesTable'
import TransportationStats from './TransportationStats'
import EducationalClustersTable from './EducationalClustersTable'
import { ReportArticle } from './ReportArticle'
import { MapEmbed } from './MapEmbed'
import { SectionCta } from './Typography'
import natunLogo from '../assets/natun_leshinuy_logo.png'
import haikuLogo from '../assets/haiku_logo.svg'
import { cn } from '../lib/utils'

import type { School, InjuredYearRecord, MonthlyRecord, SexRecord } from '../types'

const containerSpacing = 'p-4 pt-6 sm:p-6'
// The horizontal halves of the two rules around them. A tinted band has to run
// edge to edge, so it sits outside the padded container and puts the page
// gutters back on its own contents.
const containerGutters = 'px-4 sm:px-6'
const mainContentGutters = 'lg:px-16 2xl:px-72'
const mainContentSpacing = `${mainContentGutters} mb-16`

type Props = {
  schools: School[]
  selectedId: number | null
  onSelectSchool: (id: number) => void
  selectedSchool: School | null
  // Callback ref, so the observer in App re-attaches when the layout branch
  // below swaps the wrapper around SchoolSelect for a different element.
  searchRef: React.Ref<HTMLDivElement>
  resultsRef: React.RefObject<HTMLDivElement | null>
  statsRef: React.RefObject<HTMLDivElement | null>
}

const FooterContent: React.FC = () => {
  return (
    <>
      <div className="w-full bg-white py-8 text-lg ">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="text-gray-600">
              <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-x-2 gap-y-1">
                <div className="flex justify-center md:inline">
                  <span>
                    פיתוח והטמעה: <strong>יובל בר לוי</strong>
                  </span>
                </div>
                <div className="hidden md:inline">
                  <span className="hidden md:inline">|</span>
                </div>
                <div className="flex justify-center md:inline">
                  <span>
                    ניתוח נתונים ועריכת הדו״ח: <strong>גל רייך</strong> ו<strong>עתליה אלון</strong>
                  </span>
                </div>
                <div className="hidden md:inline">
                  <span className="hidden md:inline">|</span>
                </div>
                <div className="flex justify-center md:inline">
                  <span>
                    עורך: <strong>אופיר שמיר</strong>
                  </span>
                </div>
                <div className="hidden md:inline">
                  <span>|</span>
                </div>
                <div className="flex justify-center md:inline">
                  <span>
                    ניהול פרויקט: <strong>ראיין קורנל</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center my-2">
              <div className="text-gray-600">
                <div className="flex justify-center mb-2">
                  <span>
                    צילומים: <strong>shutterstock</strong>
                  </span>
                </div>
                <div className="flex justify-center">
                  <span>
                    תודה מיוחדת: <strong>דרור רשף</strong>, <strong>אבי קליימן</strong>,{' '}
                    <strong>תמר קליר</strong> וקהילת מתנדבי נתון לשינוי
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 md:gap-8 mb-8">
            <div className="text-center">
              <a
                href="https://www.natoon.co.il"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity duration-200"
              >
                <img
                  src={natunLogo}
                  alt="נתון לשינוי"
                  className="h-8 w-auto sm:h-10 md:h-12 lg:h-12 object-contain"
                />
              </a>
            </div>

            <div className="text-center">
              <a
                href="https://www.haiku-code.com/projects-6"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity duration-200"
              >
                <img
                  src={haikuLogo}
                  alt="Haiku"
                  className="h-8 w-auto sm:h-10 md:h-12 lg:h-12 object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const Report: React.FC<Props> = ({
  schools,
  selectedId,
  onSelectSchool,
  selectedSchool,
  searchRef,
  resultsRef,
  statsRef,
}) => {
  const [injuredStats, setInjuredStats] = useState<InjuredYearRecord[] | null>(null)
  const [monthStats, setMonthStats] = useState<MonthlyRecord[] | null>(null)
  const [genderStats, setGenderStats] = useState<SexRecord[] | null>(null)

  useEffect(() => {
    if (selectedId && selectedId !== 0) {
      axios
        .get<
          InjuredYearRecord[]
        >(`https://www.anyway.co.il/api/injured-around-schools?school_id=${selectedId}`)
        .then((res) => setInjuredStats(res.data))
      axios
        .get<
          MonthlyRecord[]
        >(`https://www.anyway.co.il/api/injured-around-schools-months-graphs-data?school_id=${selectedId}`)
        .then((res) => setMonthStats(res.data))
      axios
        .get<
          SexRecord[]
        >(`https://www.anyway.co.il/api/injured-around-schools-sex-graphs-data?school_id=${selectedId}`)
        .then((res) => setGenderStats(res.data))
    }
  }, [selectedId])

  const title = selectedSchool?.school_name ?? ''

  return (
    <div>
      {/* Nothing chosen yet, so the search is the call to action and gets a band
          of the hero's own pale blue. The search cannot be moved above the fold
          without breaking the editorial composition, so the strongest lever left
          is contrast of region: the reader comes out of the hero's blue straight
          into blue and reads the two as one zone, rather than as the start of
          the white document. Once a school is chosen the search becomes a
          control rather than an invitation, and drops back to the plain card
          beside the results. */}
      {!selectedSchool && (
        <section className="bg-hero-mist">
          <div className={cn(containerGutters, mainContentGutters, 'py-10 sm:py-14')}>
            <div className="w-full flex justify-center">
              <div className="w-full max-w-2xl">
                <div className="text-center mb-6 sm:mb-8">
                  <SectionCta>חפשו את מוסד הלימודים שלכם</SectionCta>
                  <p className="mt-3 font-text text-base text-ink/70 md:text-lg">
                    הקלידו שם מוסד או יישוב, וראו אילו כבישים סביבו מסוכנים
                  </p>
                </div>
                <div id="schoolSearch" ref={searchRef} className="scroll-mt-16">
                  <SchoolSelect
                    schools={schools}
                    selectedId={selectedId}
                    onSelectId={onSelectSchool}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className={containerSpacing}>
        {/* scroll-mt keeps the sticky header from covering this block when the
            sticky search scrolls back to it */}
        {selectedSchool && (
          <div ref={resultsRef} className={cn(mainContentSpacing, 'scroll-mt-16')}>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-[36%] w-full">
                <div
                  id="schoolSearch"
                  ref={searchRef}
                  className="rounded-lg border border-neutral-200/70 p-3 mb-3 scroll-mt-16"
                >
                  <SchoolSelect
                    schools={schools}
                    selectedId={selectedId}
                    onSelectId={onSelectSchool}
                  />
                </div>
                <div
                  ref={statsRef}
                  className="rounded-lg border border-neutral-200/70 p-3 scroll-mt-16"
                >
                  <Stats
                    title={title}
                    injuredStats={injuredStats}
                    monthStats={monthStats}
                    genderStats={genderStats}
                  />
                </div>
              </div>
              <div className="lg:flex-1 w-full">
                <Map school={selectedSchool} schoolId={selectedId} />
              </div>
            </div>
          </div>
        )}

        <div className={mainContentSpacing}>
          <ReportArticle />
        </div>

        <div className={mainContentSpacing}>
          <MapEmbed />
        </div>

        <div className={mainContentSpacing}>
          <TopCitiesTable />
          <MunicipalityTable />
          <EducationalClustersTable />
          <TransportationStats />
          <VisionZero />
        </div>

        <FooterContent />
      </div>
    </div>
  )
}
