// src/app/page.tsx
'use client'

import { useState } from 'react'
import { S3Provider } from '@/contexts/S3Context'
import { useS3 } from '@/contexts/S3Context'
import Sidebar from '@/components/Sidebar'
import BreadcrumbBar from '@/components/BreadcrumbBar'
import ContextMenu from '@/components/ContextMenu'
import EditorPane from '@/components/EditorPane'
import FileTree from '@/components/FileTree'

const VSCODE_BG = 'bg-[#1e1e1e]'
const VSCODE_TEXT = 'text-[#d4d4d4]'

/* ────────────────────────────────────────────────────────────── */
/* Main area: editor on top, resizable file-tree below            */
/* ────────────────────────────────────────────────────────────── */
function MainArea() {
  const { selectedFile, isNewFile, tree } = useS3()

  /* height of the tree pane */
  const MIN_H = 120                 // px
  const [treeH, setTreeH] = useState(200)

  /* drag bar logic */
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = treeH

    const onMove = (ev: MouseEvent) => {
      /* drag-up  → diff > 0 → tree gets taller
         drag-down → diff < 0 → tree gets shorter */
      const diff = startY - ev.clientY
      setTreeH(Math.max(MIN_H, startH + diff))
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  /* ───── layout when no file is open ───── */
  if (!selectedFile && !isNewFile) {
    return (
      <div className="flex-1 overflow-auto">
        {tree && <FileTree />}
      </div>
    )
  }

  /* ───── layout when a file is open ───── */
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* editor (flexes) */}
      <div className="flex-1 min-h-0">
        <EditorPane />
      </div>

      {/* drag handle */}
      <div
        className="h-2 z-10 cursor-ns-resize bg-transparent hover:bg-[#555]/60"
        onMouseDown={startDrag}
      />

      {/* file-tree pane */}
      <div
        className="overflow-auto border-t border-[#2d2d2d] bg-[#232323]"
        style={{ height: treeH }}
      >
        {tree && <FileTree />}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Root page component                                            */
/* ────────────────────────────────────────────────────────────── */
export default function Page() {
  return (
    <S3Provider>
      <div className={`h-screen flex ${VSCODE_BG} ${VSCODE_TEXT}`}>
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <BreadcrumbBar />
          <MainArea />
        </div>

        <ContextMenu />
      </div>
    </S3Provider>
  )
}
