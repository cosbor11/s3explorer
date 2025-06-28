// src/contexts/s3/api.ts
import type { S3Node } from './types'

/**
 * Unified fetch helper that:
 *  • surfaces non-JSON responses (e.g., 413 body-size errors) as plain Error.
 *  • expects JSON payload   { ok:boolean, data?:any, error?:{ message } }
 *  • throws Error(message) for any failure so the UI banner can display it.
 */
export async function api<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  let res: Response
  try {
    res = await fetch(input, init)
  } catch (e: any) {
    throw new Error(e.message || 'Network error')
  }

  const ct = res.headers.get('content-type') || ''
  const isJson = ct.includes('application/json')

  /* ───── plain-text / HTML errors (413, 502, etc.) ───── */
  if (!isJson) {
    const txt = await res.text()
    throw new Error(txt || `HTTP ${res.status}`)
  }

  /* ───── JSON response ───── */
  const j = await res.json()

  if (j.ok) return j.data as T

  const msg =
    j.error?.message ||
    j.error ||
    j.message ||
    `HTTP ${res.status}`

  throw new Error(msg)
}

/* ---------- helpers ---------- */
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
