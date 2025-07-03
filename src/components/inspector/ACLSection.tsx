// src/components/inspector/ACLSection.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import { Save, Info, Plus, Trash2, Check } from 'lucide-react'
import useApi from '@/hooks/useApi'

const CANNED_ACLS = ['private', 'public-read', 'public-read-write', 'authenticated-read']
const PERMISSIONS = ['FULL_CONTROL', 'WRITE', 'WRITE_ACP', 'READ', 'READ_ACP']
const GRANTEE_TYPES = ['CanonicalUser', 'Group']

function getAclJson(owner: any, grants: any[]): string {
  return JSON.stringify({ Owner: owner, Grants: grants }, null, 2)
}

const CANNED_PREVIEWS: Record<string, any> = {
  'private': [],
  'public-read': [
    { Grantee: { Type: 'Group', URI: 'http://acs.amazonaws.com/groups/global/AllUsers' }, Permission: 'READ' },
  ],
  'public-read-write': [
    { Grantee: { Type: 'Group', URI: 'http://acs.amazonaws.com/groups/global/AllUsers' }, Permission: 'READ' },
    { Grantee: { Type: 'Group', URI: 'http://acs.amazonaws.com/groups/global/AllUsers' }, Permission: 'WRITE' },
  ],
  'authenticated-read': [
    { Grantee: { Type: 'Group', URI: 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers' }, Permission: 'READ' },
  ],
}

function parseJsonAcl(json: string) {
  const parsed = JSON.parse(json)
  if (!parsed.Owner || !Array.isArray(parsed.Grants)) throw new Error('Invalid ACL format')
  return { owner: parsed.Owner, grants: parsed.Grants }
}

function findCannedByGrants(grants: any[]): string | null {
  for (const key of CANNED_ACLS) {
    const preview = JSON.stringify(CANNED_PREVIEWS[key] || [])
    if (JSON.stringify(grants) === preview) return key
  }
  return null
}

function CannedAclHelp() {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!show) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setShow(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [show])

  return (
    <span className="relative flex-shrink-0" ref={ref}>
      <button onClick={() => setShow(s => !s)} className="p-0 m-0 bg-transparent border-none focus:outline-none">
        <Info className="w-3 h-3 text-[#888] cursor-pointer" />
      </button>
      {show && (
        <div className="fixed left-1/2 top-16 z-[1200] w-64 bg-[#232323] text-xs text-[#bbb] border border-[#555] rounded p-2 shadow-lg"
          style={{ transform: 'translateX(-50%)' }}>
          <b>Canned ACL</b> is a predefined permission set like <code>public-read</code>. See{' '}
          <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl"
            target="_blank" rel="noopener noreferrer"
            className="text-[#4ec9b0] underline">
            AWS docs
          </a>.
        </div>
      )}
    </span>
  )
}

export default function ACLSection() {
  const { selectedBucket, selectedFile } = useS3()
  const [grants, setGrants] = useState<any[]>([])
  const [owner, setOwner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cannedAcl, setCannedAcl] = useState<string>('')
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form')
  const [jsonText, setJsonText] = useState<string>('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [initialJsonText, setInitialJsonText] = useState<string>('')

  const api = useApi()

  const skipSyncRef = useRef(false)

  useEffect(() => {
    if (!selectedBucket) return

    const url = selectedFile
      ? `/api/acl?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(selectedFile.fullKey)}`
      : `/api/acl?bucket=${encodeURIComponent(selectedBucket)}`

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.GET(url)
        if (!res.ok) throw new Error(res.error?.message ?? 'Failed to load ACL')
        const raw = getAclJson(res.data.Owner, res.data.Grants)
        setOwner(res.data.Owner || null)
        setGrants(res.data.Grants || [])
        setCannedAcl(findCannedByGrants(res.data.Grants || []) || '')
        setJsonText(raw)
        setInitialJsonText(raw)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedBucket, selectedFile])

  useEffect(() => {
    if (!skipSyncRef.current && viewMode === 'form') {
      const preview = cannedAcl ? CANNED_PREVIEWS[cannedAcl] || [] : grants
      setJsonText(getAclJson(owner, preview))
      setJsonError(null)
    }
    skipSyncRef.current = false
  }, [grants, owner, cannedAcl, viewMode])

  useEffect(() => {
    if (viewMode === 'json') {
      const preview = cannedAcl ? CANNED_PREVIEWS[cannedAcl] || [] : grants
      setJsonText(getAclJson(owner, preview))
      setJsonError(null)
    }
  }, [viewMode, cannedAcl])

  const isFormDirty = (cannedAcl ? getAclJson(owner, CANNED_PREVIEWS[cannedAcl] || []) : getAclJson(owner, grants)) !== initialJsonText

  const updateJsonText = (text: string) => {
    setJsonText(text)
    try {
      const { owner, grants } = parseJsonAcl(text)
      setOwner(owner)
      setGrants(grants)
      setCannedAcl(findCannedByGrants(grants) || '')
      setJsonError(null)
    } catch (e: any) {
      setJsonError(e.message)
    }
  }

  const saveACL = async () => {
    if (!selectedBucket) return
    setSaving(true)
    setError(null)
    try {
      const body = viewMode === 'json'
        ? JSON.stringify({ bucket: selectedBucket, key: selectedFile?.fullKey, AccessControlPolicy: JSON.parse(jsonText) })
        : JSON.stringify({
            bucket: selectedBucket,
            key: selectedFile?.fullKey,
            grants: cannedAcl ? undefined : grants,
            canned: cannedAcl || undefined,
            owner: cannedAcl ? undefined : owner,
          })

      const res = await api.PUT('/api/acl', {
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error?.message ?? 'Failed to save ACL')

      const newText = viewMode === 'form'
        ? getAclJson(owner, cannedAcl ? CANNED_PREVIEWS[cannedAcl] || [] : grants)
        : jsonText

      setInitialJsonText(newText)
      setSaved(true)
      setTimeout(() => setSaved(false), 5000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const updateGrant = (i: number, field: string, value: string) => {
    setGrants(prev => {
      const next = [...prev]
      const current = { ...(next[i] || {}) }
      const grantee = { ...(current.Grantee || {}) }

      if (field === 'Type') {
        grantee.Type = value
        if (value === 'CanonicalUser') {
          delete grantee.URI
          grantee.ID = grantee.ID || ''
        } else if (value === 'Group') {
          delete grantee.ID
          grantee.URI = grantee.URI || 'http://acs.amazonaws.com/groups/global/AllUsers'
        }
      } else if (field === 'ID' || field === 'URI') {
        grantee[field] = value
      } else if (field === 'Permission') {
        current.Permission = value
      }

      current.Grantee = grantee
      next[i] = current
      return next
    })

    skipSyncRef.current = true
  }

  const addGrant = () => {
    setGrants(prev => [...prev, { Grantee: { Type: 'CanonicalUser', ID: '' }, Permission: 'READ' }])
    skipSyncRef.current = true
  }

  const removeGrant = (i: number) => {
    setGrants(prev => prev.filter((_, idx) => idx !== i))
    skipSyncRef.current = true
  }

  if (loading) return <div className="text-gray-500">Loading...</div>

  const ownerLabel = owner?.DisplayName || owner?.ID || '(unknown)'

  return (
    <div className="space-y-4 text-sm">
      <div className="font-semibold text-xs text-[#7fbc41]">Owner: {ownerLabel}</div>

      <div className="flex gap-4 text-xs text-[#ccc] border-b border-[#333] pb-2">
        <button onClick={() => setViewMode('form')} className={viewMode === 'form' ? 'text-white underline' : 'hover:text-white'}>Form</button>
        <button onClick={() => setViewMode('json')} className={viewMode === 'json' ? 'text-white underline' : 'hover:text-white'}>JSON</button>
      </div>

      {viewMode === 'json' && (
        <>
          <textarea value={jsonText} onChange={e => updateJsonText(e.target.value)}
            className="w-full h-64 bg-[#1e1e1e] text-[#d4d4d4] border border-[#555] rounded px-3 py-2 text-xs font-mono" />
          {jsonError && <div className="text-xs text-red-400 whitespace-pre-wrap">{jsonError}</div>}
        </>
      )}

      {viewMode === 'form' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs text-[#ccc] pr-2">Canned ACL</label>
            <CannedAclHelp />
            <select value={cannedAcl} onChange={e => setCannedAcl(e.target.value)}
              className="ml-4 flex-1 bg-[#1e1e1e] border border-[#555] text-xs px-2 py-1 text-[#d4d4d4] rounded">
              <option value="">Custom</option>
              {CANNED_ACLS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {cannedAcl === '' && (
            <div className="space-y-2">
              {grants.map((g, i) => (
                <div key={i} className="flex flex-col gap-1 border border-[#333] rounded px-3 py-2">
                  <select value={g.Grantee.Type} onChange={e => updateGrant(i, 'Type', e.target.value)}
                    className="bg-[#1e1e1e] border border-[#555] text-xs px-2 py-1 text-[#d4d4d4] rounded">
                    {GRANTEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={g.Grantee.ID || ''} onChange={e => updateGrant(i, 'ID', e.target.value)}
                    className="bg-[#1e1e1e] border border-[#555] text-xs px-2 py-1 text-[#d4d4d4] rounded"
                    placeholder="Canonical User ID or Group URI" />
                  <select value={g.Permission} onChange={e => updateGrant(i, 'Permission', e.target.value)}
                    className="bg-[#1e1e1e] border border-[#555] text-xs px-2 py-1 text-[#d4d4d4] rounded">
                    {PERMISSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button onClick={() => removeGrant(i)}
                    className="border border-red-500 text-red-400 hover:text-red-300 hover:border-red-300 text-xs mt-1 self-end rounded px-2 py-1">
                    <Trash2 className="w-3 h-3 inline mr-1" /> Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2 items-center mt-2">
                <button onClick={addGrant}
                  className="border border-[#4ec9b0] text-[#4ec9b0] hover:bg-[#4ec9b010] hover:border-[#4ec9b0] rounded px-3 py-1 text-xs">
                  + Grant
                </button>
                {isFormDirty && (
                  <button onClick={saveACL}
                    className="border border-[#3794ff] text-[#3794ff] hover:text-white hover:border-white rounded px-3 py-1 text-xs flex items-center gap-1">
                    <Save className="w-4 h-4" /> Save
                  </button>
                )}
                {saved && (
                  <div className="text-xs text-green-400 flex items-center gap-1 animate-fade-out">
                    <Check className="w-4 h-4" /> Saved
                  </div>
                )}
              </div>
              {error && (
                <pre className="text-xs text-red-400 whitespace-pre-wrap break-words select-all mt-2">{error}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
