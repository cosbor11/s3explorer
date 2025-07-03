// src/components/inspector/TagsSection.tsx
'use client'

import { useEffect, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import { Pencil, Trash2, Save, Check } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import useApi from '@/hooks/useApi'

export default function TagsSection() {
  const { selectedBucket, selectedFile } = useS3()
  const [tags, setTags] = useState<{ Key: string; Value?: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [savedMessage, setSavedMessage] = useState(false)
  const api = useApi()

  useEffect(() => {
    if (!selectedBucket) return

    const url = selectedFile
      ? `/api/tags?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(selectedFile.fullKey)}`
      : `/api/tags?bucket=${encodeURIComponent(selectedBucket)}`

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.GET(url)
        if (!res.ok) {
          if (res.error?.message?.includes('TagSet does not exist')) {
            setTags([])
            return
          }
          throw new Error(res.error?.message ?? 'Failed to fetch tags')
        }
        setTags(res.data.TagSet ?? [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedBucket, selectedFile])

  const updateTag = (index: number, field: 'Key' | 'Value', value: string) => {
    setTags(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addTag = () => {
    setTags(prev => [...prev, { Key: '', Value: '' }])
    setEditIndex(tags.length)
  }

  const removeTag = async (index: number) => {
    const tag = tags[index]
    const label = tag.Key + (tag.Value?.trim() ? ` : ${tag.Value}` : '')
    const confirmed = window.confirm(`Are you sure you want to delete tag "${label}"?`)
    if (!confirmed) return

    const next = tags.filter((_, i) => i !== index)
    setTags(next)
    if (editIndex === index) setEditIndex(null)

    await doSave(next)
  }

  const saveTags = async () => {
    if (tags.some(tag => !tag.Key.trim())) {
      setError('Tag keys cannot be empty.')
      return
    }
    await doSave(tags)
    setEditIndex(null)
  }

  const doSave = async (next: { Key: string; Value?: string }[]) => {
    setSaving(true)
    setError(null)
    try {
      const cleaned = next.filter(tag => tag.Key.trim() !== '')
      const res = await api.PUT('/api/tags', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: selectedBucket, key: selectedFile?.fullKey, tags: cleaned }),
      })
      if (!res.ok) throw new Error(res.error?.message ?? 'Failed to save tags')
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (error) return <div className="text-red-400">{error}</div>

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {tags.map((tag, i) => {
          const isSaved = tag.Key.trim() !== ''
          const isEditing = editIndex === i
          const isKeyEmpty = isEditing && !tag.Key.trim()

          return (
            <li key={i} className="flex items-center justify-between border-b border-[#333] pb-1">
              {isEditing ? (
                <>
                  <div className="flex gap-2 w-full">
                    <input
                      className={`bg-[#1e1e1e] border rounded px-2 py-1 text-xs w-[40%] ${
                        isKeyEmpty
                          ? 'border-red-500 text-red-300'
                          : 'border-[#555] text-[#9cdcfe]'
                      }`}
                      value={tag.Key}
                      onChange={e => updateTag(i, 'Key', e.target.value)}
                      placeholder="Key (required)"
                    />
                    <input
                      className="bg-[#1e1e1e] border border-[#555] rounded px-2 py-1 text-xs text-[#ce9178] w-[40%]"
                      value={tag.Value ?? ''}
                      onChange={e => updateTag(i, 'Value', e.target.value)}
                      placeholder="Value (optional)"
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={saveTags}
                      className="text-xs flex items-center px-2 py-1 rounded text-[#3794ff] border border-[#3794ff] hover:bg-[#222] transition-colors disabled:opacity-50"
                      disabled={saving || isKeyEmpty}
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                      Save
                    </button>
                    {isSaved && (
                      <button onClick={() => removeTag(i)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="inline-block bg-[#333] text-xs px-3 py-1.5 rounded-full text-[#9cdcfe] font-semibold">
                      <span className="text-[#ce9178]">{tag.Key}</span>
                      {tag.Value?.trim() && <span className="text-[#9cdcfe]"> : {tag.Value}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => setEditIndex(i)} className="hover:text-white text-[#ccc]">
                      <Pencil className="w-3 h-3" />
                    </button>
                    {isSaved && (
                      <button onClick={() => removeTag(i)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={addTag}
          className="text-xs flex items-center px-2 py-1 rounded text-[#4ec9b0] border border-[#4ec9b0] hover:bg-[#222]"
        >
          + Tag
        </button>
        {savedMessage && (
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <Check className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>
    </div>
  )
}
