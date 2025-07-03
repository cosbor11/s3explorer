// src/components/FileTreePane.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useS3 } from '@/contexts/s3'
import useApi from '@/hooks/useApi'
import EmptyDropZone from '@/components/EmptyDropZone'
import FolderSearchBar from './FolderSearchBar'

const MIN_W = 160
const CHAR_PX = 8
const PADDING = 32

const BLUE = 'text-[#3794ff]'
const GREEN = 'text-[#4ec9b0]'
const TEXT = 'text-[#d4d4d4]'

interface FileTreePaneProps {
  verticalMode?: boolean
  fillMode?: boolean
}

export default function FileTreePane({ verticalMode, fillMode }: FileTreePaneProps) {
  const {
    selectedBucket,
    tree,
    setTree,
    openPrefix,
    openFile,
    openMenu,
    uploadFiles,
    currentPrefix,
    selectedFile,
    loading,
    error,
    setError,
    search,
    setSearch,
    searchMode,
    setSearchMode,
    refreshCurrent,
    doRemoteSearch,
    lastRemoteSearch,
    setLastRemoteSearch,
  } = useS3()

  const api = useApi()
  const [width, setWidth] = useState(() => {
    if (!tree) return 220
    const longest = Math.max(10, ...(tree ?? []).map(n => n.name.length))
    return Math.max(MIN_W, longest * CHAR_PX + PADDING)
  })

  const [inputValue, setInputValue] = useState(search)
  useEffect(() => {
    setInputValue(search)
  }, [search])

  const containerRef = useRef<HTMLDivElement>(null)

  const [initialLoadDone, setInitialLoadDone] = useState(false)

  useEffect(() => {
    if (!selectedBucket) {
      setTree(null)
      setInitialLoadDone(false)
      return
    }
    if (!tree && !initialLoadDone) {
      const loadTree = async () => {
        const res = await api.GET(
          `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&prefix=${encodeURIComponent(currentPrefix || '')}`
        )
        if (res.ok) {
          const prefixes = (res.data?.CommonPrefixes ?? []).map((p: any) => ({
            name: p.Prefix.replace(/\/$/, '').split('/').pop(),
            fullKey: p.Prefix,
            isDir: true,
          }))
          const objects = (res.data?.Contents ?? [])
            .filter((obj: any) => obj.Key !== '' && !obj.Key.endsWith('/'))
            .map((obj: any) => ({
              name: obj.Key.split('/').pop(),
              fullKey: obj.Key,
              isDir: false,
            }))
          setTree([...prefixes, ...objects])
          setSearchMode(res.data?.IsTruncated ? 'begins' : 'contains')
        }
        setInitialLoadDone(true)
      }
      loadTree()
    }
  }, [selectedBucket, tree, setTree, api, initialLoadDone, currentPrefix, setSearchMode])

  const onDrag = (e: React.MouseEvent) => {
    if (verticalMode || fillMode) return
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const move = (ev: MouseEvent) =>
      setWidth(Math.max(MIN_W, startW + (ev.clientX - startX)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const isActive = (n: { fullKey: string }) => selectedFile?.fullKey === n.fullKey

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length) {
        uploadFiles(currentPrefix, e.dataTransfer.files)
      }
    },
    [uploadFiles, currentPrefix]
  )

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleClearSearch = () => {
    setInputValue('')
    setSearch('')
    setLastRemoteSearch('')
    refreshCurrent()
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearch = () => {
    setSearch(inputValue)
    if (!inputValue.trim()) {
      setLastRemoteSearch('')
      refreshCurrent()
      return
    }
    if (searchMode === 'begins') {
      if (lastRemoteSearch !== `${inputValue}:${searchMode}`) {
        setLastRemoteSearch(`${inputValue}:${searchMode}`)
        doRemoteSearch(inputValue, searchMode)
      }
    }
  }

  const filteredTree =
    !search.trim() || searchMode === 'begins'
      ? tree
      : tree?.filter(n =>
          n.name.toLowerCase().includes(search.trim().toLowerCase())
        )

  const isSearch = !!search.trim()
  const isEmpty = !filteredTree || filteredTree.length === 0
  const isRoot = currentPrefix === '' || currentPrefix === undefined

  if (!selectedBucket) {
    return (
      <div
        className={`relative bg-[#232323] flex items-center justify-center select-none${
          verticalMode ? ' border-t border-[#2d2d2d]' : fillMode ? '' : ' border-r border-[#2d2d2d]'
        }`}
        style={
          verticalMode
            ? { width: '100%', height: '100%', minHeight: 80 }
            : fillMode
              ? { width: '100%', minHeight: 100, height: '100%' }
              : { width, minWidth: MIN_W, minHeight: 100 }
        }
      >
        <span className="text-[#888] text-sm">Select a bucket to browse files</span>
      </div>
    )
  }

  return (
    <div
      className={`relative bg-[#232323] flex flex-col${
        verticalMode ? ' border-t border-[#2d2d2d]' : fillMode ? '' : ' border-r border-[#2d2d2d]'
      }`}
      style={
        verticalMode
          ? { width: '100%', height: '100%', minHeight: 80 }
          : fillMode
            ? { width: '100%', minHeight: 100, height: '100%' }
            : { width, minWidth: MIN_W }
      }
      onContextMenu={(e) => openMenu(e, 'emptyTree')}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <FolderSearchBar
        search={inputValue}
        setSearch={handleInputChange}
        context="files"
        onSearchKeyDown={handleSearchKeyDown}
        onSearchClick={handleSearch}
        onClearClick={handleClearSearch}
      />
      <div className="overflow-auto h-full" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <svg className="animate-spin h-7 w-7 text-[#3794ff]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          </div>
        )}
        {error && (
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-red-700 text-white text-xs z-50 flex items-center justify-between">
            <span>{error}</span>
            <button
              className="ml-4 px-2 py-1 rounded bg-red-800 hover:bg-red-900"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {isEmpty ? (
          isSearch
            ? (
              <div className="flex flex-col items-center justify-center pt-12 pb-8 text-neutral-400 select-none">
                <span className="text-sm">
                  No matches for files that {searchMode === 'begins'
                    ? 'begin with'
                    : 'contain'}&nbsp;
                  <span className="font-mono bg-[#1e1e1e] px-2 py-1 rounded">{search}</span>
                </span>
              </div>
            )
            : <EmptyDropZone
                prefix={currentPrefix}
                onFiles={files => uploadFiles(currentPrefix, files)}
                message={isRoot ? "This bucket is empty." : "This folder is empty."}
                loading={loading}
              />
        ) : (
          <ul className="w-full px-6 py-4">
            {filteredTree!.map((n) => (
              <li key={n.fullKey}>
                <div
                  className={`
                    flex items-center gap-1 px-2 py-0.5 cursor-pointer select-none rounded
                    hover:bg-[#232323] ${isActive(n) ? 'bg-[#333333]' : ''}
                  `}
                  onClick={() => (n.isDir ? openPrefix(n.fullKey) : openFile(n))}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
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
        )}
      </div>
      {!verticalMode && !fillMode && (
        <div
          className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-transparent hover:bg-[#555]/60"
          onMouseDown={onDrag}
        />
      )}
    </div>
  )
}
