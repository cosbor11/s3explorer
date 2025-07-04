// src/components/S3ConnectionDropdown.tsx
'use client'

import { useState } from 'react'
import Tooltip from './Tooltip'
import { useS3Connection } from '@/contexts/S3ConnectionContext'
import S3ConnectionManagerDialog from './S3ConnectionManagerDialog'

export default function S3ConnectionDropdown() {
  const {
    connections,
    selected,
    setSelectedById,
  } = useS3Connection()

  const [showManager, setShowManager] = useState(false)

  return (
    <>
      <Tooltip label="Select S3 connection">
        <div className="flex items-center gap-2 mx-2">
          <select
            className="bg-[#232323] border border-[#333] text-sm text-white px-2 py-1 rounded cursor-pointer hover:bg-[#2a2a2a]"
            value={selected?.id ?? ''}
            onChange={(e) => {
              const value = e.target.value
              if (value === '__manage') {
                setShowManager(true)
              } else {
                // Clear init flag so the provider will trigger reload
                sessionStorage.removeItem('s3-init')
                setSelectedById(value)
              }
            }}
          >
            <option value="" disabled>Select connection</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name}
              </option>
            ))}
            <option value="__manage">-- Manage connections --</option>
          </select>
        </div>
      </Tooltip>

      {showManager && (
        <S3ConnectionManagerDialog onClose={() => setShowManager(false)} />
      )}
    </>
  )
}
