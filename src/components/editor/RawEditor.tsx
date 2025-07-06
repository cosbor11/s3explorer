'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useS3 } from '@/contexts/s3'
import { getVisualLines } from './editorUtil'
import { X } from 'lucide-react'

const PREVIEWABLE_EXT = ['csv', 'tsv', 'md', 'markdown', 'json'] as const
const USERPREFS_KEY  = 'file_editor_userprefs'
const DEFAULT_FILE_PREFS = { wrap: true }

console.log('RawEditor module loaded')

/* ----------------------------------------------------------- */
/* local-storage helpers                                       */
/* ----------------------------------------------------------- */
function getFilePrefs(path: string) {
  try {
    const all = JSON.parse(localStorage.getItem(USERPREFS_KEY) || '{}')
    return all[path] || {}
  } catch {
    return {}
  }
}
function setFilePrefs(path: string, prefs: any) {
  try {
    const def = DEFAULT_FILE_PREFS
    const all = JSON.parse(localStorage.getItem(USERPREFS_KEY) || '{}')
    const merged = { ...(all[path] || {}), ...prefs }
    Object.keys(def).forEach((k) => merged[k] === def[k] && delete merged[k])
    if (Object.keys(merged).length) all[path] = merged
    else delete all[path]
    localStorage.setItem(USERPREFS_KEY, JSON.stringify(all))
  } catch {}
}

/* ----------------------------------------------------------- */
/* component                                                   */
/* ----------------------------------------------------------- */
interface Props {
  onPreview(): void
  onReady?(): void
}

export default function RawEditor({ onPreview, onReady }: Props) {
  console.log('RawEditor component initializing')
  const {
    editedContent,
    setEditedContent,
    dirty,
    saveFile,
    selectedFile,
    selectedBucket,
    isNewFile,
    currentPrefix,
    openPrefix,
  } = useS3()

  const ext = selectedFile?.name.split('.').pop()?.toLowerCase()
  const canPreview = ext && PREVIEWABLE_EXT.includes(ext as any)
  const filePath =
    selectedFile && selectedBucket
      ? `${selectedBucket}/${selectedFile.fullKey}`
      : null

  /* user prefs ------------------------------------------------ */
  const [wrap, setWrap] = useState(true)
  useEffect(() => {
    if (filePath) {
      const prefs = getFilePrefs(filePath)
      setWrap(
        typeof prefs.wrap === 'boolean' ? prefs.wrap : DEFAULT_FILE_PREFS.wrap,
      )
    }
  }, [filePath])

  /* editing buffer ------------------------------------------- */
  const [local, setLocal] = useState(editedContent)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const gutterRef   = useRef<HTMLDivElement  | null>(null)

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus()
  }, [selectedFile, isNewFile])

  useEffect(() => setLocal(editedContent), [editedContent])

  /* visual line counts – chunked via idle callback ----------- */
  const [visualLineCounts, setVisualLineCounts] = useState<number[]>([])

  const measureLines = useCallback(() => {
    if (!wrap || !textareaRef.current) {
      setVisualLineCounts(local.split('\n').map(() => 1))
      return
    }

    const lines  = local.split('\n')
    const counts = new Array(lines.length).fill(1)
    let idx = 0

    const slice = (deadline: IdleDeadline | null) => {
      const start = performance.now()
      while (
        idx < lines.length &&
        (deadline ? deadline.timeRemaining() > 2 : performance.now() - start < 6)
      ) {
        counts[idx] = getVisualLines(lines[idx], textareaRef.current!)
        idx++
      }
      if (idx < lines.length) {
        (window.requestIdleCallback || setTimeout)(slice)
      } else {
        setVisualLineCounts(counts)
      }
    }

    slice(null) // start immediately (first slice)
  }, [local, wrap])

  /* first measure after paint */
  useEffect(() => {
    requestAnimationFrame(measureLines)
  }, [measureLines])

  /* re-measure on textarea resize */
  useEffect(() => {
    const el = textareaRef.current
    if (!el || !wrap) return
    let frame: number | null = null
    const obs = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measureLines)
    })
    obs.observe(el)
    return () => {
      obs.disconnect()
      frame && cancelAnimationFrame(frame)
    }
  }, [wrap, measureLines])

  /* scroll sync ---------------------------------------------- */
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop
  }
  useEffect(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [local])

  /* helpers --------------------------------------------------- */
  const handleClose = () => openPrefix(currentPrefix)
  const handleToggleWrap = () => {
    setWrap((w) => {
      const next = !w
      filePath && setFilePrefs(filePath, { wrap: next })
      return next
    })
  }

  /* ready signal --------------------------------------------- */
  useEffect(() => {
    console.log('RawEditor ready')
    console.timeEnd('switchToRaw')
    onReady?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* render ---------------------------------------------------- */
  const ring       = dirty ? 'ring-1 ring-orange-400' : ''
  const fontSize   = '0.95rem'
  const lineHeight = '1.5em'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* toolbar */}
      <div className="pl-3 pr-1 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">Edit</span>
        <div className="flex items-center gap-2">
          {canPreview && (
            <button
              onClick={onPreview}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs cursor-pointer"
            >
              Preview
            </button>
          )}
          <button
            disabled={!dirty}
            onClick={saveFile}
            className={`px-2 py-0.5 border rounded text-xs ${
              dirty
                ? 'bg-[#313131] border-[#555] text-white hover:bg-[#3d3d3d] cursor-pointer'
                : 'bg-[#232323] border-[#333] text-[#777] cursor-not-allowed'
            }`}
          >
            Save
          </button>
          <button
            onClick={handleToggleWrap}
            className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs cursor-pointer"
          >
            Wrap: {wrap ? 'On' : 'Off'}
          </button>
          <button
            onClick={handleClose}
            className="px-1 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs flex items-center"
            aria-label="Close file"
            type="button"
          >
            <X className="w-3 h-4" />
          </button>
        </div>
      </div>

      {/* editor area */}
      <div className="flex-1 flex overflow-hidden font-mono text-sm">
        {/* gutter */}
        <div
          ref={gutterRef}
          className="select-none text-right bg-[#1e1e1e] border-r border-[#2d2d2d] text-gray-500"
          style={{
            overflowY: 'auto',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            paddingTop: '0.5em',
            lineHeight,
            paddingLeft: 6,
            paddingRight: 6,
            fontSize,
            height: '100%',
          }}
        >
          {local.split('\n').map((_, i) => (
            <div
              key={i}
              style={{
                height: `calc(${lineHeight} * ${(visualLineCounts[i] || 1)})`,
                fontSize,
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* textarea */}
        <textarea
          ref={textareaRef}
          value={local}
          onChange={(e) => {
            setLocal(e.target.value)
            setEditedContent(e.target.value)
          }}
          spellCheck={false}
          wrap={wrap ? 'soft' : 'off'}
          onScroll={handleScroll}
          className={`flex-1 min-h-0 resize-none bg-[#1e1e1e] text-[#d4d4d4] font-mono focus:outline-none ${ring} ${
            wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
          }`}
          style={{
            fontSize,
            lineHeight,
            height: '100%',
            padding: '0.5em 1rem 0.5em 0.5rem',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
