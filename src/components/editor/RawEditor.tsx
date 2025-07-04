// src/components/editor/RawEditor.tsx
'use client'

import React, { useRef, useEffect, useState } from 'react'
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

  const ext = selectedFile?.name.split('.').pop()?.toLowerCase()
  const canPreview = ext && PREVIEWABLE_EXT.includes(ext as any)

  const [local, setLocal] = useState(editedContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  // Focus new file
  useEffect(() => {
    if (isNewFile && textareaRef.current) textareaRef.current.focus()
  }, [isNewFile])

  // Sync local buffer
  useEffect(() => setLocal(editedContent), [editedContent])

  // Line count based on logical lines
  const lineCount = local.split('\n').length

  // Sync gutter scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop
  }
  useEffect(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [local])

  const ring = dirty ? 'ring-1 ring-orange-400' : ''

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
            className={`px-2 py-0.5 border rounded text-xs \$\{dirty
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

      {/* editor with gutter */}
      <div className="flex-1 flex overflow-hidden font-mono text-sm">
        <div
          ref={gutterRef}
          className="select-none pr-2 text-right bg-[#1e1e1e] border-r border-[#2d2d2d] text-gray-500"
          style={{
            overflowY: 'auto',
            msOverflowStyle: 'none', /* IE and Edge */
            scrollbarWidth: 'none',  /* Firefox */
            paddingTop: '0.5em',
            lineHeight: '1.5em',
            paddingRight: '8px',    /* hide scrollbar */
            marginRight: '-8px',    /* hide scrollbar */
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{ height: '1.5em' }}>{i + 1}</div>
          ))}
        </div>

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
          className={`flex-1 min-h-0 resize-none bg-[#1e1e1e] p-4 text-sm text-[#d4d4d4] font-mono focus:outline-none ${ring} \$\{wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
          }`}
        />
      </div>
    </div>
  )
}
