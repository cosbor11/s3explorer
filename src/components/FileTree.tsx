// src/components/FileTree.tsx
'use client'

import { useCallback } from 'react'
import { useS3, S3Node } from '@/contexts/s3'

const BLUE  = 'text-[#3794ff]'
const GREEN = 'text-[#4ec9b0]'
const TEXT  = 'text-[#d4d4d4]'

export default function FileTree() {
  const {
    tree,
    openPrefix,
    openFile,
    openMenu,
    uploadFiles,
    currentPrefix,
    selectedFile,
  } = useS3()

  if (!tree) return null

  const isActive = (n: S3Node) => selectedFile?.fullKey === n.fullKey

  /* drag-drop upload */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length) {
        uploadFiles(currentPrefix, e.dataTransfer.files)
      }
    },
    [uploadFiles, currentPrefix]
  )

  return (
    <div
      className="w-full h-full overflow-auto px-6 py-4"
      onContextMenu={(e) => openMenu(e, 'emptyTree')}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <ul>
        {tree.map((n) => (
          <li key={n.fullKey}>
            <div
              className={`
                flex items-center gap-1 px-2 py-0.5 cursor-pointer select-none rounded
                hover:bg-[#232323] ${isActive(n) ? 'bg-[#333333]' : ''}
              `}
              onClick={() => (n.isDir ? openPrefix(n.fullKey) : openFile(n))}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation() /* keep sidebar’s menu from firing */
                openMenu(e, n.isDir ? 'folder' : 'file', n)
              }}
            >
              {n.isDir ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className={`${BLUE} mr-1`}
                >
                  <path
                    fill="currentColor"
                    d="M10.828 6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.828a1 1 0 0 0 .707-.293l1.172-1.172a2 2 0 0 1 1.414-.586z"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className={`${GREEN} mr-1`}
                  fill="none"
                >
                  <path
                    d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M14 2v4a2 2 0 0 0 2 2h4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 12h8M8 15h8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span className={n.isDir ? BLUE : TEXT}>
                {n.name}
                {n.isDir ? '/' : ''}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
