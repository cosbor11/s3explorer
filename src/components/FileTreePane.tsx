'use client'

import { useState, useMemo } from 'react'
import { useS3 } from '@/contexts/S3Context'
import FileTree from '@/components/FileTree'

const MIN_W = 160
const CHAR_PX = 8
const PADDING = 32

export default function FileTreePane() {
  const { tree } = useS3()

  /* auto-fit initial width */
  const [width, setWidth] = useState(() => {
    if (!tree) return 220
    const longest = Math.max(10, ...tree.map(n => n.name.length))
    return Math.max(MIN_W, longest * CHAR_PX + PADDING)
  })

  /* drag handle */
  const onDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const move = (ev: MouseEvent) =>
      setWidth(Math.max(MIN_W, startW + (ev.clientX - startX)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  if (!tree) return null

  return (
    <div
      className="relative bg-[#232323] border-r border-[#2d2d2d] overflow-auto"
      style={{ width, minWidth: MIN_W }}
    >
      <FileTree /> {/* ← your original tree UI */}

      {/* drag handle (same look/hover as sidebar) */}
      <div
        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-transparent hover:bg-[#555]/60"
        onMouseDown={onDrag}
      />
    </div>
  )
}
