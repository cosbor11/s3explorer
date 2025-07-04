// src/components/EditorPane.tsx
'use client'

import { JSX, useState, useEffect } from 'react'
import { useS3 } from '@/contexts/s3'
import ImageViewer from './editor/ImageViewer'
import CsvViewer from './editor/CsvViewer'
import TextPreview from './editor/TextPreview'
import RawEditor from './editor/RawEditor'
import JSONPreview from './editor/JSONPreview'
import PDFPreview from './editor/PDFPreview' // <-- Add this line

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
  const [mode, setMode] = useState<'preview' | 'raw'>('preview')

  // Restore height from localStorage (for vertical split scenarios)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const prefs = loadPrefs()
    if (prefs && typeof prefs.height === 'number') {
      setHeight(prefs.height)
    }
  }, [])

  // Save height on change
  useEffect(() => {
    if (height !== undefined) savePrefs({ height })
  }, [height])

  if (!selectedFile && !isNewFile) return null

  const ext = selectedFile?.name.split('.').pop()?.toLowerCase()
  let content: JSX.Element
  if (!isNewFile && ext && CSV_EXT.includes(ext) && mode === 'preview') {
    content = <CsvViewer onEdit={() => setMode('raw')} />
  } else if (!isNewFile && (ext === 'md' || ext === 'markdown') && mode === 'preview') {
    content = <TextPreview onEdit={() => setMode('raw')} />
  } else if (!isNewFile && ext === 'json' && mode === 'preview') {
    content = <JSONPreview onEdit={() => setMode('raw')} />
  } else if (!isNewFile && ext === 'pdf' && mode === 'preview') { // <--- PDF support
    content = <PDFPreview />
  } else if (
    !isNewFile &&
    ext &&
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
  ) {
    content = <ImageViewer />
  } else {
    content = <RawEditor onPreview={() => setMode('preview')} />
  }

  // Allow resizing (vertical split only). Example: drag handle at top
  const startDrag = (e: React.MouseEvent) => {
    const startY = e.clientY
    const startH = height ?? 380
    const move = (ev: MouseEvent) => {
      const newH = Math.max(120, startH + (ev.clientY - startY))
      setHeight(newH)
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div
      className="flex-1 flex flex-col h-full relative"
      style={height ? { height } : {}}
    >
      {/* Drag handle for vertical resizing */}
      {height !== undefined && (
        <div
          className="absolute top-0 left-0 w-full h-2 z-10 cursor-ns-resize bg-transparent hover:bg-[#555]/60"
          onMouseDown={startDrag}
          style={{ transform: 'translateY(-1px)' }}
        />
      )}
      {content}
    </div>
  )
}
