// src/contexts/s3/api.ts
import type { S3Node } from './types'

export async function api<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const token = sessionStorage.getItem('s3-session-token')
  const headers = {
    ...(init?.headers ?? {}),
    ...(token ? { 'x-s3-session-token': token } : {}),
  }

  let res: Response
  try {
    res = await fetch(input, { ...init, headers })
  } catch (e: any) {
    throw new Error(e.message || 'Network error')
  }

  const ct = res.headers.get('content-type') || ''
  const isJson = ct.includes('application/json')

  if (!isJson) {
    const txt = await res.text()
    throw new Error(txt || `HTTP ${res.status}`)
  }

  const j = await res.json()
  if (j.ok) return j.data as T

  throw new Error(j.error?.message || j.error || j.message || `HTTP ${res.status}`)
}

export function buildTree(prefix: string, data: any): S3Node[] {
  const dirs =
    (data.CommonPrefixes ?? []).map((p: any) => ({
      name: p.Prefix.replace(prefix, '').replace(/\/$/, ''),
      fullKey: p.Prefix,
      isDir: true,
    })) ?? []

  const files =
    (data.Contents ?? [])
      .filter((o: any) => o.Key !== prefix && !o.Key.endsWith('/'))
      .map((o: any) => ({
        name: o.Key.replace(prefix, ''),
        fullKey: o.Key,
        isDir: false,
      })) ?? []

  return [...dirs, ...files]
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
