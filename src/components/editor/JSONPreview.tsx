// src/components/editor/JSONPreview.tsx
'use client'

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { useS3 } from '@/contexts/s3'
import { Plus, Minus, Check, XCircle } from 'lucide-react'

interface JSONPreviewProps {
  onEdit: () => void
}

const ExpandCollapseContext = createContext<{ expandLevel: number }>({ expandLevel: 0 })

const isObject = (val: any) => val && typeof val === 'object'

type JsonData = any

// Compute maximum nesting depth of JSON
const computeMaxDepth = (data: JsonData, depth = 0): number => {
  if (!isObject(data)) return depth
  let max = depth
  if (Array.isArray(data)) {
    data.forEach(item => {
      const d = computeMaxDepth(item, depth + 1)
      if (d > max) max = d
    })
  } else {
    Object.values(data).forEach(val => {
      const d = computeMaxDepth(val, depth + 1)
      if (d > max) max = d
    })
  }
  return max
}

// Recursive component to render JSON nodes
const JSONNode: React.FC<{ name: string | null; data: JsonData; depth?: number; isLast?: boolean }> = ({ name, data, depth = 0, isLast = true }) => {
  const [collapsed, setCollapsed] = useState(false)
  const { expandLevel } = useContext(ExpandCollapseContext)

  useEffect(() => {
    setCollapsed(depth > expandLevel)
  }, [depth, expandLevel])

  const toggle = () => setCollapsed(prev => !prev)
  const indent = depth * 16
  const pad = ' '.repeat(depth * 2)

  if (Array.isArray(data)) {
    return (
      <div>
        <div style={{ marginLeft: indent, display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
          <button onClick={toggle} className="flex-none text-yellow-400 cursor-pointer focus:outline-none opacity-70">
            {collapsed ? <Plus size={12} /> : <Minus size={12} />}
          </button>
          <span>{pad}{name !== null ? `"${name}": ` : ''}{collapsed ? `[ ... ]` : `[`}</span>
        </div>
        {!collapsed && data.map((item, idx) => (
          <JSONNode key={idx} name={null} data={item} depth={depth + 1} isLast={idx === data.length - 1} />
        ))}
        {!collapsed && <div style={{ marginLeft: indent, whiteSpace: 'pre' }}>{pad}]{!isLast && ','}</div>}
      </div>
    )
  } else if (isObject(data)) {
    const keys = Object.keys(data)
    return (
      <div>
        <div style={{ marginLeft: indent, display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
          <button onClick={toggle} className="flex-none text-yellow-400 cursor-pointer focus:outline-none opacity-70">
            {collapsed ? <Plus size={12} /> : <Minus size={12} />}
          </button>
          <span>{pad}{name !== null ? `"${name}": ` : ''}{collapsed ? `{ ... }` : `{`}</span>
        </div>
        {!collapsed && keys.map((key, idx) => (
          <JSONNode key={key} name={key} data={data[key]} depth={depth + 1} isLast={idx === keys.length - 1} />
        ))}
        {!collapsed && <div style={{ marginLeft: indent, whiteSpace: 'pre' }}>{pad}}{!isLast && ','}</div>}
      </div>
    )
  } else {
    const display = typeof data === 'string' ? `"${data}"` : String(data)
    return <div style={{ marginLeft: indent, whiteSpace: 'pre' }}>{pad}{name !== null ? `"${name}": ` : ''}{display}{!isLast && ','}</div>
  }
}

const JSONPreview: React.FC<JSONPreviewProps> = ({ onEdit }) => {
  const { editedContent } = useS3()

  // Parse JSON content
  let json: JsonData = null
  let parseError = false
  let errorMessage = ''
  try {
    json = JSON.parse(editedContent || '')
  } catch (e: any) {
    parseError = true
    errorMessage = e.message
  }

  // Compute and manage expand/collapse state
  const maxDepth = useMemo(() => (parseError ? 0 : computeMaxDepth(json)), [json, parseError])
  const [expandLevel, setExpandLevel] = useState(maxDepth)
  useEffect(() => { setExpandLevel(maxDepth) }, [maxDepth])

  const levels = Array.from({ length: maxDepth + 1 }, (_, i) => i)
  const toggleAll = () => setExpandLevel(prev => (prev === maxDepth ? 0 : maxDepth))
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => setExpandLevel(parseInt(e.target.value, 10))

  // Highlight error line in raw JSON
  let errorLine = -1
  if (parseError) {
    const match = errorMessage.match(/position (\d+)/)
    if (match) {
      const pos = parseInt(match[1], 10)
      let cum = 0
      const lines = editedContent.split('\n')
      for (let i = 0; i < lines.length; i++) {
        cum += lines[i].length + 1
        if (cum > pos) { errorLine = i; break }
      }
    }
  }

  return (
    <ExpandCollapseContext.Provider value={{ expandLevel }}>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="px-3 py-2 bg-[#181818] border-b border-[#2d2d2d] text-xs flex items-center justify-between">
          {/* Title & status */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">JSON Preview</span>
            {parseError ? <XCircle className="text-red-500 opacity-60" size={14} /> : <Check className="text-green-500 opacity-60" size={14} />}
          </div>
          {/* Controls */}
          <div className="flex items-center space-x-1">
            <select
              value={expandLevel}
              onChange={handleLevelChange}
              disabled={parseError}
              className="bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs px-2 py-0.5"
            >
              {levels.map(level => (
                <option key={level} value={level}>{level === 0 ? 'None' : `Level ${level}`}</option>
              ))}
            </select>
            <button
              onClick={toggleAll}
              disabled={parseError}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
            >{expandLevel === maxDepth ? 'Collapse All' : 'Expand All'}</button>
            <button
              onClick={onEdit}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
            >Edit raw</button>
          </div>
        </div>
        {/* Error banner + raw highlight */}
        {parseError && (
          <div>
            <div className="bg-red-700 text-red-100 p-2 text-xs">{errorMessage}</div>
            <div className="overflow-auto bg-[#1e1e1e] p-2 font-mono text-sm text-[#d4d4d4]">
              {editedContent.split('\n').map((line, idx) => (
                <div
                  key={idx}
                  className={idx === errorLine ? 'bg-red-600' : ''}
                  style={{ whiteSpace: 'pre' }}
                >
                  <span className="opacity-50">{String(idx + 1).padStart(3, ' ')} </span>{line}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Preview area */}
        {!parseError && (
          <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-sm text-[#d4d4d4]">
            <JSONNode name={null} data={json} depth={0} isLast={true} />
          </div>
        )}
      </div>
    </ExpandCollapseContext.Provider>
  )
}

export default JSONPreview
