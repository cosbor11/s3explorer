'use client'

import { useS3 } from '@/contexts/S3Context'

const baseCls =
  'w-full h-full bg-[#1e1e1e] rounded border border-[#2d2d2d] p-4 text-sm text-[#d4d4d4] font-mono resize-none overflow-auto'

export default function EditorPane() {
  const {
    isNewFile,
    selectedFile,
    editedContent,
    setEditedContent,
    wrap,
  } = useS3()

  if (!isNewFile && !selectedFile) {
    return (
      <div className="p-6 text-lg text-[#858585]">
        Select a file to view or edit
      </div>
    )
  }

  return (
    <textarea
      className={`${baseCls} ${wrap ? '' : 'whitespace-pre'}`}
      style={wrap ? { fontFamily: 'inherit' } : undefined}
      value={editedContent}
      onChange={(e) => setEditedContent(e.target.value)}
    />
  )
}
