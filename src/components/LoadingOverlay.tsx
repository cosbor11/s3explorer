'use client'

import { useS3 } from '@/contexts/s3'

export default function LoadingOverlay() {
  const { loading } = useS3()
  if (!loading) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-[#4ec9b0]" />
    </div>
  )
}
