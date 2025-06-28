'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  MouseEvent,
} from 'react'
import { api, buildTree } from './api'
import { resetEditor } from './editor'
import * as menuHelpers from './menu'
import type {
  S3Node,
  MenuType,
  MenuState,
  S3ContextState,
} from './types'

const S3Context = createContext<S3ContextState | null>(null)
export const useS3 = () => {
  const ctx = useContext(S3Context)
  if (!ctx) throw new Error('useS3 must be used inside <S3Provider>')
  return ctx
}

export const S3Provider = ({ children }: { children: ReactNode }) => {
  /* ---------------- core state ---------------- */
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

  /* ui */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* menu */
  const [menu, setMenu] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'emptySidebar',
  })

  const dirty = editedContent !== originalContent

  const _resetEditor = () =>
    resetEditor({
      setOriginalContent,
      setEditedContent,
      setIsNewFile,
      setNewFilePrefix,
    })

  /* ---------------- helpers ---------------- */
  const confirmDiscard = () =>
    !dirty ||
    confirm('You have unsaved changes. Discard them and continue?')

  /* ---------------- API ops ---------------- */
  const fetchBuckets = () => {
    setLoading(true)
    api<any>('/api/s3')
      .then(bs => setBuckets(bs.Buckets?.map((b: any) => b.Name!) ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  const openPrefix = (prefix: string) => {
    if (!selectedBucket) return
    if (!confirmDiscard()) return

    setLoading(true)
    setError(null)
    setCurrentPrefix(prefix)

    api<any>(
      `/api/s3?bucket=${encodeURIComponent(
        selectedBucket
      )}&prefix=${encodeURIComponent(prefix)}`
    )
      .then(d => {
        setTree(buildTree(prefix, d))
        setBreadcrumb(prefix ? prefix.replace(/\/$/, '').split('/') : [])
        setSelectedFile(null)
        _resetEditor()
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  const openFile = (n: S3Node) => {
    if (!selectedBucket) return
    if (!confirmDiscard()) return

    setLoading(true)
    api<{ body: string }>(
      `/api/s3?bucket=${encodeURIComponent(
        selectedBucket
      )}&key=${encodeURIComponent(n.fullKey)}`
    )
      .then(d => {
        setSelectedFile(n)
        setOriginalContent(d.body ?? '')
        setEditedContent(d.body ?? '')
        setIsNewFile(false)
      })
      .catch(e => setError(e.message))
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
        await api('/api/s3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucket: selectedBucket,
            folder: `${newFilePrefix}${name.trim()}`,
            body: editedContent,
          }),
        })
        setIsNewFile(false)
        setSelectedFile({
          name,
          fullKey: `${newFilePrefix}${name}`,
          isDir: false,
        })
      } else if (selectedFile) {
        await api('/api/s3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucket: selectedBucket,
            folder: selectedFile.fullKey,
            body: editedContent,
          }),
        })
      }
      setOriginalContent(editedContent) // mark clean
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  /* ----- refresh current view (file or folder) ----- */
  const refreshCurrent = () => {
    if (selectedFile) openFile(selectedFile)
    else openPrefix(currentPrefix)
  }

  const createBucket = async () => {
    const name = prompt('Bucket name?')
    if (!name) return
    try {
      setLoading(true)
      await api('/api/s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: name }),
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
      await api(`/api/s3?bucket=${encodeURIComponent(b)}`, { method: 'DELETE' })
      fetchBuckets()
      if (b === selectedBucket) setSelectedBucket(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async (prefix: string) => {
    const f = prompt('Folder name?')
    if (!f) return
    try {
      setLoading(true)
      await api('/api/s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: selectedBucket,
          folder: `${prefix}${f.endsWith('/') ? f : f + '/'}`,
        }),
      })
      openPrefix(prefix)
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
      await api(
        `/api/s3?bucket=${encodeURIComponent(
          selectedBucket!
        )}&folder=${encodeURIComponent(n.fullKey)}`,
        { method: 'DELETE' }
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
      await api(
        `/api/s3?bucket=${encodeURIComponent(
          selectedBucket!
        )}&key=${encodeURIComponent(n.fullKey)}`,
        { method: 'DELETE' }
      )
      openPrefix(currentPrefix)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- menu helpers ---------------- */
  const openMenu = (
    e: MouseEvent,
    type: MenuType,
    node?: S3Node,
    target?: string
  ) => menuHelpers.openMenu(setMenu, e, type, node, target)
  const closeMenu = () => menuHelpers.closeMenu(setMenu)

  /* ---------------- bucket helper ---------------- */
  const selectBucket = (b: string | null) => {
    if (!confirmDiscard()) return
    setSelectedBucket(b)
    setBreadcrumb([])
    setCurrentPrefix('')
    setTree(null)
    setSelectedFile(null)
    _resetEditor()
  }

  /* beforeunload guard */
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
    setError,
    refreshCurrent,

    openMenu,
    closeMenu,
  }

  return <S3Context.Provider value={value}>{children}</S3Context.Provider>
}
