'use client'

import { useState, useRef } from 'react'
import { useS3, S3Provider } from '@/contexts/s3'
import { S3ConnectionProvider } from '@/contexts/S3ConnectionContext'
import Sidebar from '@/components/Sidebar'
import BreadcrumbBar from '@/components/BreadcrumbBar'
import ContextMenu from '@/components/ContextMenu'
import EditorPane from '@/components/EditorPane'
import FileTreePane from '@/components/FileTreePane'
import ErrorBanner from '@/components/ErrorBanner'
import LoadingOverlay from '@/components/LoadingOverlay'
import InspectorPanel from '@/components/InspectorPanel'

const VSCODE_BG = 'bg-[#1e1e1e]'
const VSCODE_TEXT = 'text-[#d4d4d4]'

function MainArea() {
  const { selectedFile, isNewFile, error } = useS3()
  const [bottomPaneHeight, setBottomPaneHeight] = useState(200)
  const dragRef = useRef<HTMLDivElement>(null)

  // Drag logic for vertical resizing (drag up to increase height)
  const onVerticalDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = bottomPaneHeight

    const onMove = (ev: MouseEvent) => {
      const newHeight = Math.max(80, startH + (startY - ev.clientY))
      setBottomPaneHeight(newHeight)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <>
      {error && <ErrorBanner msg={error} />}
      <div className="flex-1 flex flex-row min-h-0 min-w-0">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
          <BreadcrumbBar />
          <div className="flex-1 flex flex-row min-h-0">
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {!selectedFile && !isNewFile ? (
                <div className="flex-1 min-h-0">
                  <FileTreePane fillMode />
                </div>
              ) : (
                <div className="flex flex-1 flex-col min-h-0">
                  <div className="flex-1 min-h-0">
                    <EditorPane />
                  </div>
                  <div
                    ref={dragRef}
                    className="h-2 z-10 cursor-ns-resize bg-transparent hover:bg-[#555]/60"
                    onMouseDown={onVerticalDrag}
                    style={{ minHeight: 6 }}
                  />
                  <div
                    style={{ height: bottomPaneHeight, minHeight: 80 }}
                    className="overflow-auto border-t border-[#2d2d2d] bg-[#232323]"
                  >
                    <FileTreePane verticalMode />
                  </div>
                </div>
              )}
            </div>
            <InspectorPanel className="w-64 flex-none" />
          </div>
        </div>
        <ContextMenu />
      </div>
    </>
  )
}

export default function Page() {
  return (
    <S3ConnectionProvider>
      <S3Provider>
        <LoadingOverlay />
        <div className={`h-screen flex flex-col ${VSCODE_BG} ${VSCODE_TEXT}`}>
          <MainArea />
        </div>
      </S3Provider>
    </S3ConnectionProvider>
  )
}
