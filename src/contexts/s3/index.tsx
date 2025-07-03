// src/contexts/s3/index.tsx
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  MouseEvent,
} from 'react'
import { buildTree, downloadBlob } from './api'
import { resetEditor } from './editor'
import * as menuHelpers from './menu'
import type {
  S3Node,
  MenuState,
  MenuType,
  S3ContextState,
  SearchMode,
} from './types'
import { Buffer } from 'buffer'
import useApi from '@/hooks/useApi'

const BINARY_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'pdf']
const isBinary = (name: string) =>
  BINARY_EXT.includes(name.split('.').pop()?.toLowerCase() ?? '')

const S3Context = createContext<S3ContextState | null>(null)
export const useS3 = () => {
  const ctx = useContext(S3Context)
  if (!ctx) throw new Error('useS3 must be used inside <S3Provider>')
  return ctx
}

export const S3Provider = ({ children }: { children: ReactNode }) => {
  const api = useApi()

  const [buckets, setBuckets] = useState<string[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [tree, setTree] = useState<S3Node[] | null>(null)
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [breadcrumb, setBreadcrumb] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<S3Node | null>(null)

  const [originalContent, setOriginalContent] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [isNewFile, setIsNewFile] = useState(false)
  const [newFilePrefix, setNewFilePrefix] = useState('')
  const [wrap, setWrap] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [menu, setMenu] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'emptySidebar',
  })

  // Paging state
  const [pageSize, setPageSize] = useState<number>(100)
  const [continuationToken, setContinuationToken] = useState<string | null>(null)
  const [nextContinuationToken, setNextContinuationToken] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [prevTokens, setPrevTokens] = useState<string[]>([])

  // Search state
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('begins')
  const [allLoaded, setAllLoaded] = useState(true)
  const [lastRemoteSearch, setLastRemoteSearch] = useState('')

  const dirty = editedContent !== originalContent
  const _resetEditor = () =>
    resetEditor({
      setOriginalContent,
      setEditedContent,
      setIsNewFile,
      setNewFilePrefix,
    })
  const confirmDiscard = () =>
    !dirty || confirm('You have unsaved changes. Discard them and continue?')

  const fetchBuckets = () => {
    setLoading(true)
    api.GET('/api/s3')
      .then((d) => {
        setBuckets(d.data?.Buckets?.map((b: any) => b.Name!) ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const createBucket = async () => {
    const name = prompt('Bucket name?')
    if (!name) return
    try {
      setLoading(true)
      await api.POST('/api/s3', {
        headers: { 'Content-Type': 'application/json' },
        body: { bucket: name },
      })
      fetchBuckets()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteBucket = async (b: string) => {
    if (!confirm(`Delete bucket "${b}"?`)) return
    try {
      setLoading(true)
      await api.DELETE(`/api/s3?bucket=${encodeURIComponent(b)}`)
      fetchBuckets()
      if (b === selectedBucket) setSelectedBucket(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectBucket = (b: string | null) => {
    if (!confirmDiscard()) return
    setSelectedBucket(b)
    setBreadcrumb([])
    setCurrentPrefix('')
    setTree(null)
    setSelectedFile(null)
    _resetEditor()
    setContinuationToken(null)
    setCurrentPage(1)
    setPrevTokens([])
    setSearch('')
    setLastRemoteSearch('')
    setAllLoaded(true)
  }

  // Paging-aware openPrefix
  const openPrefix = (
    prefix: string,
    contToken: string | null = null,
    customPageSize: number | null = null,
    replacePrevStack: boolean = false
  ) => {
    if (!selectedBucket) return
    if (!confirmDiscard()) return

    setLoading(true)
    setError(null)
    setCurrentPrefix(prefix)

    const params = new URLSearchParams()
    params.append('bucket', selectedBucket)
    params.append('prefix', prefix)
    params.append('maxKeys', String(customPageSize ?? pageSize))
    if (contToken) params.append('continuationToken', contToken)

    api.GET(`/api/s3?${params.toString()}`)
      .then((d) => {
        setTree(buildTree(prefix, d.data))
        setBreadcrumb(prefix ? prefix.replace(/\/$/, '').split('/') : [])
        setSelectedFile(null)
        _resetEditor()

        setContinuationToken(contToken ?? null)
        setNextContinuationToken(d.data?.NextContinuationToken ?? null)
        setHasMore(Boolean(d.data?.IsTruncated))
        setAllLoaded(!d.data?.IsTruncated)

        if (contToken && !replacePrevStack) {
          setPrevTokens((prev) => [...prev, contToken])
        } else if (replacePrevStack) {
          setPrevTokens([])
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  // Paging controls
  const nextPage = () => {
    if (!hasMore || !nextContinuationToken) return
    setCurrentPage((p) => p + 1)
    openPrefix(currentPrefix, nextContinuationToken)
  }

  const prevPage = () => {
    if (currentPage <= 1) return
    setCurrentPage((p) => Math.max(1, p - 1))
    setPrevTokens((prev) => {
      const next = [...prev]
      next.pop()
      return next
    })
    const prevToken = prevTokens.length > 1 ? prevTokens[prevTokens.length - 2] : null
    openPrefix(currentPrefix, prevToken, null, prevToken == null)
  }

  const setPageSizeAndReload = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    setContinuationToken(null)
    setPrevTokens([])
    openPrefix(currentPrefix, null, size, true)
  }

  // ---- SEARCH LOGIC ----
  const doRemoteSearch = async (query: string, mode: SearchMode) => {
    if (!selectedBucket) return
    setLoading(true)
    setError(null)
    try {
      // Only name searches are supported remotely
      const params = new URLSearchParams()
      params.append('bucket', selectedBucket)
      params.append('prefix', currentPrefix)
      params.append('search', query)
      params.append('searchMode', mode)
      params.append('maxKeys', String(pageSize))
      // Note: continuationToken for paged remote search not implemented

      const d = await api.GET(`/api/s3?${params.toString()}`)
      setTree(buildTree(currentPrefix, d.data))
      setAllLoaded(!d.data?.IsTruncated)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const openFile = (n: S3Node) => {
    if (!selectedBucket) return
    if (!confirmDiscard()) return

    setLoading(true)
    api.GET(
      `/api/s3?bucket=${encodeURIComponent(
        selectedBucket
      )}&key=${encodeURIComponent(n.fullKey)}`
    )
      .then((d) => {
        setSelectedFile(n)
        setOriginalContent(d.data?.body ?? '')
        setEditedContent(d.data?.body ?? '')
        setIsNewFile(false)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const startNewFile = (prefix: string) => {
    if (!confirmDiscard()) return
    _resetEditor()
    setIsNewFile(true)
    setNewFilePrefix(prefix)
  }

  const saveFile = async (): Promise<boolean> => {
    if (!selectedBucket) return false
    try {
      setLoading(true)
      if (isNewFile) {
        const name = prompt('File name?')
        if (!name?.trim()) return false
        await api.POST('/api/s3', {
          headers: { 'Content-Type': 'application/json' },
          body: {
            bucket: selectedBucket,
            folder: `${newFilePrefix}${name.trim()}`,
            body: editedContent,
          },
        })
        setIsNewFile(false)
        setSelectedFile({
          name,
          fullKey: `${newFilePrefix}${name}`,
          isDir: false,
        })
      } else if (selectedFile) {
        await api.POST('/api/s3', {
          headers: { 'Content-Type': 'application/json' },
          body: {
            bucket: selectedBucket,
            folder: selectedFile.fullKey,
            body: editedContent,
          },
        })
      }
      setOriginalContent(editedContent)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async (prefix: string) => {
    const f = prompt('Folder name?')
    if (!f) return
    try {
      setLoading(true)
      await api.POST('/api/s3', {
        headers: { 'Content-Type': 'application/json' },
        body: {
          bucket: selectedBucket,
          folder: `${prefix}${f.endsWith('/') ? f : f + '/'}`,
        },
      })
      openPrefix(prefix)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const renameNode = async (node: S3Node, newName: string) => {
    if (!selectedBucket) return
    const targetKey = node.isDir
      ? `${currentPrefix}${newName}/`
      : `${currentPrefix}${newName}`

    try {
      setLoading(true)

      let payload: string | undefined
      let isBase64 = false

      if (!node.isDir) {
        if (isBinary(node.name)) {
          const resp = await api.GET(
            `/api/s3?bucket=${encodeURIComponent(
              selectedBucket
            )}&key=${encodeURIComponent(node.fullKey)}&base64=1`
          )
          const base64 = resp.data?.base64
          payload = base64
          isBase64 = true
        } else {
          const resp = await api.GET(
            `/api/s3?bucket=${encodeURIComponent(
              selectedBucket
            )}&key=${encodeURIComponent(node.fullKey)}`
          )
          const body = resp.data?.body
          payload = body
        }
      }

      await api.POST('/api/s3', {
        headers: { 'Content-Type': 'application/json' },
        body: {
          bucket: selectedBucket,
          folder: targetKey,
          body: payload ?? '',
          isBase64,
        },
      })

      await api.DELETE(
        `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&${
          node.isDir ? 'folder' : 'key'
        }=${encodeURIComponent(node.fullKey)}`
      )

      refreshCurrent()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteFolder = async (n: S3Node) => {
    if (!confirm(`Delete folder "${n.name}"?`)) return
    try {
      setLoading(true)
      await api.DELETE(
        `/api/s3?bucket=${encodeURIComponent(
          selectedBucket!
        )}&folder=${encodeURIComponent(n.fullKey)}`
      )
      openPrefix(currentPrefix)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (n: S3Node) => {
    if (!confirm(`Delete file "${n.name}"?`)) return
    try {
      setLoading(true)
      await api.DELETE(
        `/api/s3?bucket=${encodeURIComponent(
          selectedBucket!
        )}&key=${encodeURIComponent(n.fullKey)}`
      )
      openPrefix(currentPrefix)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadFiles = async (prefix: string, files: FileList) => {
    if (!selectedBucket || !files.length) return

    const MAX_JSON_BYTES =
      Number(process.env.NEXT_PUBLIC_UPLOAD_LIMIT_MB ?? 25) * 1024 * 1024

    const oversize = Array.from(files).find(f => f.size > MAX_JSON_BYTES)
    if (oversize) {
      setError(
        `"${oversize.name}" is ${(
          oversize.size / 1024 / 1024
        ).toFixed(1)} MB — exceeds the ${MAX_JSON_BYTES / 1024 / 1024} MB inline upload limit`
      )
      return
    }

    setLoading(true)
    try {
      for (const f of Array.from(files)) {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
        const isBinary = !['txt', 'csv', 'tsv', 'md', 'json'].includes(ext)

        const body = isBinary
          ? Buffer.from(await f.arrayBuffer()).toString('base64')
          : await f.text()

        await api.POST('/api/s3', {
          headers: { 'Content-Type': 'application/json' },
          body: {
            bucket: selectedBucket,
            folder: `${prefix}${f.name}`,
            body,
            isBase64: isBinary,
          },
        })
      }
      refreshCurrent()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadNode = async (node: S3Node) => {
    if (!selectedBucket || node.isDir) return
    try {
      setLoading(true)
      const resp = await api.GET(
        `/api/s3?bucket=${encodeURIComponent(
          selectedBucket
        )}&key=${encodeURIComponent(node.fullKey)}`
      )
      const body = resp.data?.body
      downloadBlob(node.name, new Blob([body]))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshCurrent = () => {
    openPrefix(currentPrefix, continuationToken)
  }

  const openMenu = (
    e: MouseEvent,
    type: MenuType,
    node?: S3Node,
    target?: string
  ) => menuHelpers.openMenu(setMenu, e, type, node, target)
  const closeMenu = () => menuHelpers.closeMenu(setMenu)

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  useEffect(() => {
    if (selectedBucket) openPrefix('')
  }, [selectedBucket])
  useEffect(fetchBuckets, [])

  const value: S3ContextState = {
    buckets,
    tree,
    selectedBucket,
    breadcrumb,
    currentPrefix,
    selectedFile,
    originalContent,
    editedContent,
    isNewFile,
    newFilePrefix,
    wrap,
    loading,
    error,
    dirty,
    menu,
    pageSize,
    setPageSize: setPageSizeAndReload,
    continuationToken,
    hasMore,
    currentPage,
    fetchBuckets,
    openPrefix,
    openFile,
    startNewFile,
    setWrap,
    setEditedContent,
    saveFile,
    refreshCurrent,
    uploadFiles,
    downloadNode,
    renameNode,
    deleteFolder,
    deleteFile,
    setTree,
    createBucket,
    deleteBucket,
    createFolder,
    selectBucket,
    setError,
    openMenu,
    closeMenu,
    nextPage,
    prevPage,
    // Search state
    search,
    setSearch,
    searchMode,
    setSearchMode,
    allLoaded,
    lastRemoteSearch,
    setLastRemoteSearch,
    doRemoteSearch,
  }

  return <S3Context.Provider value={value}>{children}</S3Context.Provider>
}
