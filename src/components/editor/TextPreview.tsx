// src/components/editor/TextPreview.tsx
'use client'

import { useS3 } from '@/contexts/s3'
import MarkdownIt from 'markdown-it'
import type { JSX } from 'react'

const md = new MarkdownIt()

interface Props {
  onEdit(): void
}

export default function TextPreview({ onEdit }: Props) {
  const {
    editedContent,
    dirty,
    wrap,
    setWrap,
    saveFile,
    selectedFile,
    isNewFile,
  } = useS3()

  if (!selectedFile || dirty || isNewFile) return null
  const ext = selectedFile.name.split('.').pop()?.toLowerCase()
  const isMd = ext === 'md' || ext === 'markdown'
  const isJson = ext === 'json'
  if (!isMd && !isJson) return null

  let content: JSX.Element = <pre>{editedContent}</pre>
  if (isMd) {
    content = (
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: md.render(editedContent) }}
      />
    )
  } else if (isJson) {
    try {
      content = (
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(JSON.parse(editedContent), null, 2)}
        </pre>
      )
    } catch {/* fallback */}
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* toolbar */}
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">Preview</span>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
          >
            Edit raw
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">{content}</div>
    </div>
  )
}
