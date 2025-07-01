// src/components/inspector/DetailsSection.tsx
'use client'

import { useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'

export default function DetailsSection() {
  const { selectedBucket, selectedFile, currentPrefix } = useS3()
  const [meta, setMeta] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedBucket) return

    const isFolder = !selectedFile && !!currentPrefix

    const url = selectedFile
      ? `/api/meta?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(selectedFile.fullKey)}`
      : isFolder
      ? `/api/folder-meta?bucket=${encodeURIComponent(selectedBucket)}&prefix=${encodeURIComponent(currentPrefix)}`
      : `/api/bucket-meta?bucket=${encodeURIComponent(selectedBucket)}`

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        const json = await res.json()
        if (!json.ok) throw new Error(json.error?.message ?? 'Failed to fetch metadata')
        setMeta(json.data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedBucket, selectedFile, currentPrefix])

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (error) return <div className="text-red-400">{error}</div>
  if (!meta) return <div className="text-gray-500">No metadata available.</div>

  if (selectedFile) {
    return (
      <div className="space-y-1">
        <div><strong>Content-Type:</strong> {meta.ContentType}</div>
        <div><strong>Size:</strong> {meta.ContentLength} bytes</div>
        <div><strong>Last Modified:</strong> {meta.LastModified}</div>
        <div><strong>ETag:</strong> {meta.ETag}</div>
        {meta.Metadata && Object.keys(meta.Metadata).length > 0 && (
          <div>
            <strong>Custom Metadata:</strong>
            <ul className="ml-4 list-disc">
              {Object.entries(meta.Metadata).map(([k, v]) => (
                <li key={k}><strong>{k}:</strong> {v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (!selectedFile && currentPrefix) {
    return (
      <div className="space-y-1">
        <div><strong>Folder:</strong> {currentPrefix}</div>
        <div><strong>Object Count:</strong> {meta.count}</div>
        <div><strong>Total Size:</strong> {meta.totalSize} bytes</div>
        <div><strong>Last Modified:</strong> {meta.lastModified}</div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div><strong>Bucket:</strong> {selectedBucket}</div>
      <div><strong>Region:</strong> {meta.LocationConstraint || 'us-east-1'}</div>
      <div><strong>Versioning:</strong> {meta.Status || 'Disabled'}</div>
      <div><strong>Object Count (est):</strong> {meta.count}</div>
      <div><strong>Last Modified:</strong> {meta.lastModified}</div>
    </div>
  )
}