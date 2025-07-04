// src/components/editor/PDFPreview.tsx
'use client'

import { useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import useApi from '@/hooks/useApi'
import { X } from 'lucide-react'

interface Props { onEdit?: () => void }

export default function PDFPreview({ onEdit }: Props) {
  const { selectedFile, selectedBucket, currentPrefix, openPrefix } = useS3()
  const api = useApi()

  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string>('')

  // guard
  if (!selectedFile || !selectedBucket) return null
  const ext = selectedFile.name.split('.').pop()?.toLowerCase()
  if (ext !== 'pdf') return null

  // fetch PDF once as Blob → Object URL, always revoke old url on cleanup
  useEffect(() => {
    let objectUrl: string | null = null;
    (async () => {
      try {
        setErr('')
        setUrl(null)
        const res = await api.GET(
          `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(
            selectedFile.fullKey,
          )}&base64=1`,
        )
        const b64 = res.data?.base64
        if (!b64) throw new Error()
        const blob = new Blob(
          [Uint8Array.from(atob(b64), c => c.charCodeAt(0))],
          { type: 'application/pdf' },
        )
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch {
        setErr('Failed to load PDF file.')
      }
    })()
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedBucket, selectedFile])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* toolbar */}
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">PDF preview</span>
        <div className="flex gap-1">
          <button
            onClick={() => openPrefix(currentPrefix)}
            className="px-1 py-0.5 bg-[#232323] border border-[#3a3a3a] rounded text-gray-200 cursor-pointer hover:bg-[#2e2e2e] focus:outline-none focus:ring-2"
            aria-label="Close file"
            tabIndex={0}
          >
            <X className="w-3 h-4" />
          </button>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e] flex items-center justify-center">
        {err && <p className="text-red-400 text-sm p-4">{err}</p>}
        {!err && !url && <p className="text-gray-500 text-sm p-4">Loading…</p>}
        {url && (
          <iframe
            src={url}
            title={selectedFile.name}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  )
}
