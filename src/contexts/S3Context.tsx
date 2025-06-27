// src/contexts/S3Context.tsx
'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  MouseEvent,
} from 'react'

/* ───────────── types ───────────── */
export interface S3Node {
  name: string
  fullKey: string
  isDir: boolean
}

type MenuType = 'bucket' | 'folder' | 'file' | 'empty'
interface MenuState {
  visible: boolean
  x: number
  y: number
  type: MenuType
  target?: string
  node?: S3Node
}

interface S3ContextState {
  /* data */
  buckets: string[]
  tree: S3Node[] | null
  selectedBucket: string | null
  breadcrumb: string[]
  currentPrefix: string
  selectedFile: S3Node | null
  originalContent: string
  editedContent: string
  isNewFile: boolean
  newFilePrefix: string
  wrap: boolean
  loading: boolean
  error: string | null
  dirty: boolean
  menu: MenuState

  /* actions */
  fetchBuckets(): void
  openPrefix(prefix: string): void
  openFile(n: S3Node): void
  startNewFile(prefix: string): void
  setWrap(v: boolean): void
  setEditedContent(v: string): void
  saveFile(): Promise<void>
  createBucket(): Promise<void>
  deleteBucket(b: string): Promise<void>
  createFolder(prefix: string): Promise<void>
  deleteFolder(n: S3Node): Promise<void>
  deleteFile(n: S3Node): Promise<void>
  selectBucket(b: string | null): void 

  /* context-menu helpers */
  openMenu(e: MouseEvent, type: MenuType, node?: S3Node, target?: string): void
  closeMenu(): void
}

/* ───────────── context ───────────── */
const S3Context = createContext<S3ContextState | null>(null)
export const useS3 = () => {
  const ctx = useContext(S3Context)
  if (!ctx) throw new Error('useS3 must be used inside <S3Provider>')
  return ctx
}

/* ───────────── provider ───────────── */
export const S3Provider = ({ children }: { children: ReactNode }) => {
  /* fundamental state */
  const [buckets, setBuckets] = useState<string[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [tree, setTree] = useState<S3Node[] | null>(null)
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [breadcrumb, setBreadcrumb] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<S3Node | null>(null)

  /* editor */
  const [originalContent, setOriginalContent] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [isNewFile, setIsNewFile] = useState(false)
  const [newFilePrefix, setNewFilePrefix] = useState('')
  const [wrap, setWrap] = useState(false)

  /* ui / status */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* context-menu state */
  const [menu, setMenu] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'empty',
  })

  const dirty = editedContent !== originalContent

  /* ───────────── helpers ───────────── */

  const selectBucket = (b: string | null) => {
    setSelectedBucket(b)
    setBreadcrumb([])
    setCurrentPrefix('')
    setTree(null)
    setSelectedFile(null)
    resetEditor()
  }

  const buildTree = (prefix: string, data: any): S3Node[] => {
    const dirs =
      (data.CommonPrefixes ?? []).map((p: any) => ({
        name: p.Prefix.replace(prefix, '').replace(/\/$/, ''),
        fullKey: p.Prefix,
        isDir: true,
      })) ?? []
    const files =
      (data.Contents ?? [])
        .filter((o: any) => o.Key !== prefix && !o.Key.endsWith('/'))
        .map((o: any) => ({
          name: o.Key.replace(prefix, ''),
          fullKey: o.Key,
          isDir: false,
        })) ?? []
    return [...dirs, ...files]
  }

  const resetEditor = () => {
    setOriginalContent('')
    setEditedContent('')
    setIsNewFile(false)
    setNewFilePrefix('')
  }

  /* ───────────── API operations ───────────── */
  const fetchBuckets = () => {
    setLoading(true)
    fetch('/api/s3')
      .then(r => r.json())
      .then(d => {
        setBuckets(d.Buckets?.map((b: any) => b.Name!) ?? [])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }

  const openPrefix = (prefix: string) => {
    if (!selectedBucket) return
    setLoading(true)
    setError(null)
    setCurrentPrefix(prefix)
    setTree(null)
    setSelectedFile(null)
    resetEditor()
    fetch(
      `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&prefix=${encodeURIComponent(prefix)}`
    )
      .then(r => r.json())
      .then(d => {
        setTree(buildTree(prefix, d))
        setBreadcrumb(prefix ? prefix.replace(/\/$/, '').split('/') : [])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }

  const openFile = (n: S3Node) => {
    if (!selectedBucket) return
    setLoading(true)
    fetch(
      `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(n.fullKey)}`
    )
      .then(r => r.json())
      .then(d => {
        setSelectedFile(n)
        setOriginalContent(d.body ?? '')
        setEditedContent(d.body ?? '')
        setIsNewFile(false)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }

  const startNewFile = (prefix: string) => {
    resetEditor()
    setIsNewFile(true)
    setNewFilePrefix(prefix)
  }

  const saveFile = async () => {
    if (!selectedBucket) return
    if (isNewFile) {
      const name = prompt('File name?')
      if (!name?.trim()) return
      await fetch('/api/s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: selectedBucket,
          folder: `${newFilePrefix}${name.trim()}`,
          body: editedContent,
        }),
      })
    } else if (selectedFile) {
      await fetch('/api/s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: selectedBucket,
          folder: selectedFile.fullKey,
          body: editedContent,
        }),
      })
    }
    resetEditor()
    setSelectedFile(null)
    openPrefix(currentPrefix)
  }

  const createBucket = async () => {
    const name = prompt('Bucket name?')
    if (!name) return
    setLoading(true)
    await fetch('/api/s3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: name }),
    })
    setLoading(false)
    fetchBuckets()
  }

  const deleteBucket = async (b: string) => {
    if (!confirm(`Delete bucket "${b}"?`)) return
    setLoading(true)
    await fetch(`/api/s3?bucket=${encodeURIComponent(b)}`, { method: 'DELETE' })
    setLoading(false)
    fetchBuckets()
    if (b === selectedBucket) setSelectedBucket(null)
  }

  const createFolder = async (prefix: string) => {
    const f = prompt('Folder name?')
    if (!f) return
    setLoading(true)
    await fetch('/api/s3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: selectedBucket,
        folder: `${prefix}${f.endsWith('/') ? f : f + '/'}`,
      }),
    })
    setLoading(false)
    openPrefix(prefix)
  }

  const deleteFolder = async (n: S3Node) => {
    if (!confirm(`Delete folder "${n.name}"?`)) return
    setLoading(true)
    await fetch(
      `/api/s3?bucket=${encodeURIComponent(
        selectedBucket!
      )}&folder=${encodeURIComponent(n.fullKey)}`,
      { method: 'DELETE' }
    )
    setLoading(false)
    openPrefix(currentPrefix)
  }

  const deleteFile = async (n: S3Node) => {
    if (!confirm(`Delete file "${n.name}"?`)) return
    setLoading(true)
    await fetch(
      `/api/s3?bucket=${encodeURIComponent(selectedBucket!)}&key=${encodeURIComponent(
        n.fullKey
      )}`,
      { method: 'DELETE' }
    )
    setLoading(false)
    openPrefix(currentPrefix)
  }

  /* ───────────── context-menu ops ───────────── */
  const openMenu = (
    e: MouseEvent,
    type: MenuType,
    node?: S3Node,
    target?: string
  ) => {
    e.preventDefault()
    setMenu({ visible: true, x: e.clientX, y: e.clientY, type, node, target })
  }
  const closeMenu = () => setMenu(m => ({ ...m, visible: false }))

  /* init buckets once */
  useEffect(fetchBuckets, [])

  useEffect(() => { if (selectedBucket) openPrefix('') }, [selectedBucket])

  /* value object */
  const value: S3ContextState = {
    /* data */
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

    /* actions */
    fetchBuckets,
    openPrefix,
    openFile,
    startNewFile,
    setWrap,
    setEditedContent,
    saveFile,
    createBucket,
    deleteBucket,
    createFolder,
    deleteFolder,
    deleteFile,
    selectBucket,

    /* menu helpers */
    openMenu,
    closeMenu,
  }

  return <S3Context.Provider value={value}>{children}</S3Context.Provider>
}
