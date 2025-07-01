// src/components/S3ConnectionForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useS3Connection, S3Connection } from '@/contexts/S3ConnectionContext'
import { presets } from '@/components/connection/presets'
import { generateUniqueName, testConnection } from '@/components/connection/utils'
import { nanoid } from 'nanoid'

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

  const [selectedPreset, setSelectedPreset] = useState('')
  const [testStatus, setTestStatus] = useState<string | null>(null)

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

  const onChange = (field: keyof S3Connection, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const final = { ...form, id: form.id || nanoid() }
    onSave(final)
  }

  const handleTest = async () => {
    setTestStatus('Testing...')
    try {
      const err = await testConnection(form)
      if (err) {
        setTestStatus(`Error: ${err}`)
      } else {
        setTestStatus('Success')
      }
    } catch (e: any) {
      setTestStatus(`Error: ${e?.message || 'Unknown error'} (${e?.name || 'NoName'})`)
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
          <option value="">Custom</option>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Region</label>
          <input
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.region}
            onChange={(e) => onChange('region', e.target.value)}
          />
        </div>
        <div className="col-span-2">
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
          <label className="block text-sm mb-1">Session Token (optional)</label>
          <input
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1"
            value={form.sessionToken}
            onChange={(e) => onChange('sessionToken', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleTest}
          className="bg-[#333] border border-[#555] px-4 py-1 rounded hover:bg-[#444]"
        >
          Test Connection
        </button>
        <div className="flex-1" />
        <button
          onClick={onCancel}
          className="border border-[#555] text-gray-300 hover:text-white px-4 py-1 rounded"
        >
          Cancel
        </button>
        {editing && (
          <button
            onClick={() => onDelete(form.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
          >
            Delete
          </button>
        )}
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
        >
          Save
        </button>
      </div>

      {testStatus && (
        <div className="text-xs text-gray-400 bg-[#1a1a1a] border border-[#333] rounded p-2 mt-2 max-h-24 overflow-auto whitespace-pre-wrap">
          {testStatus}
        </div>
      )}
    </div>
  )
}
