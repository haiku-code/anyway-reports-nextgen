import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Combobox } from '@headlessui/react'
import _ from 'lodash'
import deburr from 'lodash/deburr'
import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import { SchoolSelectVariant, type School } from '../types'
import { cn } from '../lib/utils'
import { scrollBehavior } from '../lib/motion'

type Suggestion = { label: string; id: number }

type ParsePart = { text: string; highlight: boolean }

type Props = {
  schools: School[]
  onSelectId: (id: number) => void
  variant?: SchoolSelectVariant
}

export const SchoolSelect: React.FC<Props> = ({
  schools,
  onSelectId,
  variant = SchoolSelectVariant.Page,
}) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<number | undefined>(undefined)

  const isSticky = variant === SchoolSelectVariant.Sticky

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const data: Suggestion[] = useMemo(() => {
    return schools.map((school) => {
      const yishuv = (school.yishuv_name ?? '').replace(/^"|"$/g, '')
      return {
        label: yishuv ? `${school.school_name} (${yishuv})` : school.school_name,
        id: school.school_id,
      }
    })
  }, [schools])

  const suggestions: Suggestion[] = useMemo(() => {
    if (!query.trim()) return []

    const inputValue = deburr(query.trim()).toLowerCase()
    const words = inputValue.split(' ').filter(Boolean)

    return _(data)
      .filter((suggestion) => {
        const label = suggestion.label.toLowerCase()
        return words.every((word) => label.includes(word))
      })
      .take(15)
      .uniqBy('id')
      .value()
  }, [query, data])

  const handleSelect = (suggestion: Suggestion | null) => {
    if (suggestion) {
      setSelected(suggestion)
      setQuery('')
      onSelectId(suggestion.id)
      setIsFocused(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 500)
  }

  const handleFocus = () => {
    setIsFocused(true)

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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative group">
      <Combobox value={selected} onChange={handleSelect} nullable>
        <div
          ref={containerRef}
          className={cn(
            'relative border-gray-200 transition-all duration-300 hover:border-gray-300 focus-within:border-blue-400 bg-white',
            isSticky ? 'border rounded-lg' : 'border-2 rounded-xl',
            isFocused && isMobile && !isSticky ? 'mobile-focused' : ''
          )}
        >
          <div
            className={cn(
              'absolute top-1/2 transform -translate-y-1/2 transition-all duration-300',
              isSticky ? 'right-3' : 'right-4',
              isFocused || query ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'
            )}
          >
            {isTyping ? (
              <div className={cn(isSticky ? 'w-4 h-4' : 'w-5 h-5')}>
                <div
                  className={cn(
                    'animate-spin rounded-full border-2 border-blue-500 border-t-transparent',
                    isSticky ? 'h-4 w-4' : 'h-5 w-5'
                  )}
                ></div>
              </div>
            ) : (
              <svg
                className={cn(isSticky ? 'w-4 h-4' : 'w-5 h-5')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>

          <Combobox.Input
            ref={inputRef}
            className={cn(
              'relative w-full bg-transparent transition-all duration-300 focus:placeholder-gray-300 outline-none text-gray-800 placeholder-gray-400 z-10',
              isSticky ? 'text-base py-1.5 pr-9 pl-3' : 'text-lg py-4 pr-12 pl-4'
            )}
            placeholder="הקלד שם מוסד לימודים"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {suggestions.length > 0 && (
          <Combobox.Options className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl bg-white border border-gray-100 shadow-xl list-none m-0 p-0 max-h-96 overflow-y-auto">
            {suggestions.map((s, index) => (
              <Combobox.Option
                key={s.id}
                value={s}
                className={({ active }: { active: boolean }) =>
                  `block px-6 py-4 cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-b-0 ${
                    active
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-900 translate-x-1'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`
                }
                style={{
                  animationDelay: `${index * 0.03}s`,
                }}
              >
                {({ active }: { active: boolean }) => {
                  const matches = match(s.label, query)
                  const parts: ParsePart[] = parse(s.label, matches)
                  return (
                    <div className="flex items-center justify-between animate-slide-in-right">
                      <div className="text-base leading-relaxed">
                        {parts.map((part: ParsePart, idx: number) => (
                          <span
                            key={idx}
                            className={
                              part.highlight
                                ? 'font-semibold bg-yellow-100 px-1 py-0.5 rounded-sm text-yellow-800'
                                : ''
                            }
                          >
                            {part.text}
                          </span>
                        ))}
                      </div>

                      {active && (
                        <div className="mr-2">
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                }}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </Combobox>
    </div>
  )
}
