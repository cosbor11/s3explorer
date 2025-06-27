// src/components/BreadcrumbBar.tsx
'use client'

import { useS3 } from '@/contexts/S3Context'

const VSCODE_BORDER = 'border-[#2d2d2d]'
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
  } = useS3()

  const linkCls =
    'text-[#3794ff] cursor-pointer hover:underline hover:text-[#75b5ff] transition-colors'

  const viewingFile = isNewFile || selectedFile

  return (
    <div
      className={`h-12 border-b ${VSCODE_BORDER} px-6 flex items-center justify-between bg-[#232323] text-sm`}
    >
      {/* breadcrumb path */}
      <div className="flex items-center flex-wrap">
        <button
          className={`${linkCls} font-semibold`}
          onClick={() => selectBucket(null)}
        >
          s3://
        </button>

        {selectedBucket && (
          <>
            <button
              className={`${linkCls} font-semibold ml-0.5`}
              onClick={() => {
                selectBucket(selectedBucket)
                openPrefix('')
              }}
            >
              {selectedBucket}
            </button>
          </>
        )}

        {breadcrumb.map((seg, i) => (
          <span key={i} className="flex items-center">
            <Slash />
            <button
              className={linkCls}
              onClick={() =>
                openPrefix(breadcrumb.slice(0, i + 1).join('/') + '/')
              }
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
      {viewingFile && (
        <div className="flex items-center gap-3">
          <button
            className={`px-3 py-1 rounded border border-[#333] transition-colors ${
              dirty
                ? 'bg-[#313131] text-white hover:bg-[#3d3d3d]'
                : 'bg-[#232323] text-[#777] cursor-not-allowed'
            }`}
            disabled={!dirty}
            onClick={saveFile}
          >
            Save
          </button>

          <button
            className="px-3 py-1 rounded border border-[#333] bg-[#232323] hover:bg-[#333] text-[#d4d4d4] transition-colors"
            onClick={() => setWrap(!wrap)}
            title="Toggle word-wrap"
          >
            Wrap: {wrap ? 'On' : 'Off'}
          </button>
        </div>
      )}
    </div>
  )
}
