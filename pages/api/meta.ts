// pages/api/meta.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getS3Client } from '@/clients/s3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bucket, key } = req.query
    if (!bucket || !key) {
      return res.status(400).json({ ok: false, error: { message: 'Missing bucket or key' } })
    }

    let s3
      try {
        s3 = getS3Client(req)
      } catch (e: any) {
        return res.status(400).json({ ok: false, error: { message: e.message } })
      }

    const result = await s3.send(
      new HeadObjectCommand({ Bucket: String(bucket), Key: String(key) })
    )

    return res.status(200).json({
      ok: true,
      data: {
        ContentType: result.ContentType,
        ContentLength: result.ContentLength,
        LastModified: result.LastModified,
        ETag: result.ETag,
        Metadata: result.Metadata ?? {},
        StorageClass: result.StorageClass ?? 'STANDARD',
      },
    })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: { message: e.message } })
  }
}
