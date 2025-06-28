// src/components/editor/CsvViewer.tsx
'use client'

import { useS3 } from '@/contexts/s3'

interface Props {
  onEdit(): void
}

export default function CsvViewer({ onEdit }: Props) {
  const { editedContent, selectedFile } = useS3()
  if (!selectedFile) return null

  const ext = selectedFile.name.split('.').pop()?.toLowerCase()
  if (!ext || !['csv', 'tsv'].includes(ext)) return null

  const rows = editedContent.split('\n').map(r =>
    (ext === 'tsv' ? r.split('\t') : r.split(',')),
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">CSV preview · {rows.length} rows</span>
        <button
          onClick={onEdit}
          className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
        >
          Edit raw
        </button>
      </div>

      {/* 👇  min-h-0 keeps this wrapper shrinkable & scrollable */}
      <div className="flex-1 min-h-0 overflow-auto bg-[#1e1e1e]">
        <div className="min-w-max p-2">
          <table className="text-xs text-[#d4d4d4] border-collapse">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-1 whitespace-pre">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
