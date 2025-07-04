// src/components/InspectorPanel.tsx
'use client'

import { useState, useRef, Suspense, lazy, useEffect } from 'react'
import { useS3 } from '@/contexts/s3'

const MIN_W = 250
const COLLAPSED_W = 40

// Section component for collapsible sections
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

  // ---- All hooks must be unconditional! ----
  const [width, setWidth] = useState(360)
  const [collapsed, setCollapsed] = useState(false)
  const [visible, setVisible] = useState(true)
  const prevWidth = useRef(width)

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

  // Listen for global toggle events dispatched from BreadcrumbBar
  useEffect(() => {
    const handler = () => {
      // Completely hide/show inspector instead of collapse
      setVisible(v => {
        // When becoming visible, restore previous width/collapsed state
        if (!v) {
          setCollapsed(false)
          setWidth(Math.max(prevWidth.current, MIN_W))
        }
        return !v
      })
    }
    window.addEventListener('toggleInspectorPanel', handler)
    return () => window.removeEventListener('toggleInspectorPanel', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Early return, but after all hooks ---
  if (!selectedBucket || !visible) return null

  // Collapse/expand panel (not used when fully hidden, but preserved for future use)
  function toggleCollapsed() {
    if (collapsed) {
      setCollapsed(false)
      setWidth(Math.max(prevWidth.current, MIN_W))
    } else {
      prevWidth.current = width
      setCollapsed(true)
      setWidth(COLLAPSED_W)
    }
  }

  // Drag to resize panel
  function startDrag(e: React.MouseEvent) {
    if (collapsed) return // disable drag when collapsed
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

  return (
    <div
      className="relative border-l border-[#2d2d2d] bg-[#1e1e1e] overflow-y-auto overflow-x-visible select-none"
      style={{ width, minWidth: collapsed ? COLLAPSED_W : MIN_W }}
    >
      {/* Collapsible content */}
      {!collapsed && (
        <div>
          <Section
            title="Details"
            open={open.details}
            onToggle={() => setOpen((o) => ({ ...o, details: !o.details }))}
          >
            <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
              {open.details && <LazyDetails />}
            </Suspense>
          </Section>
          <Section
            title="Access Control List (ACL)"
            open={open.permissions}
            onToggle={() => setOpen((o) => ({ ...o, permissions: !o.permissions }))}
          >
            <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
              {open.permissions && <LazyACL />}
            </Suspense>
          </Section>
          <Section
            title="Tags"
            open={open.tags}
            onToggle={() => setOpen((o) => ({ ...o, tags: !o.tags }))}
          >
            <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
              {open.tags && <LazyTags />}
            </Suspense>
          </Section>
          <Section
            title="Bucket Policy"
            open={open.policy}
            onToggle={() => setOpen((o) => ({ ...o, policy: !o.policy }))}
          >
            <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
              {open.policy && <LazyPolicy />}
            </Suspense>
          </Section>
          <Section
            title="CORS"
            open={open.cors}
            onToggle={() => setOpen((o) => ({ ...o, cors: !o.cors }))}
          >
            <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
              {open.cors && <LazyCORS />}
            </Suspense>
          </Section>
        </div>
      )}

      {/* Drag / click handle – stays on very edge */}
      {!collapsed && (
        <div
          className="absolute top-0 left-0 h-full w-2 cursor-ew-resize hover:bg-[#555]/60"
          onMouseDown={startDrag}
        />
      )}
    </div>
  )
}
