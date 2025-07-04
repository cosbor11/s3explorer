// src/components/Sidebar.tsx
'use client'

import Image from 'next/image'
import { useMemo, useState, useRef } from 'react'
import { useS3 } from '@/contexts/s3'

const MIN_W = 160
const COLLAPSED_W = 42
const CHAR_PX = 8
const PADDING = 64
const DEFAULT_W = 425

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="5" cy="12" r="1.5" fill="#4ec9b0" />
    <circle cx="12" cy="12" r="1.5" fill="#4ec9b0" />
    <circle cx="19" cy="12" r="1.5" fill="#4ec9b0" />
  </svg>
)

const PinIcon = ({ pinned }: { pinned: boolean }) =>
  pinned ? (
    <svg width="16" height="16" fill="none" stroke="#fbbf24" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M7 7l10 10M20 6l-4 4m0 0l-6 6m6-6l-6 6" />
      <path d="M16.24 7.76l.7-.7a2 2 0 112.83 2.83l-.7.7" />
      <path d="M4 20l7-7" stroke="#fbbf24" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="#d4d4d4" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M7 7l10 10M20 6l-4 4m0 0l-6 6m6-6l-6 6" />
      <path d="M16.24 7.76l.7-.7a2 2 0 112.83 2.83l-.7.7" />
      <path d="M4 20l7-7" stroke="#d4d4d4" />
    </svg>
  )

export default function Sidebar() {
  const {
    buckets,
    selectedBucket,
    selectBucket,
    openMenu,
    openPrefix,
    createBucket,
  } = useS3()

  const [width, setWidth] = useState(DEFAULT_W)
  const [collapsed, setCollapsed] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const prevWidth = useRef(width)

  // Collapse / expand
  const toggleCollapsed = () => {
    if (collapsed) {
      setCollapsed(false)
      setWidth(Math.max(prevWidth.current, MIN_W))
    } else {
      prevWidth.current = width
      setCollapsed(true)
      setWidth(COLLAPSED_W)
    }
  }

  // Pin toggle
  const togglePinned = () => setPinned(p => !p)

  // Drag-resize
  const startDrag = (e: React.MouseEvent) => {
    if (collapsed) return
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const move = (ev: MouseEvent) => setWidth(Math.max(MIN_W, startW + (ev.clientX - startX)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // Context-menu on empty sidebar
  const onSidebarContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button[data-bucket]')) return
    e.preventDefault()
    openMenu(e, 'emptySidebar')
  }

  // Arrow Icon
  const Arrow = ({ dir }: { dir: 'left' | 'right' }) => (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      stroke="#d4d4d4"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none"
    >
      {dir === 'left'
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )

  // Close menu on outside click
  if (typeof window !== 'undefined') {
    window.onclick = (e) => {
      if (menuOpen && menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
  }

  return (
    <div
      className="relative flex flex-col border-r border-[#2d2d2d] bg-[#252526] select-none"
      style={{ width, minWidth: collapsed ? COLLAPSED_W : MIN_W }}
      onContextMenu={onSidebarContextMenu}
    >
      {/* Collapse / expand toggle (always visible, h-7) */}
      <button
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={toggleCollapsed}
        className="absolute top-2 -right-3 z-10 w-6 h-7 rounded bg-[#232323] hover:bg-[#333] border border-[#333] flex items-center justify-center"
      >
        {collapsed ? <Arrow dir="right" /> : <Arrow dir="left" />}
      </button>

      {/* Menu button (top right) with a small right margin (only when not collapsed) */}
      {!collapsed && (
        <div className="absolute top-2 right-5 z-20">
          <button
            ref={menuBtnRef}
            aria-label="Sidebar options"
            onClick={() => setMenuOpen(open => !open)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#333] bg-[#232323] hover:bg-[#333] transition-colors"
          >
            <MenuIcon />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-[#232323] border border-[#333] rounded shadow-xl py-1 z-40">
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-[#444] transition-colors"
                onClick={() => {
                  setMenuOpen(false)
                  togglePinned()
                }}
              >
                <PinIcon pinned={pinned} />
                <span className="ml-3">{pinned ? "Unpin" : "Pin"}</span>
              </button>
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-[#444] transition-colors"
                onClick={() => {
                  setMenuOpen(false)
                  createBucket()
                }}
              >
                <span className="text-[#4ec9b0] text-lg font-bold mr-3">+</span>
                Bucket
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAIN CONTENT (hidden when collapsed) */}
      {!collapsed && (
        <>
          {/* Logo only */}
          <div className="px-3 py-2 border-b border-[#2d2d2d] flex items-center overflow-visible">
            <Image
              src="/img/s3-explorer-logo.png"
              alt="S3 Explorer"
              width={110}
              height={22}
              priority
            />
          </div>

          {/* Bucket list */}
          <ul className="px-2 py-2 overflow-auto grow">
            {buckets.map((b) => {
              const isSelected = selectedBucket === b
              return (
                <li key={b} onContextMenu={(e) => openMenu(e, 'bucket', undefined, b)}>
                  <button
                    data-bucket
                    onClick={() => {
                      if (isSelected) {
                        openPrefix('')
                      } else {
                        selectBucket(b)
                        if (!pinned) {
                          prevWidth.current = width
                          setCollapsed(true)
                          setWidth(COLLAPSED_W)
                        }
                      }
                    }}
                    className={
                      "w-full px-2 py-1 rounded flex items-center transition-colors text-sm " +
                      (isSelected
                        ? "bg-[#252a30]/80 font-semibold text-[#cdd6f4]"
                        : "hover:bg-[#313131] text-white")
                    }
                  >
                    {/* All folder icons have the same width/height */}
                    {isSelected ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#4ec9b0"
                        className="mr-1 flex-shrink-0"
                      >
                        <path
                          d="M3 4a2 2 0 012-2h4l2 2h8a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="mr-1 flex-shrink-0"
                      >
                        <path
                          d="M3 4a2 2 0 012-2h4l2 2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    )}
                    <span className="truncate">{b}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* Drag-handle (switches between resize & click mode) */}
      {collapsed ? (
        <div
          className="absolute top-0 right-0 h-full w-2 cursor-pointer hover:bg-[#555]/60"
          onClick={toggleCollapsed}
        />
      ) : (
        <div
          className="absolute top-0 right-0 h-full w-2 cursor-ew-resize hover:bg-[#555]/60"
          onMouseDown={startDrag}
        />
      )}
    </div>
  )
}
