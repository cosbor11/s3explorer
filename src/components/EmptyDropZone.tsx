// src/components/EmptyDropZone.tsx
'use client'

import { useRef, useState } from 'react'

interface EmptyDropZoneProps {
  prefix: string
  onFiles: (files: FileList) => void
  message: string
  loading?: boolean
  className?: string
}

export default function EmptyDropZone({
  prefix,
  onFiles,
  message,
  loading,
  className = '',
}: EmptyDropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      onFiles(e.dataTransfer.files)
    }
  }

  return (
    <div
      className={`
        flex flex-col items-center justify-center h-full w-full select-none transition-colors
        ${dragOver ? 'bg-[#283a48]/80 border-[#3794ff]/80' : 'bg-[#1e1e1e]/70'}
        ${className}
      `}
      style={{
        border: '2.5px dashed #3794ff55',
        opacity: dragOver ? 1 : 0.94,
        borderRadius: 18,
        transition: 'background 0.15s, border-color 0.15s',
        cursor: loading ? 'not-allowed' : 'pointer',
        minHeight: 180,
      }}
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={e => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      tabIndex={0}
      role="button"
      aria-label="Upload files"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={e => {
          if (e.target.files) onFiles(e.target.files)
        }}
      />
      <svg
        width="48"
        height="48"
        viewBox="0 0 32 32"
        fill="none"
        className="mb-2 opacity-70"
        style={{ filter: dragOver ? 'drop-shadow(0 0 6px #3794ff99)' : undefined }}
      >
        <rect width="32" height="32" rx="16" fill="#222C" />
        <path
          d="M16 8v12m0 0l-5-5m5 5l5-5M8 22h16"
          stroke="#3794ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="text-[#b5c6d3] text-base font-medium mb-1">{message}</div>
      <button
        type="button"
        tabIndex={-1}
        className={`mt-2 px-4 py-1.5 rounded bg-[#222e] border border-[#3794ff] text-[#3794ff] font-semibold text-sm shadow hover:bg-[#222] hover:border-[#75b5ff] transition-all
          ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={e => {
          e.stopPropagation()
          if (!loading) inputRef.current?.click()
        }}
        disabled={loading}
        style={{ pointerEvents: loading ? 'none' : 'auto' }}
      >
        {loading ? "Uploading..." : "Upload File(s)"}
      </button>
      <div className="text-xs text-[#3774ffbb] mt-3 font-mono">or drag &amp; drop files here</div>
    </div>
  )
}
