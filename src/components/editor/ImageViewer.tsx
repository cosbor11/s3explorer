// src/components/editor/ImageViewer.tsx
'use client'

import { useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] as const

export default function ImageViewer() {
  const { selectedFile, selectedBucket } = useS3()
  const [src, setSrc] = useState<string | null>(null)

  if (!selectedFile || !selectedBucket) return null
  const ext = selectedFile.name.split('.').pop()?.toLowerCase()
  if (!ext || !IMAGE_EXT.includes(ext as any)) return null

  useEffect(() => {
    const load = async () => {
      const r = await fetch(
        `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(
          selectedFile.fullKey
        )}&base64=1`
      )
      const j = await r.json()
      const b64 = j.data?.base64 ?? j.base64
      if (!b64) return
      const mime =
        ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`
      setSrc(`data:${mime};base64,${b64}`)
    }
    load()
  }, [selectedBucket, selectedFile, ext])

  return (
    <div className="flex-1 overflow-hidden bg-[#1e1e1e] p-4 flex items-center justify-center">
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt={selectedFile.name} className="max-h-full max-w-full object-contain" />
      ) : (
        <div className="text-gray-500 text-sm">Loading…</div>
      )}
    </div>
  )
}
