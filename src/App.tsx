import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Report } from './components/Report'
import { useIsScrolledPast } from './hooks/useIsScrolledPast'
import { scrollBehavior } from './lib/motion'
import { isMobileViewport } from './lib/viewport'
import type { School } from './types'

export const App: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Element state rather than a ref: Report swaps the wrapper around
  // SchoolSelect when a school gets selected, and the observer has to follow it.
  const [searchElement, setSearchElement] = useState<HTMLDivElement | null>(null)
  const [pendingResultsScroll, setPendingResultsScroll] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  const isSearchScrolledPast = useIsScrolledPast(searchElement)

  useEffect(() => {
    axios
      .get<School[]>('https://www.anyway.co.il/api/schools-names')
      .then((res) => setSchools(res.data))
  }, [])

  // Takes the reader to what they just searched for. Keyed on selectedId so the
  // scroll runs after Report has switched to the layout that contains it.
  // Under md the columns stack, so the stats sit right under the search and are
  // the thing worth landing on. Wider up, stats and map share one row and the
  // top of the block shows both at once.
  useEffect(() => {
    if (!pendingResultsScroll) return
    setPendingResultsScroll(false)

    const target = (isMobileViewport() && statsRef.current) || resultsRef.current
    target?.scrollIntoView({
      behavior: scrollBehavior(),
      block: 'start',
    })
  }, [selectedId, pendingResultsScroll])

  const handleHeaderSelect = (id: number) => {
    setSelectedId(id)
    setPendingResultsScroll(true)
  }

  // The in-page search already sits next to the results on a wide screen, so
  // only the stacked mobile layout needs the page moved.
  const handlePageSelect = (id: number) => {
    setSelectedId(id)
    setPendingResultsScroll(isMobileViewport())
  }

  const selectedSchool = useMemo(
    () => schools.find((s) => s.school_id === selectedId) || null,
    [schools, selectedId]
  )

  return (
    <main className="bg-white">
      <Header
        schools={schools}
        selectedId={selectedId}
        onSelectSchool={handleHeaderSelect}
        showSearch={isSearchScrolledPast}
      />
      <Hero />
      <Report
        schools={schools}
        selectedId={selectedId}
        onSelectSchool={handlePageSelect}
        selectedSchool={selectedSchool}
        searchRef={setSearchElement}
        resultsRef={resultsRef}
        statsRef={statsRef}
      />
    </main>
  )
}

export default App
