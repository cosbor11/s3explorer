'use client'

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { useS3 } from '@/contexts/s3'
import { Plus, Minus, Check, XCircle, X } from 'lucide-react'

interface JSONPreviewProps {
  onEdit: () => void
}

/* ---------- Helpers ---------- */
const ExpandCtx = createContext<{ lvl: number }>({ lvl: 0 })
const isObj = (v: any): v is Record<string, unknown> => v && typeof v === 'object'
const depthOf = (d: any, dep = 0): number =>
  !isObj(d)
    ? dep
    : Array.isArray(d)
      ? d.reduce((m, v) => Math.max(m, depthOf(v, dep + 1)), dep)
      : Object.values(d).reduce((m, v) => Math.max(m, depthOf(v, dep + 1)), dep)

/* ---------- Recursive renderer ---------- */
const Node: React.FC<{ n: string | null; d: any; dep?: number; last?: boolean }> = ({ n, d, dep = 0, last = true }) => {
  const { lvl } = useContext(ExpandCtx)
  const [col, setCol] = useState(dep > lvl)
  useEffect(() => setCol(dep > lvl), [dep, lvl])

  const toggle = () => setCol(p => !p)
  const pad = dep * 16

  if (Array.isArray(d)) return (
    <div>
      <div style={{ marginLeft: pad, display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
        <button onClick={toggle} className="flex-none text-yellow-400 opacity-70 focus:outline-none">{col ? <Plus size={12} /> : <Minus size={12} />}</button>
        <span>{n !== null ? `"${n}": ` : ''}{col ? '[ … ]' : '['}</span>
      </div>
      {!col && d.map((v, i) => (
        <Node key={i} n={null} d={v} dep={dep + 1} last={i === d.length - 1} />
      ))}
      {!col && <div style={{ marginLeft: pad, whiteSpace: 'pre' }}>{']'}{!last && ','}</div>}
    </div>
  )

  if (isObj(d)) {
    const ks = Object.keys(d)
    return (
      <div>
        <div style={{ marginLeft: pad, display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
          <button onClick={toggle} className="flex-none text-yellow-400 opacity-70 focus:outline-none">{col ? <Plus size={12} /> : <Minus size={12} />}</button>
          <span>{n !== null ? `"${n}": ` : ''}{col ? '{ … }' : '{'}</span>
        </div>
        {!col && ks.map((k, i) => (
          <Node key={k} n={k} d={(d as any)[k]} dep={dep + 1} last={i === ks.length - 1} />
        ))}
        {!col && <div style={{ marginLeft: pad, whiteSpace: 'pre' }}>{'}'}{!last && ','}</div>}
      </div>
    )
  }

  const vStr = typeof d === 'string' ? `"${d}"` : String(d)
  return <div style={{ marginLeft: pad, whiteSpace: 'pre', wordBreak: 'break-all' }}>{n !== null ? `"${n}": ` : ''}{vStr}{!last && ','}</div>
}

/* ---------- Main ---------- */
export default function JSONPreview({ onEdit }: JSONPreviewProps) {
  const { editedContent, currentPrefix, openPrefix } = useS3()
  let json: any = null, parseErr = ''
  try { json = JSON.parse(editedContent || '') } catch (e: any) { parseErr = e.message }

  const max = useMemo(() => parseErr ? 0 : depthOf(json), [json, parseErr])
  const [lvl, setLvl] = useState(max)
  useEffect(() => setLvl(max), [max])
  const levels = [...Array(max + 1).keys()]

  // locate error line
  let errLine = -1
  if (parseErr) {
    const m = parseErr.match(/position (\d+)/)
    if (m) {
      let p = +m[1], acc = 0
      editedContent.split('\n').some((l, i) => (acc += l.length + 1) > p && (errLine = i, true))
    }
  }

  const handleClose = () => {
    openPrefix(currentPrefix)
  }

  return (
    <ExpandCtx.Provider value={{ lvl }}>
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="flex-1 min-w-0 overflow-auto">
          {/* Toolbar */}
          <div className="sticky top-0 z-10 bg-[#181818] border-b border-[#2d2d2d] w-full px-3 py-2 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">JSON Preview</span>
              {parseErr ? <XCircle size={14} className="text-red-500 opacity-60" /> : <Check size={14} className="text-green-500 opacity-60" />}
            </div>
            <div className="flex items-center space-x-1">
              <select value={lvl} onChange={e => setLvl(+e.target.value)} disabled={!!parseErr} className="bg-[#232323] border border-[#3a3a3a] rounded text-xs px-2 py-0.5 text-gray-200">
                {levels.map(l => <option key={l} value={l}>{l === 0 ? 'None' : `Level ${l}`}</option>)}
              </select>
              <button onClick={() => setLvl(lvl === max ? 0 : max)} disabled={!!parseErr} className="px-2 py-0.5 bg-[#232323] border border-[#3a3a3a] rounded text-xs text-gray-200">{lvl === max ? 'Collapse All' : 'Expand All'}</button>
              <button onClick={onEdit} className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-xs text-gray-200">Edit</button>
              <button
                onClick={handleClose}
                className="px-1 py-0.5 bg-[#232323] cursor-pointer hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs flex items-center"
                title="Close file"
                aria-label="Close file"
                tabIndex={0}
                type="button"
              >
                <X className="w-3 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {parseErr ? (
            <div>
              <div className="bg-red-700 text-red-100 p-2 text-xs">{parseErr}</div>
              <pre className="overflow-auto bg-[#1e1e1e] p-2 text-sm text-[#d4d4d4]">{editedContent.split('\n').map((l, i) => (
                <div key={i} className={i === errLine ? 'bg-red-600' : ''}><span className="opacity-50 mr-1">{String(i + 1).padStart(3, ' ')}</span>{l}</div>))}</pre>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto bg-[#1e1e1e]">
              <div className="min-w-max px-4 py-2 font-mono text-sm text-[#d4d4d4] whitespace-pre break-all">
                <Node n={null} d={json} dep={0} last={true} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ExpandCtx.Provider>
  )
}
