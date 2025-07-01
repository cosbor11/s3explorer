// clients/s3.ts
import { S3Client } from '@aws-sdk/client-s3'
import type { NextApiRequest } from 'next'
import crypto from 'crypto'

type S3Token = {
  region: string
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
}

const clientCache = new Map<string, S3Client>()

function hashToken(token: S3Token): string {
  return crypto
    .createHash('sha256')
    .update(`${token.region}:${token.endpoint || ''}:${token.accessKeyId}:${token.secretAccessKey}`)
    .digest('hex')
}

export function getS3Client(req: NextApiRequest): S3Client {
  const raw = req.headers['x-s3-session-token']
  if (!raw || Array.isArray(raw)) throw new Error('Missing or invalid session token')

  const token: S3Token = JSON.parse(raw)
  const key = hashToken(token)

  if (clientCache.has(key)) return clientCache.get(key)!

  const isLocalstack =
    token.endpoint?.includes('localhost') || token.endpoint?.includes('127.0.0.1')

  const client = new S3Client({
    region: token.region,
    endpoint: isLocalstack ? token.endpoint : undefined,
    forcePathStyle: isLocalstack,
    credentials: {
      accessKeyId: token.accessKeyId,
      secretAccessKey: token.secretAccessKey,
    },
  })

  clientCache.set(key, client)
  return client
}
