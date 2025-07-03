// src/components/editor/JSONPreview.tsx
'use client'

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { useS3 } from '@/contexts/s3'
import { Plus, Minus } from 'lucide-react'

interface JSONPreviewProps {
  onEdit: () => void
}

// Context to provide global expand/collapse and level info
interface ExpandCollapseContextType {
  allExpanded: boolean
  expandLevel: number
}
const ExpandCollapseContext = createContext<ExpandCollapseContextType>({ allExpanded: true, expandLevel: Infinity })

const isObject = (val: any) => val && typeof val === 'object'

// Compute maximum nesting depth of JSON
const computeMaxDepth = (data: any, depth = 0): number => {
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

// Recursive node renderer
const JSONNode: React.FC<{ name: string | null; data: any; depth?: number; isLast?: boolean }> = ({
  name,
  data,
  depth = 0,
  isLast = true,
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const { allExpanded, expandLevel } = useContext(ExpandCollapseContext)

  // Sync collapse with global controls
  useEffect(() => {
    if (!allExpanded) {
      setCollapsed(true)
    } else {
      setCollapsed(depth >= expandLevel)
    }
  }, [allExpanded, expandLevel, depth])

  const toggle = () => setCollapsed(prev => !prev)
  const indent = depth * 16
  const pad = ' '.repeat(depth * 2)

  if (Array.isArray(data)) {
    return (
      <div>
        <div style={{ marginLeft: indent, display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
          <button onClick={toggle} className="flex-none text-yellow-400 cursor-pointer focus:outline-none">
            {collapsed ? <Plus size={12} /> : <Minus size={12} />}
          </button>
          <span>
            {pad}{name !== null ? `"${name}": ` : ''}{collapsed ? `[ ... ]` : `[`}
          </span>
        </div>
        {!collapsed && data.map((item, idx) => (
          <JSONNode key={idx} name={null} data={item} depth={depth + 1} isLast={idx === data.length - 1} />
        ))}
        {!collapsed && (
          <div style={{ marginLeft: indent, whiteSpace: 'pre' }}>
            {pad}]{!isLast && ','}
          </div>
        )}
      </div>
    )
  } else if (isObject(data)) {
    const keys = Object.keys(data)
    return (
      <div>
        <div style={{ marginLeft: indent, display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
          <button onClick={toggle} className="flex-none text-yellow-400 cursor-pointer focus:outline-none">
            {collapsed ? <Plus size={12} /> : <Minus size={12} />}
          </button>
          <span>
            {pad}{name !== null ? `"${name}": ` : ''}{collapsed ? `{ ... }` : `{`}
          </span>
        </div>
        {!collapsed && keys.map((key, idx) => (
          <JSONNode key={key} name={key} data={data[key]} depth={depth + 1} isLast={idx === keys.length - 1} />
        ))}
        {!collapsed && (
          <div style={{ marginLeft: indent, whiteSpace: 'pre' }}>
            {pad}}{!isLast && ','}
          </div>
        )}
      </div>
    )
  } else {
    const display = typeof data === 'string' ? `"${data}"` : String(data)
    return (
      <div style={{ marginLeft: indent, whiteSpace: 'pre' }}>
        {pad}{name !== null ? `"${name}": ` : ''}{display}{!isLast && ','}
      </div>
    )
  }
}

const JSONPreview: React.FC<JSONPreviewProps> = ({ onEdit }) => {
  // Always call hooks unconditionally
  const { editedContent } = useS3()
  const [allExpanded, setAllExpanded] = useState(true)
  
  // Try parsing JSON
  let json: any = null
  let parseError = false
  try {
    json = JSON.parse(editedContent || '')
  } catch {
    parseError = true
  }

  // Compute maxDepth and initialize expandLevel
  const maxDepth = useMemo(() => (parseError ? 0 : computeMaxDepth(json)), [json, parseError])
  const [expandLevel, setExpandLevel] = useState(maxDepth + 1)

  const toggleAll = () => setAllExpanded(prev => !prev)
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExpandLevel(parseInt(e.target.value, 10))
    setAllExpanded(true)
  }

  const levels = Array.from({ length: maxDepth + 1 }, (_, i) => i + 1)

  return (
    <ExpandCollapseContext.Provider value={{ allExpanded, expandLevel }}>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between gap-2">
          <span className="text-gray-400">JSON Preview</span>
          <div className="flex items-center space-x-1">
            <select
              value={expandLevel}
              onChange={handleLevelChange}
              disabled={parseError}
              className="bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs px-2 py-0.5"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === maxDepth + 1 ? 'All' : `Level ${level}`}
                </option>
              ))}
            </select>
            <button
              onClick={toggleAll}
              disabled={parseError}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
            <button
              onClick={onEdit}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
            >
              Edit raw
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-sm text-[#d4d4d4]">
          {parseError ? (
            <div className="p-4 text-red-400">Invalid JSON</div>
          ) : (
            <JSONNode name={null} data={json} depth={0} isLast={true} />
          )}
        </div>
      </div>
    </ExpandCollapseContext.Provider>
  )
}

export default JSONPreview
