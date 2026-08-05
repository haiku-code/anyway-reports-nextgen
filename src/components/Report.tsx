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
import natunLogo from '../assets/natun_leshinuy_logo.png'
import haikuLogo from '../assets/haiku_logo.svg'
import { cn } from '../lib/utils'

import type { School, InjuredYearRecord, MonthlyRecord, SexRecord } from '../types'

const containerSpacing = 'px-4 sm:p-6'
const mainContentSpacing = 'lg:px-16 2xl:px-72 mb-16'

type Props = {
  schools: School[]
  selectedId: number | null
  setSelectedId: (id: number) => void
  selectedSchool: School | null
  // Callback ref, so the observer in App re-attaches when the layout branch
  // below swaps the wrapper around SchoolSelect for a different element.
  searchRef: React.Ref<HTMLDivElement>
  resultsRef: React.RefObject<HTMLDivElement | null>
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
  setSelectedId,
  selectedSchool,
  searchRef,
  resultsRef,
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
    <div className={containerSpacing}>
      {/* scroll-mt keeps the sticky header from covering this block when the
          sticky search scrolls back to it */}
      <div ref={resultsRef} className={cn(mainContentSpacing, 'scroll-mt-16')}>
        {/* Searchbox Section - Responsive Layout */}
        {!selectedSchool ? (
          // When no school is selected - centered and full width
          <div className="w-full flex justify-center mb-16">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 my-4">חפש מוסד חינוך:</h2>
              </div>
              <div id="schoolSearch" ref={searchRef} className="scroll-mt-16">
                <SchoolSelect schools={schools} onSelectId={setSelectedId} />
              </div>
            </div>
          </div>
        ) : (
          // When school is selected - original layout
          <div className="flex flex-col lg:flex-row gap-6 mb-16">
            <div className="lg:w-[30%] w-full">
              <div
                id="schoolSearch"
                ref={searchRef}
                className="rounded-lg border border-neutral-200/70 p-3 mb-3 scroll-mt-16"
              >
                <SchoolSelect schools={schools} onSelectId={setSelectedId} />
              </div>
              {selectedSchool && (
                <div className="rounded-lg border border-neutral-200/70 p-3">
                  <Stats
                    title={title}
                    injuredStats={injuredStats}
                    monthStats={monthStats}
                    genderStats={genderStats}
                  />
                </div>
              )}
            </div>
            <div className="lg:flex-1 w-full">
              {selectedSchool && <Map school={selectedSchool} schoolId={selectedId} />}
            </div>
          </div>
        )}
      </div>

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
  )
}
