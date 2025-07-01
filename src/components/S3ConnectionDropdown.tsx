// src/components/S3ConnectionDropdown.tsx
'use client'

import { useState } from 'react'
import Tooltip from './Tooltip'
import { useS3Connection } from '@/contexts/S3ConnectionContext'
import { S3Connection } from '@/contexts/S3ConnectionContext'
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
        <div className="flex items-center gap-2">
          <select
            className="bg-[#232323] border border-[#333] text-sm text-white px-2 py-1 rounded"
            value={selected?.id ?? ''}
            onChange={(e) => {
              if (e.target.value === '__manage') {
                setShowManager(true)
              } else {
                setSelectedById(e.target.value)
              }
            }}
          >
            <option value="" disabled>Select connection</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name}
              </option>
            ))}
            <option value="__manage">⚙️ Manage connections</option>
          </select>
        </div>
      </Tooltip>

      {showManager && (
        <S3ConnectionManagerDialog onClose={() => setShowManager(false)} />
      )}
    </>
  )
}
