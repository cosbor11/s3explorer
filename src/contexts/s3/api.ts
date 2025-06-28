// src/contexts/s3/api.ts
import { S3Node } from './types'

export async function api<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error?.message || 'Unknown error')
  return data.data
}

// Helper for building the tree structure from S3 list response
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
