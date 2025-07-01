// src/components/inspector/PolicySection.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useS3 } from '@/contexts/s3'
import {
  Save,
  Check,
  AlertCircle,
  ChevronDown,
  ShieldCheck,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react'

const PRESETS = [
  {
    label: 'Private (default)',
    icon: <Lock className="w-3 h-3 mr-1 inline" />,
    json: {
      Version: '2012-10-17',
      Statement: [],
    },
  },
  {
    label: 'Public Read (list+get)',
    icon: <Globe className="w-3 h-3 mr-1 inline" />,
    json: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: ['arn:aws:s3:::${bucket}/*'],
        },
        {
          Sid: 'PublicReadListBucket',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:ListBucket'],
          Resource: ['arn:aws:s3:::${bucket}'],
        },
      ],
    },
  },
  {
    label: 'Read-Only for Authenticated AWS Users',
    icon: <ShieldCheck className="w-3 h-3 mr-1 inline" />,
    json: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowAuthenticatedRead',
          Effect: 'Allow',
          Principal: { AWS: '*' },
          Action: ['s3:GetObject'],
          Resource: ['arn:aws:s3:::${bucket}/*'],
          Condition: {
            StringNotEquals: { 'aws:userid': 'anonymous' },
          },
        },
      ],
    },
  },
]

function validateS3Policy(obj: any): string | null {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'Policy must be a JSON object'
  if (obj.Version !== '2012-10-17') return 'Policy Version must be "2012-10-17"'
  if (!Array.isArray(obj.Statement)) return 'Policy must contain a Statement array'
  for (const [i, stmt] of obj.Statement.entries()) {
    if (typeof stmt !== 'object' || !stmt) return `Statement #${i + 1} is not an object`
    if (!stmt.Effect || !['Allow', 'Deny'].includes(stmt.Effect)) return `Statement #${i + 1} missing valid Effect`
    if (!stmt.Action) return `Statement #${i + 1} missing Action`
    if (!stmt.Resource) return `Statement #${i + 1} missing Resource`
    if (!stmt.Principal && stmt.Effect === 'Allow') return `Statement #${i + 1} missing Principal`
  }
  return null
}

export default function PolicySection() {
  const { selectedBucket } = useS3()
  const [policy, setPolicy] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [validated, setValidated] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [presetIdx, setPresetIdx] = useState<number | null>(null)
  const [validating, setValidating] = useState(false)
  const [awsValidationMsg, setAwsValidationMsg] = useState<string | null>(null)
  const [awsValidated, setAwsValidated] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const presetRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!presetOpen) return
    function handleClick(e: MouseEvent) {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [presetOpen])

  useEffect(() => {
    if (!selectedBucket) return
    setLoading(true)
    setError(null)
    setPolicy('')
    setJsonError(null)
    setValidated(false)
    setPresetIdx(null)
    setAwsValidationMsg(null)
    setAwsValidated(false)
    setJustSaved(false)

    fetch(`/api/policy?bucket=${encodeURIComponent(selectedBucket)}`)
      .then(res => res.json())
      .then(json => {
        if (!json.ok) throw new Error(json.error?.message ?? 'Failed to load policy')
        const str = JSON.stringify(json.data.Policy, null, 2)
        setPolicy(str)
        setOriginal(str)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedBucket])

  const updatePolicy = (v: string) => {
    setPolicy(v)
    setValidated(false)
    setJsonError(null)
    setAwsValidationMsg(null)
    setAwsValidated(false)
    setJustSaved(false)
  }

  const validateJson = () => {
    let parsed: any
    try {
      parsed = JSON.parse(policy)
    } catch (e: any) {
      setJsonError('Invalid JSON: ' + e.message)
      setValidated(false)
      setAwsValidationMsg(null)
      setAwsValidated(false)
      return false
    }
    const policyErr = validateS3Policy(parsed)
    if (policyErr) {
      setJsonError(policyErr)
      setValidated(false)
      setAwsValidationMsg(null)
      setAwsValidated(false)
      return false
    }
    setJsonError(null)
    setValidated(true)
    return true
  }

  const validateRemote = async () => {
    setValidating(true)
    setAwsValidationMsg(null)
    setAwsValidated(false)
    setJustSaved(false)
    if (!validateJson()) {
      setValidating(false)
      return false
    }
    try {
      const resp = await fetch('/api/policy-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: selectedBucket, policy: JSON.parse(policy) }),
      })
      const json = await resp.json()
      if (!json.ok) {
        setAwsValidationMsg(json.error?.message || 'AWS validation failed')
        setAwsValidated(false)
        return false
      }
      setAwsValidationMsg('Policy accepted by AWS')
      setAwsValidated(true)
      return true
    } catch (e: any) {
      setAwsValidationMsg(e.message)
      setAwsValidated(false)
      return false
    } finally {
      setValidating(false)
    }
  }

  const savePolicy = async () => {
    if (!selectedBucket || !validateJson()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: selectedBucket, policy: JSON.parse(policy) }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error?.message ?? 'Failed to save policy')
      setOriginal(policy)
      setJustSaved(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (preset: typeof PRESETS[0], i: number) => {
    if (!selectedBucket) return
    const jsonStr = JSON.stringify(
      JSON.parse(JSON.stringify(preset.json).replace(/\$\{bucket\}/g, selectedBucket)),
      null,
      2
    )
    setPolicy(jsonStr)
    setValidated(false)
    setJsonError(null)
    setAwsValidationMsg(null)
    setAwsValidated(false)
    setJustSaved(false)
    setPresetOpen(false)
    setPresetIdx(i)
  }

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (error) return <div className="text-red-400">{error}</div>

  const dirty = policy !== original

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="w-full h-64 bg-[#1e1e1e] text-[#d4d4d4] border border-[#555] rounded px-3 py-2 text-xs font-mono"
        value={policy}
        onChange={e => updatePolicy(e.target.value)}
        spellCheck={false}
      />
      <div className="flex items-center mt-1">
        <button
          className={`text-xs flex items-center px-2 py-1 rounded text-[#4ec9b0] border border-[#4ec9b0] hover:bg-[#222] mr-2 ${validating ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={validateRemote}
          disabled={saving || validating}
          title="Validate Policy"
          style={{ minWidth: 75 }}
        >
          {validating ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : awsValidated ? (
            <Check className="w-3 h-3 mr-1" />
          ) : null}
          Validate
        </button>
        {dirty && !jsonError && (
          <button
            className={`text-xs flex items-center px-2 py-1 rounded text-[#3794ff] border border-[#3794ff] hover:bg-[#222] transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={savePolicy}
            disabled={saving}
            title="Save Policy"
            style={{ minWidth: 65 }}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            Save
          </button>
        )}
        <div className="flex-1" />
        <label className="text-xs text-gray-400 mr-2 ml-3">Presets:</label>
        <div className="relative" ref={presetRef}>
          <button
            type="button"
            className="text-xs px-2 py-1 border border-[#555] bg-[#232323] hover:bg-[#333] rounded flex items-center gap-1"
            onClick={() => setPresetOpen((v) => !v)}
          >
            Presets <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          {presetOpen && (
            <div className="absolute right-0 z-50 mt-1 w-56 bg-[#232323] border border-[#555] rounded shadow">
              {PRESETS.map((preset, i) => (
                <button
                  key={preset.label}
                  type="button"
                  className="flex items-center w-full px-2 py-2 text-xs hover:bg-[#333] text-left"
                  onClick={() => applyPreset(preset, i)}
                >
                  {preset.icon}
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {(awsValidationMsg || jsonError) && (
        <div className={`text-xs mt-1 ${awsValidated ? 'text-green-400' : 'text-red-400'}`}>
          {awsValidationMsg || jsonError}
        </div>
      )}
      {justSaved && (
        <div className="flex items-center gap-2 text-xs mt-1 text-green-400">
          <Check className="w-3 h-3" />
          Saved
        </div>
      )}
    </div>
  )
}
