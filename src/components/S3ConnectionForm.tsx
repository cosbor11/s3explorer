// src/components/S3ConnectionForm.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useS3Connection, S3Connection } from '@/contexts/S3ConnectionContext'
import { presets } from '@/components/connection/presets'
import { generateUniqueName, testConnection } from '@/components/connection/utils'
import { nanoid } from 'nanoid'
import isEqual from 'lodash.isequal'

const REGIONS = [
  'us-east-1', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-central-1', 'ap-southeast-1',
  'ap-southeast-2', 'ap-northeast-1', 'sa-east-1',
]

export default function S3ConnectionForm({
  editing,
  onSave,
  onDelete,
  onCancel,
}: {
  editing: S3Connection | null
  onSave: (conn: S3Connection) => void
  onDelete: (id: string) => void
  onCancel: () => void
}) {
  const { connections } = useS3Connection()
  const [form, setForm] = useState<S3Connection>(
    editing || {
      id: '',
      name: '',
      endpoint: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    }
  )

  const [initialForm, setInitialForm] = useState(form)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    const reset = editing || {
      id: '',
      name: '',
      endpoint: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    }
    setForm(reset)
    setInitialForm(reset)
  }, [editing])

  useEffect(() => {
    if (selectedPreset) {
      const preset = presets.find((p) => p.label === selectedPreset)
      if (preset) {
        const name = generateUniqueName(
          preset.label.toLowerCase().replace(/\s+/g, '-'),
          connections
        )
        setForm((prev) => ({ ...prev, ...preset.values, name }))
      }
    }
  }, [selectedPreset])

  const isDirty = useMemo(() => !isEqual(form, initialForm), [form, initialForm])

  const cancelLabel = useMemo(() => {
    if (saveStatus === 'saved') return 'Done'
    return isDirty ? 'Cancel' : 'Close'
  }, [isDirty, saveStatus])

  const onChange = (field: keyof S3Connection, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setSaveStatus('saving')
    const final = { ...form, id: form.id || nanoid() }
    onSave(final)
    setInitialForm(final)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleTest = async () => {
    setTestStatus('Testing...')
    try {
      const err = await testConnection(form)
      setTestStatus(err ? `Error: ${err}` : 'Success')
    } catch (e: any) {
      setTestStatus(`Error: ${e?.message || 'Unknown error'} (${e?.name || 'NoName'})`)
    }
  }

  const handleDelete = () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${form.name}"?`)
    if (confirmed) {
      onDelete(form.id)
    }
  }

  const activePreset = presets.find((p) => p.label === selectedPreset)

  return (
    <div className="flex flex-col gap-4 text-white">
      <div>
        <label className="block text-sm mb-1">Preset</label>
        <select
          className="bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 w-full"
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
        >
          <option value="">Select preset</option>
          {presets.map((preset) => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
        </select>
        {activePreset && (
          <div className="text-xs mt-2 text-gray-300 space-y-1">
            <div>{activePreset.description}</div>
            <div className="text-gray-400">{activePreset.instructions}</div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1">Name</label>
        <input
          className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Region</label>
          <select
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.region}
            onChange={(e) => onChange('region', e.target.value)}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Endpoint</label>
          <input
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.endpoint}
            onChange={(e) => onChange('endpoint', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Access Key ID</label>
          <input
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.accessKeyId}
            onChange={(e) => onChange('accessKeyId', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Secret Access Key</label>
          <input
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.secretAccessKey}
            onChange={(e) => onChange('secretAccessKey', e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm mb-1">Session Token</label>
          <input
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.sessionToken || ''}
            onChange={(e) => onChange('sessionToken', e.target.value)}
            placeholder="Optional – only needed for temporary sessions"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleTest}
          className="cursor-pointer bg-[#333] border border-[#555] px-4 py-1 rounded hover:bg-[#444]"
        >
          Test Connection
        </button>
        <div className="flex-1" />
        <button
          onClick={onCancel}
          className="cursor-pointer border border-[#555] text-gray-300 hover:text-white px-4 py-1 rounded"
        >
          {cancelLabel}
        </button>
        {editing && (
          <button
            onClick={handleDelete}
            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
          >
            Delete
          </button>
        )}
        <button
          onClick={handleSave}
          className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded flex items-center gap-2"
        >
          {saveStatus === 'saving' && (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          Save
        </button>
      </div>

      {saveStatus === 'saved' && (
        <div className="text-green-500 text-sm flex items-center gap-1 mt-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Saved
        </div>
      )}

      {testStatus && (
        <div className="text-xs text-gray-400 bg-[#1a1a1a] border border-[#333] rounded p-2 mt-2 max-h-24 overflow-auto whitespace-pre-wrap">
          {testStatus}
        </div>
      )}
    </div>
  )
}
