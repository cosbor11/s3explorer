// src/components/EditorPane.tsx
'use client'

import { JSX, useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import ImageViewer from './editor/ImageViewer'
import CsvViewer from './editor/CsvViewer'
import TextPreview from './editor/TextPreview'
import RawEditor from './editor/RawEditor'
import JSONPreview from './editor/JSONPreview'
import PDFPreview from './editor/PDFPreview'

const CSV_EXT = ['csv', 'tsv']
const USERPREFS_KEY = 'editorpane_prefs'

function loadPrefs() {
  try {
    const data = localStorage.getItem(USERPREFS_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch {
    return null
  }
}
function savePrefs(prefs: { height: number }) {
  try {
    localStorage.setItem(USERPREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

export default function EditorPane() {
  const { selectedFile, isNewFile } = useS3()

  /* ------------------------------------------------------------------ */
  /* view‐mode + loading flag                                            */
  /* ------------------------------------------------------------------ */
  const [mode, setMode] = useState<'preview' | 'raw'>('preview')
  const [loadingRaw, setLoadingRaw] = useState(false)

  const switchToRaw = () => {
    // show overlay instantly while RawEditor mounts + hydrates
    setLoadingRaw(true)
    setMode('raw')
  }

  /* ------------------------------------------------------------------ */
  /* resizable height (vertical split)                                   */
  /* ------------------------------------------------------------------ */
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const prefs = loadPrefs()
    if (prefs && typeof prefs.height === 'number') setHeight(prefs.height)
  }, [])

  useEffect(() => {
    if (height !== undefined) savePrefs({ height })
  }, [height])

  /* ------------------------------------------------------------------ */
  /* choose content component                                            */
  /* ------------------------------------------------------------------ */
  if (!selectedFile && !isNewFile) return null

  const ext = selectedFile?.name.split('.').pop()?.toLowerCase()
  let content: JSX.Element

  if (!isNewFile && ext && CSV_EXT.includes(ext) && mode === 'preview') {
    content = <CsvViewer onEdit={switchToRaw} />
  } else if (!isNewFile && (ext === 'md' || ext === 'markdown') && mode === 'preview') {
    content = <TextPreview onEdit={switchToRaw} />
  } else if (!isNewFile && ext === 'json' && mode === 'preview') {
    content = <JSONPreview onEdit={switchToRaw} />
  } else if (!isNewFile && ext === 'pdf' && mode === 'preview') {
    content = <PDFPreview />
  } else if (
    !isNewFile &&
    ext &&
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
  ) {
    content = <ImageViewer />
  } else {
    // Raw editor – call onReady when first painted so overlay can disappear
    content = <RawEditor onPreview={() => setMode('preview')} onReady={() => setLoadingRaw(false)} />
  }

  /* ------------------------------------------------------------------ */
  /* height drag handler                                                 */
  /* ------------------------------------------------------------------ */
  const startDrag = (e: React.MouseEvent) => {
    const startY = e.clientY
    const startH = height ?? 380
    const move = (ev: MouseEvent) => setHeight(Math.max(120, startH + (ev.clientY - startY)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex-1 flex flex-col h-full relative" style={height ? { height } : {}}>
      {/* resize drag handle */}
      {height !== undefined && (
        <div
          className="absolute top-0 left-0 w-full h-2 z-10 cursor-ns-resize bg-transparent hover:bg-[#555]/60"
          onMouseDown={startDrag}
          style={{ transform: 'translateY(-1px)' }}
        />
      )}

      {/* loading overlay shown while switching to RawEditor */}
      {loadingRaw && (
        <div className="absolute inset-0 bg-[#1e1e1e]/80 flex items-center justify-center z-40 pointer-events-none">
          <svg className="animate-spin h-7 w-7 text-[#3794ff]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}

      {content}
    </div>
  )
}
