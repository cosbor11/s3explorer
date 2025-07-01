import type { NextApiRequest, NextApiResponse } from 'next'
import {
  S3Client,
  GetObjectTaggingCommand,
  GetBucketTaggingCommand,
  PutObjectTaggingCommand,
  PutBucketTaggingCommand,
  Tag
} from '@aws-sdk/client-s3'
import { getS3Client } from '@/clients/s3'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  if (method === 'GET') {
    const { bucket, key } = req.query
    if (!bucket) return res.status(400).json({ ok: false, error: { message: 'Missing bucket' } })

    let s3
    try {
      s3 = getS3Client(req)
    } catch (e: any) {
      return res.status(400).json({ ok: false, error: { message: e.message } })
    }

    try {
      const cmd = key
        ? new GetObjectTaggingCommand({ Bucket: String(bucket), Key: String(key) })
        : new GetBucketTaggingCommand({ Bucket: String(bucket) })

      const result = await s3.send(cmd)
      return res.status(200).json({ ok: true, data: result })
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: { message: e.message } })
    }
  }

  if (method === 'PUT') {
    const { bucket, key, tags } = req.body
    if (!bucket || !Array.isArray(tags)) {
      return res.status(400).json({ ok: false, error: { message: 'Missing or invalid bucket/tags' } })
    }

    const TagSet: Tag[] = tags.map((t: any) => ({ Key: t.Key, Value: t.Value }))

    try {
      const cmd = key
        ? new PutObjectTaggingCommand({ Bucket: bucket, Key: key, Tagging: { TagSet } })
        : new PutBucketTaggingCommand({ Bucket: bucket, Tagging: { TagSet } })

      await s3.send(cmd)
      return res.status(200).json({ ok: true })
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: { message: e.message } })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  res.status(405).end(`Method ${method} Not Allowed`)
}
