// src/components/editor/RawEditor.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useS3 } from '@/contexts/s3'

const PREVIEWABLE_EXT = ['csv', 'tsv', 'md', 'markdown', 'json'] as const

interface Props {
  onPreview(): void
}

export default function RawEditor({ onPreview }: Props) {
  const {
    editedContent,
    setEditedContent,
    wrap,
    setWrap,
    dirty,
    saveFile,
    selectedFile,
    isNewFile,
  } = useS3()

  const [local, setLocal] = useState(editedContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* focus when a brand-new file is opened */
  useEffect(() => {
    if (isNewFile && textareaRef.current) textareaRef.current.focus()
  }, [isNewFile])

  /* keep local buffer in sync */
  useEffect(() => setLocal(editedContent), [editedContent])

  /* ring colour */
  const ring = dirty ? 'ring-1 ring-orange-400' : ''

  /* can this file toggle back to Preview? */
  const ext = selectedFile?.name.split('.').pop()?.toLowerCase()
  const canPreview = ext && PREVIEWABLE_EXT.includes(ext as any)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* toolbar */}
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        {canPreview ? (
          <button
            onClick={onPreview}
            className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
          >
            Preview
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <button
            disabled={!dirty}
            onClick={saveFile}
            className={`px-2 py-0.5 border rounded text-xs ${
              dirty
                ? 'bg-[#313131] border-[#555] text-white hover:bg-[#3d3d3d]'
                : 'bg-[#232323] border-[#333] text-[#777] cursor-not-allowed'
            }`}
          >
            Save
          </button>
          <button
            onClick={() => setWrap(!wrap)}
            className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
          >
            Wrap: {wrap ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value)
          setEditedContent(e.target.value)
        }}
        spellCheck={false}
        className={`
          flex-1 min-h-0 resize-none bg-[#1e1e1e] p-4 text-sm text-[#d4d4d4] font-mono
          focus:outline-none ${ring}
          ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}
        `}
      />
    </div>
  )
}
