// src/components/connection/utils.ts
import { S3Connection } from '@/contexts/S3ConnectionContext'

export function generateUniqueName(base: string, existing: S3Connection[]): string {
  const existingNames = new Set(existing.map((c) => c.name))
  if (!existingNames.has(base)) return base
  let suffix = 2
  while (existingNames.has(`${base}-${suffix}`)) suffix++
  return `${base}-${suffix}`
}

export async function testConnection(conn: S3Connection): Promise<string | null> {
  try {
    const res = await fetch('/api/test-s3-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: conn.endpoint,
        region: conn.region,
        accessKeyId: conn.accessKeyId?.trim(),
        secretAccessKey: conn.secretAccessKey?.trim()
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return data?.error || 'Unknown error'
    }

    return null
  } catch (err: any) {
    return err?.message || 'Failed to reach test API'
  }
}