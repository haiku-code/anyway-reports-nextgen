import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Report } from './components/Report'
import { useIsScrolledPast } from './hooks/useIsScrolledPast'
import { scrollBehavior } from './lib/motion'
import type { School } from './types'

export const App: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Element state rather than a ref: Report swaps the wrapper around
  // SchoolSelect when a school gets selected, and the observer has to follow it.
  const [searchElement, setSearchElement] = useState<HTMLDivElement | null>(null)
  const [pendingResultsScroll, setPendingResultsScroll] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const isSearchScrolledPast = useIsScrolledPast(searchElement)

  useEffect(() => {
    axios
      .get<School[]>('https://www.anyway.co.il/api/schools-names')
      .then((res) => setSchools(res.data))
  }, [])

  // Selecting from the sticky search has to bring the reader back to the map
  // and stats. Keyed on selectedId so the scroll runs after Report has switched
  // to the layout that actually contains them.
  useEffect(() => {
    if (!pendingResultsScroll) return
    setPendingResultsScroll(false)
    resultsRef.current?.scrollIntoView({
      behavior: scrollBehavior(),
      block: 'start',
    })
  }, [selectedId, pendingResultsScroll])

  const handleStickySelect = (id: number) => {
    setSelectedId(id)
    setPendingResultsScroll(true)
  }

  const selectedSchool = useMemo(
    () => schools.find((s) => s.school_id === selectedId) || null,
    [schools, selectedId]
  )

  return (
    <main className="bg-white">
      <Header
        schools={schools}
        onSelectSchool={handleStickySelect}
        showSearch={isSearchScrolledPast}
      />
      <Hero />
      <Report
        schools={schools}
        selectedId={selectedId}
        setSelectedId={(id: number) => setSelectedId(id)}
        selectedSchool={selectedSchool}
        searchRef={setSearchElement}
        resultsRef={resultsRef}
      />
    </main>
  )
}

export default App
