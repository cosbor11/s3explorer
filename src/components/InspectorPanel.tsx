// src/components/InspectorPanel.tsx
'use client'

import { useState, Suspense, lazy } from 'react'
import { useS3 } from '@/contexts/s3'

const MIN_W = 250

const Section = ({
  title,
  children,
  open,
  onToggle,
}: {
  title: string
  children: React.ReactNode
  open: boolean
  onToggle: () => void
}) => (
  <div className="border-b border-[#333]">
    <button
      onClick={onToggle}
      className="w-full text-left px-4 py-2 font-semibold bg-[#232323] hover:bg-[#2e2e2e]"
      tabIndex={0}
    >
      {open ? '▾' : '▸'} {title}
    </button>
    {open && <div className="px-4 py-2 text-sm text-[#d4d4d4]">{children}</div>}
  </div>
)

export default function InspectorPanel() {
  const { selectedBucket } = useS3()
  const [width, setWidth] = useState(360)
  const [open, setOpen] = useState({
    details: false,
    permissions: false,
    tags: false,
    policy: false,
    cors: false,
  })

  const LazyDetails = lazy(() => import('@/components/inspector/DetailsSection'))
  const LazyACL = lazy(() => import('@/components/inspector/ACLSection'))
  const LazyTags = lazy(() => import('@/components/inspector/TagsSection'))
  const LazyPolicy = lazy(() => import('@/components/inspector/PolicySection'))
  const LazyCORS = lazy(() => import('@/components/inspector/CORSSection'))

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const sx = e.clientX
    const sw = width
    const move = (ev: MouseEvent) => setWidth(Math.max(MIN_W, sw - (ev.clientX - sx)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  if (!selectedBucket) return null

  return (
    <div
      className="relative border-l border-[#2d2d2d] bg-[#1e1e1e] overflow-auto select-none"
      style={{ width, minWidth: MIN_W }}
    >
      <Section
        title="Details"
        open={open.details}
        onToggle={() => setOpen(o => ({ ...o, details: !o.details }))}
      >
        <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
          {open.details && <LazyDetails />}
        </Suspense>
      </Section>
      <Section
        title="Access Control List (ACL)"
        open={open.permissions}
        onToggle={() => setOpen(o => ({ ...o, permissions: !o.permissions }))}
      >
        <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
          {open.permissions && <LazyACL />}
        </Suspense>
      </Section>
      <Section
        title="Tags"
        open={open.tags}
        onToggle={() => setOpen(o => ({ ...o, tags: !o.tags }))}
      >
        <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
          {open.tags && <LazyTags />}
        </Suspense>
      </Section>
      <Section
        title="Bucket Policy"
        open={open.policy}
        onToggle={() => setOpen(o => ({ ...o, policy: !o.policy }))}
      >
        <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
          {open.policy && <LazyPolicy />}
        </Suspense>
      </Section>
      <Section
        title="CORS"
        open={open.cors}
        onToggle={() => setOpen(o => ({ ...o, cors: !o.cors }))}
      >
        <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
          {open.cors && <LazyCORS />}
        </Suspense>
      </Section>

      {/* drag handle */}
      <div
        className="absolute top-0 left-0 h-full w-2 cursor-ew-resize bg-transparent hover:bg-[#555]/60"
        onMouseDown={startDrag}
      />
    </div>
  )
}
