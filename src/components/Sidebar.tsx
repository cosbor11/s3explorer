// src/components/Sidebar.tsx
'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useS3 } from '@/contexts/s3'

const MIN_W = 180
const CHAR_PX = 8
const PADDING = 32

export default function Sidebar() {
  const {
    buckets,
    selectedBucket,
    createBucket,
    selectBucket,
    openMenu,
    openPrefix,
  } = useS3()

  const longest = useMemo(() => Math.max(0, ...buckets.map(b => b.length)), [buckets])
  const [width, setWidth] = useState(Math.max(MIN_W, longest * CHAR_PX + PADDING))

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const sx = e.clientX
    const sw = width
    const move = (ev: MouseEvent) => setWidth(Math.max(MIN_W, sw + (ev.clientX - sx)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // --- Add this handler for sidebar context menu
  const onSidebarContextMenu = (e: React.MouseEvent) => {
    // Prevent context if right-click is on a bucket button
    if (
      (e.target as HTMLElement).closest('button[data-bucket]')
    ) return
    e.preventDefault()
    openMenu(e, 'emptySidebar')
  }

  return (
    <div
      className="relative flex flex-col border-r border-[#2d2d2d] bg-[#252526] select-none"
      style={{ width, minWidth: MIN_W }}
      onContextMenu={onSidebarContextMenu}
    >
      {/* header */}
      <div className="px-3 py-2 border-b border-[#2d2d2d] flex justify-between items-center overflow-visible">
        <div className="p-[1px]">
          <Image
            src="/img/s3-explorer-logo.png"
            alt="S3 Explorer"
            width={110}
            height={22}
            priority
          />
        </div>
        <button
          aria-label="Create bucket"
          className="w-7 h-7 flex items-center justify-center rounded bg-[#303030] hover:bg-[#444] border border-[#555] transition-colors"
          onClick={createBucket}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4ec9b0" strokeWidth="1.5" />
            <defs>
              <linearGradient id="gradPlus" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#3794ff" />
                <stop offset="100%" stopColor="#4ec9b0" />
              </linearGradient>
            </defs>
            <path
              d="M12 7v10M7 12h10"
              stroke="url(#gradPlus)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* bucket list */}
      <ul className="px-2 py-2 overflow-auto grow">
        {buckets.map(b => (
          <li
            key={b}
            onContextMenu={e => {
              // right-click: just open context menu, DO NOT select
              openMenu(e, 'bucket', undefined, b)
            }}
          >
            <button data-bucket
              className={`w-full text-left px-2 py-1 rounded hover:bg-[#313131] text-white ${selectedBucket === b ? 'bg-[#232323] font-semibold' : ''}`}
              onClick={() => {
                if (selectedBucket === b) {
                  /* bucket already active → just reload its root prefix */
                  openPrefix('')
                } else {
                  /* switch buckets */
                  selectBucket(b)
                }
              }}
            >
              {b}
            </button>
          </li>
        ))}
      </ul>
      {/* drag handle */}
      <div
        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-transparent hover:bg-[#555]/60"
        onMouseDown={startDrag}
      />
    </div>
  )
}
