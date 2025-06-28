'use client'

import { useRef, useEffect } from 'react'
import { useS3 } from '@/contexts/s3'

export default function ContextMenu() {
  const {
    menu,
    closeMenu,
    currentPrefix,
    selectedBucket,
    createBucket,
    createFolder,
    startNewFile,
    deleteBucket,
    deleteFolder,
    deleteFile,
    openFile,
  } = useS3() as any

  const menuRef = useRef<HTMLDivElement>(null)

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

  const run = (fn: () => any) => async () => {
    try { await fn() } finally { closeMenu() }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#222] border border-[#444] rounded shadow px-2 py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {type === 'bucket' && target && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(''))}>Add Folder</button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(''))}>Add File</button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteBucket(target))}>Delete</button>
        </>
      )}

      {type === 'folder' && node && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(node.fullKey))}>Add Folder</button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(node.fullKey))}>Add File</button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteFolder(node))}>Delete</button>
        </>
      )}

      {type === 'file' && node && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => openFile(node))}>Open</button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333] text-red-400" onClick={run(() => deleteFile(node))}>Delete</button>
        </>
      )}

      {type === 'emptySidebar' && (
        <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(createBucket)}>Add Bucket</button>
      )}

      {type === 'emptyTree' && selectedBucket && (
        <>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => createFolder(currentPrefix))}>Add Folder</button>
          <button className="w-full text-left px-2 py-1 hover:bg-[#333]" onClick={run(() => startNewFile(currentPrefix))}>Add File</button>
        </>
      )}
    </div>
  )
}
