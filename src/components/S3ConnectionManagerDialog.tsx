// src/components/S3ConnectionManagerDialog.tsx
'use client'

import { useState } from 'react'
import { useS3Connection, S3Connection } from '@/contexts/S3ConnectionContext'
import S3ConnectionForm from './S3ConnectionForm'

export default function S3ConnectionManagerDialog({ onClose }: { onClose: () => void }) {
  const {
    connections,
    selected,
    setSelectedById,
    addConnection,
    updateConnection,
    removeConnection,
  } = useS3Connection()
  const [editing, setEditing] = useState<S3Connection | null>(selected ?? null)
  const [flash, setFlash] = useState(false)

  const triggerFlash = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 100)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-[#1e1e1e] border border-[#444] w-[800px] h-[500px] rounded-lg flex relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* List */}
        <div className="w-1/3 border-r border-[#444] p-4 overflow-auto">
          <h2 className="text-white text-lg mb-2">Connections</h2>
          <ul className="space-y-2">
            {connections.map((conn) => (
              <li
                key={conn.id}
                className={`cursor-pointer p-2 rounded ${
                  editing?.id === conn.id ? 'bg-[#333]' : 'hover:bg-[#2a2a2a]'
                }`}
                onClick={() => setEditing(conn)}
              >
                <div className="text-white font-semibold">{conn.name}</div>
                <div className="text-xs text-gray-400">{conn.endpoint}</div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setEditing(null)
              triggerFlash()
            }}
            className="mt-4 px-3 py-1 rounded bg-[#3794ff] hover:bg-[#4ea2ff] text-sm text-white cursor-pointer transition-colors"
          >
            + Connection
          </button>
        </div>

        {/* Detail */}
        <div className="flex-1 p-4 overflow-auto relative">
          {flash && (
            <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none z-50 rounded" />
          )}
          <S3ConnectionForm
            key={editing?.id || 'new'} // force remount
            editing={editing}
            onSave={(conn) => {
              editing ? updateConnection(conn) : addConnection(conn)
              setEditing(conn)
            }}
            onDelete={(id) => {
              removeConnection(id)
              setEditing(null)
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
