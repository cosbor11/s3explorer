// src/app/page.tsx
'use client'

import { useS3, S3Provider } from '@/contexts/s3'
import { S3ConnectionProvider } from '@/contexts/S3ConnectionContext'
import Sidebar from '@/components/Sidebar'
import BreadcrumbBar from '@/components/BreadcrumbBar'
import ContextMenu from '@/components/ContextMenu'
import EditorPane from '@/components/EditorPane'
import FileTree from '@/components/FileTree'
import ErrorBanner from '@/components/ErrorBanner'
import LoadingOverlay from '@/components/LoadingOverlay'
import InspectorPanel from '@/components/InspectorPanel'

const VSCODE_BG = 'bg-[#1e1e1e]'
const VSCODE_TEXT = 'text-[#d4d4d4]'

function MainArea() {
  const { selectedFile, isNewFile, tree, error } = useS3()

  return (
    <>
      {error && <ErrorBanner msg={error} />}
      <div className="flex-1 flex flex-col min-h-0">
        {!selectedFile && !isNewFile ? (
          <div className="flex-1 overflow-auto">
            {tree && <FileTree />}
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0">
              <EditorPane />
            </div>
            <div className="h-2 z-10 cursor-ns-resize bg-transparent hover:bg-[#555]/60" />
            <div className="overflow-auto border-t border-[#2d2d2d] bg-[#232323]" style={{ height: 200 }}>
              {tree && <FileTree />}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default function Page() {
  return (
    <S3ConnectionProvider>
    <S3Provider>
      <LoadingOverlay />
      <div className={`h-screen flex ${VSCODE_BG} ${VSCODE_TEXT}`}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <BreadcrumbBar />
          <div className="flex flex-1 min-h-0">
            <MainArea />
            <InspectorPanel />
          </div>
        </div>
        <ContextMenu />
      </div>
    </S3Provider>
    </S3ConnectionProvider>
  )
}
