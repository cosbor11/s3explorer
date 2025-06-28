// src/components/ContextMenu.tsx
'use client'

import { useRef, useEffect } from 'react'
import { useS3 } from '@/contexts/s3'
import type { S3Node } from '@/contexts/s3/types'

export default function ContextMenu() {
  const {
    /* menu state */
    menu,
    closeMenu,

    /* bucket / folder / file actions */
    createBucket,
    createFolder,
    startNewFile,
    deleteBucket,
    deleteFolder,
    deleteFile,
    downloadNode,
    renameNode,
    uploadFiles,

    /* misc */
    currentPrefix,
  } = useS3()

  const menuRef = useRef<HTMLDivElement>(null)

  /* close on outside click */
  useEffect(() => {
    if (!menu.visible) return
    const h = (e: MouseEvent) =>
      menuRef.current && !menuRef.current.contains(e.target as Node) && closeMenu()
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [menu.visible, closeMenu])

  if (!menu.visible) return null
  const { type, node, target, x, y } = menu

  /* helper to run action then auto-close */
  const run = (fn: () => any) => async () => {
    try {
      await fn()
    } finally {
      closeMenu()
    }
  }

  const askRename = (n: S3Node) => {
    const nn = prompt('New name:', n.name)
    if (nn && nn.trim() && nn !== n.name) renameNode(n, nn.trim())
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#222] border border-[#444] rounded shadow px-2 py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {/* ───────── Bucket ───────── */}
      {type === 'bucket' && target && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(''))}>
            Add Folder
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(''))}>
            Add File
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteBucket(target))}>
            Delete Bucket
          </button>
        </>
      )}

      {/* ───────── Folder ───────── */}
      {type === 'folder' && node && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(node.fullKey))}>
            Add Sub-folder
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(node.fullKey))}>
            Add File
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => askRename(node))}>
            Rename
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteFolder(node))}>
            Delete
          </button>
        </>
      )}

      {/* ───────── File ───────── */}
      {type === 'file' && node && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => downloadNode(node))}>
            Download
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => askRename(node))}>
            Rename
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteFile(node))}>
            Delete
          </button>
        </>
      )}

      {/* ──────── Empty tree area ──────── */}
      {type === 'emptyTree' && (
        <>
          <button
            className="w-full text-left px-2 py-1 hover:bg-[#333]"
            onClick={() => (document.getElementById('file-upload') as HTMLInputElement).click()}
          >
            Upload File(s)
          </button>
          <input
            id="file-upload"
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) uploadFiles(currentPrefix, e.target.files)
              closeMenu()
            }}
          />
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(currentPrefix))}>
            Add Folder
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(currentPrefix))}>
            Add File
          </button>
        </>
      )}

      {/* ──────── Empty sidebar area ──────── */}
      {type === 'emptySidebar' && (
        <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(createBucket)}>
          Create Bucket
        </button>
      )}
    </div>
  )
}
