import { S3Connection } from '@/contexts/S3ConnectionContext'

export function generateUniqueName(base: string, existing: S3Connection[]): string {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  if (isLocalhost) {
    const existingNames = new Set(existing.map((c) => c.name))
    if (!existingNames.has(base)) return base
    let suffix = 2
    while (existingNames.has(`${base}-${suffix}`)) suffix++
    return `${base}-${suffix}`
  } else {
    const username = 'user' // Replace with actual username retrieval logic
    const region = existing[0]?.region || 'unknown'
    return `AWS ${username} (${region})`
  }
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
        secretAccessKey: conn.secretAccessKey?.trim(),
        sessionToken: conn.sessionToken?.trim()
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