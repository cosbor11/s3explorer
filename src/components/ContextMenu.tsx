// src/components/ContextMenu.tsx
'use client'

import { useRef, useEffect } from 'react'
import { useS3 } from '@/contexts/S3Context'

export default function ContextMenu() {
  const {
    menu,
    closeMenu,
    currentPrefix,
    createBucket,
    createFolder,
    startNewFile,
    deleteBucket,
    deleteFolder,
    deleteFile,
    openFile,
  } = useS3() as any

  const menuRef = useRef<HTMLDivElement>(null)

  /* close on outside click */
  useEffect(() => {
    if (!menu.visible) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [menu.visible, closeMenu])

  if (!menu.visible) return null
  const { type, node, target, x, y } = menu

  /* helper to run an action then hide the menu */
  const run = (fn: () => any) => async () => {
    try {
      await fn()
    } finally {
      closeMenu()
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#222] border border-[#444] rounded shadow px-2 py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {/* ───── Bucket ───── */}
      {type === 'bucket' && target && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(''))}>
            Add Folder
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(''))}>
            Add File
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteBucket(target))}>
            Delete
          </button>
        </>
      )}

      {/* ───── Folder ───── */}
      {type === 'folder' && node && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(node.fullKey))}>
            Add Folder
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(node.fullKey))}>
            Add File
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteFolder(node))}>
            Delete
          </button>
        </>
      )}

      {/* ───── File ───── */}
      {type === 'file' && node && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => openFile(node))}>
            Open
          </button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteFile(node))}>
            Delete
          </button>
        </>
      )}

      {/* ───── Empty Sidebar ───── */}
      {type === 'empty' && (
        <button
          className="w-full text-left px-2 py-1 hover:bg-[#333]"
          onClick={run(() => createBucket())}
        >
          Add Bucket
        </button>
      )}
    </div>
  )
}
