// src/components/connection/utils.ts
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
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
    const client = new S3Client({
      endpoint: conn.endpoint,
      region: conn.region,
      credentials: {
        accessKeyId: conn.accessKeyId,
        secretAccessKey: conn.secretAccessKey,
      },
      forcePathStyle: true,
    })
    await client.send(new ListBucketsCommand({}))
    return null
  } catch (err: any) {
    return err.message || 'Unknown error'
  }
}
