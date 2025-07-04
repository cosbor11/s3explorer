'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import { getVisualLines } from './editorUtil'
import { X } from 'lucide-react'

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

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus()
  }, [selectedFile, isNewFile])
  useEffect(() => setLocal(editedContent), [editedContent])

  const [visualLineCounts, setVisualLineCounts] = useState<number[]>([])
  useEffect(() => {
    if (!wrap || !textareaRef.current) {
      setVisualLineCounts(local.split('\n').map(() => 1))
      return
    }
    setVisualLineCounts(local.split('\n').map(line => getVisualLines(line, textareaRef.current!)))
  }, [local, wrap, selectedFile, isNewFile])

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop
  }
  useEffect(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [local])

  const ring = dirty ? 'ring-1 ring-orange-400' : ''
  const fontSize = '0.95rem'
  const lineHeight = '1.5em'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* toolbar */}
      <div className="pl-3 pr-1.5 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">Edit</span>
        <div className="flex items-center gap-2">
          {canPreview && (
            <button
              onClick={onPreview}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
            >
              Preview
            </button>
          )}
          <button
            disabled={!dirty}
            onClick={saveFile}
            className={`px-2 py-0.5 border rounded text-xs ${dirty
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
          {canPreview && (
            <button
              onClick={() => textareaRef.current?.focus()}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
              tabIndex={-1}
            >
              Edit
            </button>
          )}
          <button
            className="px-1 py-0.5 bg-[#232323] cursor-pointer hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs flex items-center"
            title="Close file"
            aria-label="Close file"
            tabIndex={0}
            type="button"
          >
            <X className="w-3 h-4" />
          </button>
        </div>
      </div>
      {/* editor with gutter */}
      <div className="flex-1 flex overflow-hidden font-mono text-sm">
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
                height: `calc(${lineHeight} * ${visualLineCounts[i] || 1})`,
                fontSize,
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              {i + 1}
            </div>
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
          className={`flex-1 min-h-0 resize-none bg-[#1e1e1e] text-[#d4d4d4] font-mono focus:outline-none ${ring} ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
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
