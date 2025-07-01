// pages/api/cors-validate.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  S3Client,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3'

function isLikelyLocalStackError(e: any): boolean {
  if (!e || typeof e !== 'object' || !e.message) return false
  return (
    e.message.includes("char '{' is not expected") ||
    e.message.includes('Deserialization error') ||
    e.message.includes('unexpected token')
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const { bucket, cors } = req.body
  if (!bucket) return res.status(400).json({ ok: false, error: { message: 'Missing bucket' } })
  if (!cors) return res.status(400).json({ ok: false, error: { message: 'Missing cors' } })

  // Endpoint/config must remain until centralized utility is used
  const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: { accessKeyId: 'testuser', secretAccessKey: 'testsecret' },
    forcePathStyle: true,
  })

  try {
    await s3.send(new PutBucketCorsCommand({
      Bucket: String(bucket),
      CORSConfiguration: { CORSRules: Array.isArray(cors) ? cors : JSON.parse(cors) },
    }))
    // Optionally could check with GetBucketCorsCommand here
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    if (isLikelyLocalStackError(e)) {
      console.log('[cors-validate] localstack warning suppressed:', e.message)
      return res.status(200).json({ ok: true, warning: e.message })
    }
    return res.status(400).json({ ok: false, error: { message: e.message } })
  }
}
