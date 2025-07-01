// src/components/inspector/DetailsSection.tsx
'use client'

import { useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import { Clock } from 'lucide-react'

function formatDate(dateString: string, useUTC: boolean) {
  const date = new Date(dateString)
  return useUTC ? date.toISOString() : date.toLocaleString()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function TimeToggle({ useUTC, onToggle }: { useUTC: boolean, onToggle: () => void }) {
  const code = useUTC
    ? 'UTC'
    : new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ').pop() || 'Local'

  return (
    <button
      onClick={onToggle}
      className="ml-2 inline-flex items-center text-xs border border-[#555] px-2 py-[1px] rounded hover:border-[#888]"
    >
      <Clock className="w-3 h-3 mr-1" />
      {code}
    </button>
  )
}

export default function DetailsSection() {
  const { selectedBucket, selectedFile, currentPrefix } = useS3()
  const [meta, setMeta] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [useUTC, setUseUTC] = useState(false)

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

  return (
    <div className="space-y-1 text-sm select-text">
      <div className="text-xs text-xs text-[#7fbc41] font-mono truncate max-w-full flex mb-2 justify-center">
        {selectedFile?.fullKey || currentPrefix || selectedBucket}
      </div>

      {selectedFile && (
        <>
          <div><strong>ETag:</strong> <span>{meta.ETag}</span></div>
          <div><strong>Content-Type:</strong> {meta.ContentType}</div>
          <div><strong>Size:</strong> {formatSize(meta.ContentLength)}</div>
          <div><strong>Storage Class:</strong> {meta.StorageClass || 'STANDARD'}</div>
          <div className="flex items-center">
            <strong className="mr-1">Last Modified:</strong>
            <span>{formatDate(meta.LastModified, useUTC)}</span>
            <TimeToggle useUTC={useUTC} onToggle={() => setUseUTC(!useUTC)} />
          </div>
          
          {meta.Metadata && Object.keys(meta.Metadata).length > 0 && (
            <div>
              <strong>Custom Metadata:</strong>
              <ul className="ml-4 list-disc">
                {Object.entries(meta.Metadata).map(([k, v]) => (
                  <li key={k}><strong>{k}:</strong> {v as String}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!selectedFile && currentPrefix && (
        <>
          <div><strong>Object Count:</strong> {meta.count}</div>
          <div><strong>Total Size:</strong> {formatSize(meta.totalSize)}</div>
          <div className="flex items-center">
            <strong className="mr-1">Last Modified:</strong>
            <span>{formatDate(meta.lastModified, useUTC)}</span>
            <TimeToggle useUTC={useUTC} onToggle={() => setUseUTC(!useUTC)} />
          </div>
        </>
      )}

      {!selectedFile && !currentPrefix && (
        <>
          <div><strong>Bucket:</strong> {selectedBucket}</div>
          <div><strong>Region:</strong> {meta.LocationConstraint || 'us-east-1'}</div>
          <div><strong>Versioning:</strong> {meta.Status || 'Disabled'}</div>
          <div><strong>Object Count:</strong> {meta.count}</div>
          <div className="flex items-center">
            <strong className="mr-1">Last Modified:</strong>
            <span>{formatDate(meta.lastModified, useUTC)}</span>
            <TimeToggle useUTC={useUTC} onToggle={() => setUseUTC(!useUTC)} />
          </div>
        </>
      )}
    </div>
  )
}
