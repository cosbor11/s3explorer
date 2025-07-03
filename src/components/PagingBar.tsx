// src/components/PagingBar.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useS3 } from '@/contexts/s3'
import { Search, X } from 'lucide-react'

const SEARCH_MODES = [
  { value: 'begins', label: 'Name begins with' },
  { value: 'contains', label: 'Name contains' },
]

export default function PagingBar({
  search,
  setSearch,
  context,
  onSearchKeyDown,
  onSearchClick,
  onClearClick,
}: {
  search: string
  setSearch: (s: string) => void
  context?: string
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onSearchClick?: () => void
  onClearClick?: () => void
}) {
  const {
    searchMode,
    setSearchMode,
    loading,
  } = useS3()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between py-2 px-4 border-t border-neutral-800 text-xs bg-neutral-900/60 backdrop-blur pr-[1px]">
      {/* Search area: icon, input, clear, search button */}
      <div className="flex items-center gap-2 flex-1 max-w-lg">
        <Search className="h-full text-neutral-400" />
        <input
          ref={inputRef}
          type="search"
          className="bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-base w-full"
          placeholder={`Search ${context ?? 'files/folders'}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={onSearchKeyDown}
          disabled={loading}
        />
        {search && (
          <button
            aria-label="Clear search"
            title="Clear search"
            className="ml-2 cursor-pointer"
            tabIndex={0}
            onClick={onClearClick}
            type="button"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
        <button
          className="ml-2 px-3 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm cursor-pointer"
          type="button"
          onClick={onSearchClick}
          disabled={loading}
        >
          Search
        </button>
      </div>
      {/* Search mode dropdown: far right */}
      <div className="mx-4">
        <select
          className="bg-neutral-900 border border-neutral-800 px-2 py-1 rounded text-xs text-neutral-400 outline-none transition-colors"
          value={searchMode}
          onChange={e => setSearchMode(e.target.value as any)}
          disabled={loading}
        >
          {SEARCH_MODES.map(mode => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
