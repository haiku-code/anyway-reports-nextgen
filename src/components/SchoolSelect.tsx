import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Combobox } from '@headlessui/react'
import _ from 'lodash'
import deburr from 'lodash/deburr'
import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import {
  GeolocationStatus,
  SchoolSelectVariant,
  type ParsePart,
  type School,
  type Suggestion,
} from '../types'
import { cn } from '../lib/utils'
import { scrollBehavior } from '../lib/motion'
import { getSearchStatus } from '../lib/searchStatus'
import { getGeolocationMessage } from '../lib/geoStatus'
import { getCityName } from '../lib/school'
import { isMobileViewport } from '../lib/viewport'
import { useNearbySchools } from '../hooks/useNearbySchools'
import { mostInjuredCities } from '../constants/topCities'

const MAX_SUGGESTIONS = 15

// Headless UI renders the panel and its options as divs, so the rows inside are
// divs too rather than the list items they look like.
const panelClass =
  'absolute z-20 mt-2 w-full overflow-hidden overflow-y-auto rounded-xl border border-ink/15 bg-white shadow-xl max-h-96'

const panelHeadingClass =
  'border-b border-ink/10 bg-hero-mist/60 px-4 py-2 font-text text-xs text-ink/70'

type Props = {
  schools: School[]
  selectedId: number | null
  onSelectId: (id: number) => void
  variant?: SchoolSelectVariant
}

// Marks the typed text inside a result by weight and contrast rather than
// colour: red reads as an error on a form field, and in this report it already
// means fatalities in the charts.
const highlighted = (text: string, query: string) => {
  const parts: ParsePart[] = parse(text, match(text, query))

  // Nothing matched here, so nothing should be dimmed. Happens on every row
  // when the query matched the town rather than the name, and on every row of
  // the empty state, where there is no query at all.
  if (!parts.some((part) => part.highlight)) return text

  return parts.map((part, index) => (
    <span key={index} className={part.highlight ? 'font-semibold' : 'text-ink/55'}>
      {part.text}
    </span>
  ))
}

export const SchoolSelect: React.FC<Props> = ({
  schools,
  selectedId,
  onSelectId,
  variant = SchoolSelectVariant.Page,
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isSticky = variant === SchoolSelectVariant.Sticky

  const { status: geoStatus, nearby, locate } = useNearbySchools(schools)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileViewport())
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const data: Suggestion[] = useMemo(() => {
    return schools.map((school) => {
      const city = getCityName(school)
      return {
        id: school.school_id,
        name: school.school_name,
        city,
        label: city ? `${school.school_name} (${city})` : school.school_name,
      }
    })
  }, [schools])

  const byId = useMemo(() => new Map(data.map((suggestion) => [suggestion.id, suggestion])), [data])

  const matches: Suggestion[] = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return []

    const words = deburr(trimmed).toLowerCase().split(' ').filter(Boolean)

    return _(data)
      .filter((suggestion) => {
        const label = suggestion.label.toLowerCase()
        return words.every((word) => label.includes(word))
      })
      .uniqBy('id')
      .value()
  }, [query, data])

  const suggestions = useMemo(() => matches.slice(0, MAX_SUGGESTIONS), [matches])

  const nearbyRows = useMemo(
    () =>
      nearby
        .map((school) => byId.get(school.school_id))
        .filter((row): row is Suggestion => Boolean(row)),
    [nearby, byId]
  )

  const selected = useMemo(
    () => data.find((suggestion) => suggestion.id === selectedId) ?? null,
    [data, selectedId]
  )

  // Both instances read the selection from App, so whichever one was used, the
  // other shows the same school rather than an empty field.
  useEffect(() => {
    setQuery(selected?.label ?? '')
  }, [selected])

  // By the time a fix lands the panel it was meant to fill is shut: pressing
  // the locate button reads to Headless UI as a press outside the combobox,
  // and the permission prompt can take focus off the input on top of that.
  // focus() alone will not reopen a field that never lost focus, so this
  // drops it first. The pair leaves the field focused and empty either way,
  // which is the state the results want.
  useEffect(() => {
    if (geoStatus !== GeolocationStatus.Ready) return

    inputRef.current?.blur()
    inputRef.current?.focus()
  }, [geoStatus])

  // A field still holding the school it loaded is at rest, not searching. That
  // keeps the list closed on its own name and the status line on the dataset
  // rather than reporting the one match the loaded name trivially makes.
  const isSearching = query.trim() !== '' && query !== selected?.label
  const hasNoMatches = isSearching && matches.length === 0

  // Three panels, never two at once. Typing shows matches. Before that, the
  // nearby institutions if the reader asked for them, and otherwise the
  // shortcut list, which is the only one that is not a set of schools.
  const showMatches = isSearching && (suggestions.length > 0 || isSticky)
  const showNearby = !isSearching && isFocused && nearbyRows.length > 0
  const showCities = !isSearching && isFocused && nearbyRows.length === 0 && data.length > 0

  const rows = isSearching ? suggestions : nearbyRows

  const searchStatus = getSearchStatus({
    query: isSearching ? query : '',
    matchCount: matches.length,
    totalCount: data.length,
    cap: MAX_SUGGESTIONS,
  })
  const geoMessage = getGeolocationMessage(geoStatus)
  // Whatever the reader is doing right now wins the line. Typing is the more
  // recent act, so a stale "no location permission" never sits on top of a
  // live match count.
  const status = !isSearching && geoMessage ? geoMessage : searchStatus

  const isLocating = geoStatus === GeolocationStatus.Locating
  const canLocate = data.length > 0 && !isLocating

  const handleSelect = (suggestion: Suggestion | null) => {
    if (!suggestion) return

    setQuery(suggestion.label)
    onSelectId(suggestion.id)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleFocus = () => {
    setIsFocused(true)
    // Clears the loaded school name so the field is ready for a new search.
    // Selecting the text instead would not survive, because Headless UI drives
    // the caret itself. handleBlur puts the name back if nothing was typed.
    setQuery('')

    // On mobile, scroll the searchbox to the top of the viewport for better UX.
    // In the sticky header it is already pinned there, so scrolling would only
    // yank the page for no reason.
    if (isMobile && !isSticky) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: scrollBehavior(),
          block: 'start',
          inline: 'nearest',
        })
      }, 100)
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // Tabbing onto a shortcut row inside the panel is still being in the
    // search. Closing on it would unmount the row under the very keypress
    // that reached for it.
    if (rootRef.current?.contains(event.relatedTarget)) return

    setIsFocused(false)
    // Leaving a half typed query behind would contradict the map and the stats,
    // which still show the school that is actually loaded.
    setQuery(selected?.label ?? '')
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  // The submit button does what Enter does. A search button that only decorates
  // the field breaks the expectation it creates. With nothing to submit it puts
  // the caret where the reader has to type instead.
  const handleSubmit = () => {
    const first = suggestions[0]
    if (!first) {
      inputRef.current?.focus()
      return
    }

    handleSelect(first)
    inputRef.current?.blur()
  }

  // A shortcut, not a selection. It writes the town into the field and lets the
  // search do the rest, which is also the clearest demonstration of what typing
  // a town name does.
  const handleCityShortcut = (cityName: string) => {
    setQuery(cityName)
    inputRef.current?.focus()
  }

  const handleLocate = () => {
    // Opens the panel the results will land in, and covers the case where the
    // reader pressed this button without ever having touched the field.
    inputRef.current?.focus()
    locate()
  }

  // Mousedown, not click: it stops the field losing focus, which would close
  // the panel and roll the query back before the button's own handler runs.
  const keepFocus = (event: React.MouseEvent) => event.preventDefault()

  const iconSize = isSticky ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'

  return (
    <div ref={rootRef} className="relative group">
      <Combobox value={selected} onChange={handleSelect} immediate>
        <Combobox.Label className="sr-only">חיפוש מוסד לימודים</Combobox.Label>

        <div
          ref={containerRef}
          className={cn(
            'relative flex items-center rounded-xl border-2 bg-white transition-colors duration-200',
            isSticky ? 'h-10 gap-2 ps-3 pe-1.5' : 'h-14 gap-2 ps-4 pe-2 sm:h-16 sm:gap-3',
            isFocused ? 'border-ink ring-3 ring-ink/15' : 'border-ink/25 group-hover:border-ink/50',
            isFocused && isMobile && !isSticky ? 'mobile-focused' : ''
          )}
        >
          {/* Decorative. The input beside it already says what the field is, to
              both the reader and a screen reader. */}
          <svg
            className={cn('shrink-0 text-ink/45', iconSize)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <Combobox.Input
            ref={inputRef}
            className={cn(
              'min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink/40',
              isSticky ? 'text-sm' : 'text-xl sm:text-2xl'
            )}
            placeholder="שם מוסד או יישוב"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {query && (
            <button
              type="button"
              onMouseDown={keepFocus}
              onClick={handleClear}
              aria-label="ניקוי החיפוש"
              className={cn(
                'flex shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                isSticky ? 'h-8 w-8' : 'h-11 w-11'
              )}
            >
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Below sm the button would squeeze the input past usability at
              360px, and a phone reader types and taps a result anyway. */}
          <button
            type="button"
            onMouseDown={keepFocus}
            onClick={handleSubmit}
            className={cn(
              'hidden shrink-0 cursor-pointer items-center justify-center rounded-lg bg-ink font-text text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:inline-flex',
              isSticky ? 'h-7 px-3 text-sm' : 'h-12 px-6 text-base sm:text-lg'
            )}
          >
            חיפוש
          </button>
        </div>

        {!isSticky && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4">
            <button
              type="button"
              onMouseDown={keepFocus}
              onClick={handleLocate}
              disabled={!canLocate}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 font-text text-sm text-ink underline decoration-ink/30 underline-offset-4 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-base',
                canLocate ? 'cursor-pointer hover:decoration-ink' : 'cursor-default opacity-45'
              )}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {isLocating ? 'מאתר את המיקום שלכם' : 'מוסדות קרובים אליי'}
            </button>

            <p
              aria-live="polite"
              className={cn(
                'font-text text-sm md:text-base',
                hasNoMatches ? 'text-ink' : 'text-ink/60'
              )}
            >
              {status}
            </p>
          </div>
        )}

        {(showMatches || showNearby || showCities) && (
          // Headless UI makes an open panel modal by default, which marks the
          // rest of the page inert. That would take the submit, clear and
          // locate buttons out of reach exactly while the panel they belong to
          // is open, and lock the page scroll on top of it.
          <Combobox.Options modal={false} className={cn(panelClass, 'animate-search-panel')}>
            {/* The panel always says what it is showing. Without typing that is
                which list this is; while typing, and only in the header where
                there is no room for a status line, it is the match count. */}
            {!isSearching || isSticky ? (
              <div role="presentation" className={panelHeadingClass}>
                {isSearching
                  ? status
                  : showNearby
                    ? 'המוסדות הקרובים אליכם'
                    : 'היישובים עם הכי הרבה נפגעים סביב מוסדות חינוך'}
              </div>
            ) : null}

            {/* Shortcuts, not options: they choose no institution, they put a
                town in the field and hand back to the search. They live inside
                this element rather than beside it because a press outside it
                is what Headless UI closes the panel on, and the panel is
                exactly what the town is about to fill.

                Out of the tab order on purpose. Headless UI closes the panel
                the moment the input loses focus, so a tab stop in here is one
                that unmounts as it is reached. Nothing is lost: these type a
                town name into the field, which is what a keyboard reader is
                already doing. */}
            {showCities &&
              mostInjuredCities.map((city) => (
                <div key={city.cityName} role="presentation">
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={keepFocus}
                    onClick={() => handleCityShortcut(city.cityName)}
                    className={cn(
                      'flex w-full cursor-pointer items-baseline justify-between gap-4 border-s-2 border-s-transparent border-b border-b-ink/10 px-4 text-start transition-colors duration-150 hover:border-s-ink hover:bg-hero-mist/50',
                      isSticky ? 'py-2' : 'py-3'
                    )}
                  >
                    <span className={cn('text-ink', isSticky ? 'text-base' : 'text-lg')}>
                      {city.cityName}
                    </span>
                    <span className="shrink-0 font-text text-sm text-ink/60">
                      {city.totalInjured.toLocaleString('he-IL')} נפגעים
                    </span>
                  </button>
                </div>
              ))}

            {rows.map((suggestion) => (
              <Combobox.Option
                key={suggestion.id}
                value={suggestion}
                className={({ active }: { active: boolean }) =>
                  cn(
                    'flex cursor-pointer items-baseline justify-between gap-4 border-s-2 border-b border-b-ink/10 px-4 transition-colors duration-150 last:border-b-0',
                    isSticky ? 'py-2' : 'py-3',
                    active ? 'border-s-ink bg-hero-mist/50' : 'border-s-transparent'
                  )
                }
              >
                <span className={cn('text-ink', isSticky ? 'text-base' : 'text-lg')}>
                  {highlighted(suggestion.name, query)}
                </span>
                {/* Deliberately not highlighted: searching by town makes every
                    row show the same town, so marking it distinguishes nothing
                    and floods the list with the accent colour. */}
                <span className="shrink-0 font-text text-sm text-ink/60">{suggestion.city}</span>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </Combobox>
    </div>
  )
}
