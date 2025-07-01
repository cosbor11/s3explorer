// src/components/BreadcrumbBar.tsx
'use client'

import Tooltip from '@/components/Tooltip'
import { useS3 } from '@/contexts/s3'
import S3ConnectionDropdown from './S3ConnectionDropdown'

const VSCODE_BORDER = 'border-[#2d2d2d]'
const linkCls =
  'text-[#3794ff] cursor-pointer hover:underline hover:text-[#75b5ff] transition-colors'
const Slash = () => <span className="mx-[2px] select-none text-[#555]">/</span>

export default function BreadcrumbBar() {
  const {
    selectedBucket,
    breadcrumb,
    openPrefix,
    isNewFile,
    selectedFile,
    dirty,
    wrap,
    setWrap,
    saveFile,
    selectBucket,
    refreshCurrent,
  } = useS3()

  const viewingFile = isNewFile || selectedFile

  const onRefresh = () => {
    if (dirty && viewingFile) {
      const discard = confirm(
        'This file has unsaved changes. Discard changes and reload?'
      )
      if (!discard) return
    }
    refreshCurrent()
  }

  return (
    <div
      className={`h-12 border-b ${VSCODE_BORDER} px-6 flex items-center justify-between bg-[#232323] text-sm`}
    >
      {/* path */}
      <div className="flex items-center flex-wrap">
        <button className={`${linkCls} font-semibold`} onClick={() => selectBucket(null)}>
          s3://
        </button>

        {selectedBucket && (
          <button
            className={`${linkCls} font-semibold ml-0.5`}
            onClick={() => {
              selectBucket(selectedBucket)
              openPrefix('')
            }}
          >
            {selectedBucket}
          </button>
        )}

        {breadcrumb.map((seg, i) => (
          <span key={i} className="flex items-center">
            <Slash />
            <button
              className={linkCls}
              onClick={() => openPrefix(breadcrumb.slice(0, i + 1).join('/') + '/')}
            >
              {seg}
            </button>
          </span>
        ))}

        {viewingFile && (
          <>
            <Slash />
            <span className="font-semibold">
              {isNewFile ? '(new file)' : selectedFile?.name}
            </span>
          </>
        )}
      </div>

      {/* right-side actions */}
      <div className="flex items-center gap-3">
        {/* refresh */}
        <Tooltip label="Refresh">
          <button
            onClick={onRefresh}
            className="px-2 py-1 rounded border border-[#333] bg-[#232323] hover:bg-[#333] transition-colors flex items-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v6h6" stroke="#4ec9b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 20v-6h-6" stroke="#4ec9b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 9a8 8 0 0 0-15-3M4 15a8 8 0 0 0 15 3"
                stroke="#4ec9b0" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </Tooltip>

        {/* s3 connection dropdown */}
        <S3ConnectionDropdown />
      </div>
    </div>
  )
}
