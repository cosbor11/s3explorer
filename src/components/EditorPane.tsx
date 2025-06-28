// src/components/EditorPane.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useS3 } from '@/contexts/s3'

export default function EditorPane() {
  const {
    editedContent,
    setEditedContent,
    dirty,
    wrap,
    saveFile,
    isNewFile,          // ← need to know when a blank file is opened
  } = useS3()

  const [local, setLocal] = useState(editedContent)
  const [flash, setFlash] = useState(false)    // green flash after save
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* focus automatically when a brand-new file is created */
  useEffect(() => {
    if (isNewFile && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isNewFile])

  /* keep local buffer in sync when file reloads */
  useEffect(() => {
    if (!dirty && local !== editedContent) setLocal(editedContent)
  }, [editedContent, dirty])

  /* Ctrl / ⌘ + S shortcut */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 's' || e.key === 'S') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (dirty) saveFile().then(ok => ok && setFlash(true))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, saveFile])

  /* turn off flash after 1 s */
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(false), 1000)
    return () => clearTimeout(t)
  }, [flash])

  const ringClass = flash
    ? 'ring-1 ring-green-500'        // subtle success flash
    : dirty
    ? 'ring-1 ring-orange-400'       // file is dirty
    : ''

  return (
    <textarea
      ref={textareaRef}
      value={local}
      onChange={e => {
        setLocal(e.target.value)
        setEditedContent(e.target.value)
      }}
      spellCheck={false}
      className={`
        w-full h-full resize-none bg-[#1e1e1e] p-4 text-sm text-[#d4d4d4] font-mono
        focus:outline-none transition-[box-shadow]
        ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}
        ${ringClass}
      `}
    />
  )
}
