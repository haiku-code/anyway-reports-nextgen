import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Combobox } from '@headlessui/react'
import _ from 'lodash'
import deburr from 'lodash/deburr'
import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import { SchoolSelectVariant, type ParsePart, type School, type Suggestion } from '../types'
import { cn } from '../lib/utils'
import { scrollBehavior } from '../lib/motion'
import { getSearchStatus } from '../lib/searchStatus'
import { getCityName } from '../lib/school'
import { isMobileViewport } from '../lib/viewport'

const MAX_SUGGESTIONS = 15

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
  // when the query matched the town rather than the name.
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

  const isSticky = variant === SchoolSelectVariant.Sticky

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

  const selected = useMemo(
    () => data.find((suggestion) => suggestion.id === selectedId) ?? null,
    [data, selectedId]
  )

  // Both instances read the selection from App, so whichever one was used, the
  // other shows the same school rather than an empty field.
  useEffect(() => {
    setQuery(selected?.label ?? '')
  }, [selected])

  // A field still holding the school it loaded is at rest, not searching. That
  // keeps the list closed on its own name and the status line on the dataset
  // rather than reporting the one match the loaded name trivially makes.
  const isSearching = query.trim() !== '' && query !== selected?.label
  const showPanel = isSearching && (suggestions.length > 0 || isSticky)
  const hasNoMatches = isSearching && matches.length === 0

  const status = getSearchStatus({
    query: isSearching ? query : '',
    matchCount: matches.length,
    totalCount: data.length,
    cap: MAX_SUGGESTIONS,
  })

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

  const handleBlur = () => {
    setIsFocused(false)
    // Leaving a half typed query behind would contradict the map and the stats,
    // which still show the school that is actually loaded.
    setQuery(selected?.label ?? '')
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative group">
      <Combobox value={selected} onChange={handleSelect} nullable>
        <div
          ref={containerRef}
          className={cn(
            'relative border-b-2 bg-white transition-colors duration-200',
            isFocused ? 'border-ink' : 'border-ink/30 group-hover:border-ink/60',
            isFocused && isMobile && !isSticky ? 'mobile-focused' : ''
          )}
        >
          <Combobox.Input
            ref={inputRef}
            className={cn(
              'w-full bg-transparent text-ink outline-none placeholder:text-gray-400',
              isSticky ? 'py-1.5 pe-8 text-base' : 'py-3 pe-10 text-xl md:text-2xl'
            )}
            placeholder="שם מוסד או יישוב"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <div
            className={cn(
              'absolute end-0 top-1/2 -translate-y-1/2',
              isFocused ? 'text-ink' : 'text-gray-400 group-hover:text-ink'
            )}
          >
            {query ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="ניקוי החיפוש"
                className="flex cursor-pointer items-center justify-center transition-colors duration-200 hover:text-ink"
              >
                <svg
                  className={cn(isSticky ? 'w-4 h-4' : 'w-6 h-6')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : (
              // Clicking the magnifier puts the caret in the field, so the
              // pointer cursor promises something real. Kept out of the tab
              // order and the a11y tree: it does nothing the input next to it
              // does not already do.
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => inputRef.current?.focus()}
                className="flex cursor-pointer items-center justify-center transition-colors duration-200 hover:text-ink"
              >
                <svg
                  className={cn(isSticky ? 'w-4 h-4' : 'w-6 h-6')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {!isSticky && (
          <p
            className={cn(
              'mt-3 font-text text-sm md:text-base',
              hasNoMatches ? 'text-ink' : 'text-gray-600'
            )}
          >
            {status}
          </p>
        )}

        {showPanel && (
          <Combobox.Options className="animate-search-panel absolute z-20 mt-2 w-full list-none overflow-hidden overflow-y-auto border border-gray-300 bg-white p-0 shadow-lg max-h-96">
            {isSticky && (
              <li
                role="presentation"
                className="border-b border-gray-200 bg-gray-50 px-4 py-2 font-text text-xs text-gray-600"
              >
                {status}
              </li>
            )}

            {suggestions.map((suggestion) => (
              <Combobox.Option
                key={suggestion.id}
                value={suggestion}
                className={({ active }: { active: boolean }) =>
                  cn(
                    'flex cursor-pointer items-baseline justify-between gap-4 border-s-2 border-b border-b-gray-200 px-4 transition-colors duration-150 last:border-b-0',
                    isSticky ? 'py-2' : 'py-3',
                    active ? 'border-s-ink bg-gray-50' : 'border-s-transparent'
                  )
                }
              >
                <span className={cn('text-ink', isSticky ? 'text-base' : 'text-lg')}>
                  {highlighted(suggestion.name, query)}
                </span>
                {/* Deliberately not highlighted: searching by town makes every
                    row show the same town, so marking it distinguishes nothing
                    and floods the list with the accent colour. */}
                <span className="shrink-0 font-text text-sm text-gray-600">{suggestion.city}</span>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </Combobox>
    </div>
  )
}
