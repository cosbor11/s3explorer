// clients/s3.ts
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
import { S3Connection } from '@/contexts/S3ConnectionContext'
import { NextApiRequest } from 'next'

function isLocalstackEndpoint(endpoint?: string): boolean {
  if (!endpoint) return false

  try {
    const url = new URL(endpoint)
    const hostname = url.hostname
    const port = url.port ? parseInt(url.port, 10) : null

    return (
      (hostname === 'localhost' || hostname === '127.0.0.1') &&
      (!port || port === 4566 || port === 4572)
    )
  } catch {
    return false
  }
}

function createClient(conn: S3Connection): S3Client {
  const isLocalstack = isLocalstackEndpoint(conn.endpoint)

  return new S3Client({
    region: conn.region,
    endpoint: isLocalstack ? conn.endpoint : undefined,
    credentials: {
      accessKeyId: conn.accessKeyId,
      secretAccessKey: conn.secretAccessKey,
      sessionToken: conn.sessionToken || undefined,
    },
    forcePathStyle: true,
  })
}

export function getS3Client(conn: S3Connection): S3Client {
  return createClient(conn)
}

export function getS3ClientUsingCreds(
  region: string,
  endpoint: string | undefined,
  accessKeyId: string,
  secretAccessKey: string,
  sessionToken?: string
): S3Client {
  const isLocalStack = isLocalstackEndpoint(endpoint)
  return new S3Client({
    region,
    endpoint: isLocalStack ? endpoint : undefined,
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken: sessionToken || undefined,
    },
    forcePathStyle: true,
  })
}

export function getS3ClientFromRequest(req: NextApiRequest): S3Client {
  const s3SessionToken = req.headers['x-s3-session-token']?.toString()
  if (!s3SessionToken) {
    throw new Error('Missing s3-session-token header')
  }

  let conn: S3Connection
  try {
    conn = JSON.parse(s3SessionToken) as S3Connection
  } catch {
    throw new Error('Invalid s3-session-token: must be valid JSON')
  }

  if (!conn.accessKeyId || !conn.secretAccessKey || !conn.region) {
    throw new Error('Invalid Session token')
  }

  const client = createClient(conn)
  return client
}

export async function testS3Connection(conn: S3Connection): Promise<string | null> {
  const cacheKey = `${conn.sessionToken || 'no-session-token'}:${conn.region}:${conn.endpoint || 'no-endpoint'}`
  try {
    const client = createClient(conn)
    await client.send(new ListBucketsCommand({}))
    return null
  } catch (err: any) {
    return err.message || 'Failed to connect to S3'
  }
}
