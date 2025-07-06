'use client'

import React, { useState, useMemo, startTransition } from 'react'
import { useS3 } from '@/contexts/s3'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  onEdit(): void
}

/* --------------------------------------------------------- */
/* heuristic: does first row look like a header?             */
/* --------------------------------------------------------- */
function isLikelyHeaderRow(row: string[]) {
  if (row.length < 2) return false
  const hasEmpty   = row.some((c) => !c.trim())
  const isNumeric  = row.every((c) => /^[\d\s.,-]+$/.test(c))
  const isUnique   =
    new Set(row.map((c) => c.trim().toLowerCase())).size === row.length
  return !hasEmpty && !isNumeric && isUnique
}

export default function CsvViewer({ onEdit }: Props) {
  const { editedContent, selectedFile } = useS3()

  const [search,   setSearch]   = useState('')
  const [sortCol,  setSortCol]  = useState<number | null>(null)
  const [sortAsc,  setSortAsc]  = useState(true)
  const [switching, setSwitching] = useState(false)   // overlay flag

  /* guards -------------------------------------------------- */
  if (!selectedFile) return null
  const ext = selectedFile.name.split('.').pop()?.toLowerCase()
  if (!ext || !['csv', 'tsv'].includes(ext)) return null

  /* parse --------------------------------------------------- */
  const isLoading = !editedContent
  const rows = isLoading
    ? []
    : editedContent!.split('\n').map((r) =>
        ext === 'tsv' ? r.split('\t') : r.split(','),
      )

  const maxCols   = isLoading ? 0 : Math.max(...rows.map((r) => r.length))
  const useHeader = !isLoading && isLikelyHeaderRow(rows[0] || [])
  const headerRow = useHeader
    ? rows[0]
    : Array.from({ length: maxCols }, (_, i) => String.fromCharCode(65 + i))
  const dataRows  = useHeader ? rows.slice(1) : rows

  /* filter + sort ------------------------------------------- */
  const filteredRows = useMemo(() => {
    if (isLoading || !search.trim()) return dataRows
    const q = search.trim().toLowerCase()
    return dataRows.filter((r) => r.some((c) => c?.toLowerCase().includes(q)))
  }, [dataRows, search, isLoading])

  const sortedRows = useMemo(() => {
    if (isLoading || sortCol === null) return filteredRows
    return [...filteredRows].sort((a, b) => {
      const aVal = (a[sortCol] ?? '').toLowerCase()
      const bVal = (b[sortCol] ?? '').toLowerCase()
      if (!isNaN(+aVal) && !isNaN(+bVal))
        return (+aVal - +bVal) * (sortAsc ? 1 : -1)
      return aVal.localeCompare(bVal) * (sortAsc ? 1 : -1)
    })
  }, [filteredRows, sortCol, sortAsc, isLoading])

  /* handlers ------------------------------------------------- */
  const handleHeaderClick = (col: number) => {
    if (sortCol === col) setSortAsc((a) => !a)
    else {
      setSortCol(col)
      setSortAsc(true)
    }
  }

  const handleEditClick = () => {
    console.log('CsvViewer: Edit clicked')
    console.time('switchToRaw')
    // mark low-priority so React can yield sooner
    startTransition(() => setSwitching(true))
    // let overlay paint before expensive mount
    setTimeout(onEdit, 0)
  }

  /* render --------------------------------------------------- */
  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* toolbar */}
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-gray-400 whitespace-nowrap">
            CSV preview · {sortedRows.length} row
            {sortedRows.length === 1 ? '' : 's'}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find…"
            className="rounded px-2 py-0.5 text-xs bg-[#232323] border border-[#333] text-gray-200 focus:outline-none"
            style={{ minWidth: 220, maxWidth: 350 }}
          />
        </div>
        <button
          onClick={handleEditClick}
          className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs cursor-pointer"
        >
          Edit
        </button>
      </div>

      {/* grid */}
      <div className="flex-1 min-h-0 overflow-auto bg-[#181818]">
        {isLoading ? (
          <div className="absolute inset-0 bg-[#181818]/80 flex items-center justify-center z-30">
            <span className="text-gray-300 text-sm">Loading…</span>
          </div>
        ) : (
          <div className="min-w-max">
            <table className="border border-[#2d2d2d] text-xs text-[#d4d4d4] border-collapse font-mono w-full">
              <thead>
                <tr>
                  {headerRow.map((cell, i) => (
                    <th
                      key={i}
                      onClick={() => handleHeaderClick(i)}
                      className="sticky top-0 z-10 bg-[#191919] border border-[#333] px-2 py-1 font-bold text-[#e0e0e0] text-xs cursor-pointer select-none hover:bg-[#23232b] transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        {cell}
                        {sortCol === i ? (
                          sortAsc ? (
                            <ChevronUp
                              size={13}
                              className="inline -mt-0.5 opacity-60"
                            />
                          ) : (
                            <ChevronDown
                              size={13}
                              className="inline -mt-0.5 opacity-60"
                            />
                          )
                        ) : (
                          <ChevronUp
                            size={13}
                            className="inline -mt-0.5 opacity-25"
                          />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'bg-[#202023]' : 'bg-[#232324]'}
                  >
                    {Array.from({ length: maxCols }).map((_, j) => (
                      <td
                        key={j}
                        className="border border-[#2d2d2d] px-2 py-1 whitespace-pre group-hover:bg-[#28282c] transition-colors duration-75"
                        style={{
                          minWidth: 50,
                          maxWidth: 260,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {row[j] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedRows.length === 0 && (
              <div className="text-xs text-gray-400 p-4">No matching rows.</div>
            )}
          </div>
        )}
      </div>

      {/* overlay while switching */}
      {switching && (
        <div className="absolute inset-0 bg-[#1e1e1e]/80 flex flex-col items-center justify-center z-50">
          <svg
            className="animate-spin h-6 w-6 text-[#3794ff] mb-3"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-gray-300 text-sm">Opening editor…</span>
        </div>
      )}
    </div>
  )
}
