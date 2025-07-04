// src/components/editor/ImageViewer.tsx
'use client'

import { useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import useApi from '@/hooks/useApi'
import { X } from 'lucide-react'

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] as const

export default function ImageViewer() {
  const { selectedFile, selectedBucket, currentPrefix, openPrefix } = useS3()
  const [src, setSrc] = useState<string | null>(null)

  const api = useApi()

  if (!selectedFile || !selectedBucket) return null
  const ext = selectedFile.name.split('.').pop()?.toLowerCase()
  if (!ext || !IMAGE_EXT.includes(ext as any)) return null

  useEffect(() => {
    const load = async () => {
      const res = await api.GET(
        `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(
          selectedFile.fullKey
        )}&base64=1`
      )
      const b64 = res.data?.base64
      if (!b64) return
      const mime =
        ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`
      setSrc(`data:${mime};base64,${b64}`)
    }
    load()
  }, [selectedBucket, selectedFile, ext])

  const handleClose = () => {
    openPrefix(currentPrefix)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">Image preview</span>
        <button
          onClick={handleClose}
          className="px-1 py-0.5 bg-[#232323] cursor-pointer hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs flex items-center"
          title="Close file"
          aria-label="Close file"
          tabIndex={0}
          type="button"
        >
          <X className="w-3 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden bg-[#1e1e1e] p-4 flex items-center justify-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={selectedFile.name} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-gray-500 text-sm">Loading…</div>
        )}
      </div>
    </div>
  )
}
