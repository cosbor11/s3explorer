// src/contexts/S3ConnectionContext.tsx
'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

export type S3Connection = {
  id: string
  name: string
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

const STORAGE_KEY = 's3-connections'
const SELECTED_ID_KEY = 's3-selected-id'

const S3ConnectionContext = createContext<{
  connections: S3Connection[]
  selected: S3Connection | null
  setSelectedById: (id: string) => void
  updateConnection: (conn: S3Connection) => void
  addConnection: (conn: S3Connection) => void
  removeConnection: (id: string) => void
  ready: boolean
}>({} as any)

export function S3ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<S3Connection[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const selected = localStorage.getItem(SELECTED_ID_KEY)
    if (stored) {
      const parsed: S3Connection[] = JSON.parse(stored)
      setConnections(parsed)
      if (selected && parsed.some((c) => c.id === selected)) {
        setSelectedId(selected)
      }
    }
    setReady(true)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
  }, [connections])

  useEffect(() => {
    if (selectedId) {
      localStorage.setItem(SELECTED_ID_KEY, selectedId)
    }
  }, [selectedId])

  const selected = connections.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (!selected) return

    const token = JSON.stringify({
      accessKeyId: selected.accessKeyId,
      secretAccessKey: selected.secretAccessKey,
      sessionToken: selected.sessionToken,
      region: selected.region,
      endpoint: selected.endpoint,
    })
    sessionStorage.setItem('s3-session-token', token)

    const alreadyInitialized = sessionStorage.getItem('s3-init') === '1'

    if (!alreadyInitialized) {
      sessionStorage.setItem('s3-init', '1')
      window.location.reload()
    }
  }, [selected])

  const setSelectedById = (id: string) => setSelectedId(id)

  const updateConnection = (conn: S3Connection) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === conn.id ? conn : c))
    )
  }

  const addConnection = (conn: S3Connection) => {
    setConnections((prev) => [...prev, conn])
    setSelectedId(conn.id)
  }

  const removeConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <S3ConnectionContext.Provider
      value={{
        connections,
        selected,
        setSelectedById,
        updateConnection,
        addConnection,
        removeConnection,
        ready,
      }}
    >
      {children}
    </S3ConnectionContext.Provider>
  )
}

export function useS3Connection() {
  return useContext(S3ConnectionContext)
}
