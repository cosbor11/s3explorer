// src/components/FileTree.tsx
'use client'

import { useS3, S3Node } from '@/contexts/S3Context'

const VSCODE_BLUE  = 'text-[#3794ff]'
const VSCODE_GREEN = 'text-[#4ec9b0]'
const VSCODE_TEXT  = 'text-[#d4d4d4]'

export default function FileTree() {
  const { tree, openPrefix, openFile, openMenu } = useS3()

  if (!tree) return null

  /* single row */
  const Node = (n: S3Node) => (
    <li key={n.fullKey}>
      <div
        className="flex items-center gap-1 px-2 py-0.5 cursor-pointer select-none rounded hover:bg-[#232323]"
        onClick={() => (n.isDir ? openPrefix(n.fullKey) : openFile(n))}
        onContextMenu={e => {
          e.preventDefault()
          e.stopPropagation()
          openMenu(e, n.isDir ? 'folder' : 'file', n)
        }}
      >
        {/* folder vs new file icon */}
        {n.isDir ? (
          <svg width="16" height="16" viewBox="0 0 24 24" className={`${VSCODE_BLUE} mr-1`}>
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
            className={`${VSCODE_GREEN} mr-1`}
            fill="none"
          >
            {/* page outline with folded corner */}
            <path
              d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Z"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
            />
            <path
              d="M14 2v4a2 2 0 0 0 2 2h4"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
            />
            {/* text lines */}
            <path
              d="M8 12h8M8 15h8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        )}

        <span className={n.isDir ? VSCODE_BLUE : VSCODE_TEXT}>
          {n.name}
          {n.isDir ? '/' : ''}
        </span>
      </div>
    </li>
  )

  return (
    <div
      className="w-full h-full overflow-auto px-6 py-4"
      onContextMenu={e => openMenu(e, 'empty')}
    >
      <ul>{tree.map(Node)}</ul>
    </div>
  )
}
