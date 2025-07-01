// clients/s3.ts
import { S3Client } from '@aws-sdk/client-s3'
import type { NextApiRequest } from 'next'
import crypto from 'crypto'

type S3Token = {
  region: string
  endpoint: string
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

  const client = getS3ClientUsingCreds(token.region, token.endpoint, token.accessKeyId, token.secretAccessKey)
  clientCache.set(key, client)
  return client
}


export function getS3ClientUsingCreds(region:string, endpoint:string, accessKeyId:string, secretAccessKey:string): S3Client {
  const isLocalstack =
    endpoint?.includes('localhost') || endpoint?.includes('127.0.0.1') || endpoint?.includes(':4566')

  const client = new S3Client({
    region: region,
    endpoint: isLocalstack ? endpoint : undefined,
    forcePathStyle: isLocalstack,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  })

  return client
}
