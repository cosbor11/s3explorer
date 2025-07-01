// pages/api/bucket-info.ts
import { NextApiRequest, NextApiResponse } from 'next'
import {
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getS3Client } from '@/clients/s3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bucket } = req.query
  if (!bucket) {
    return res.status(400).json({ ok: false, error: { message: 'Missing bucket' } })
  }

  try {
    const s3 = getS3Client(req)

    const [loc, versioning, list] = await Promise.all([
      s3.send(new GetBucketLocationCommand({ Bucket: String(bucket) })),
      s3.send(new GetBucketVersioningCommand({ Bucket: String(bucket) })),
      s3.send(new ListObjectsV2Command({ Bucket: String(bucket), MaxKeys: 1000 })),
    ])

    let lastModified: string | undefined
    for (const obj of list.Contents || []) {
      if (!lastModified || new Date(obj.LastModified!) > new Date(lastModified)) {
        lastModified = obj.LastModified
      }
    }

    return res.status(200).json({
      ok: true,
      data: {
        LocationConstraint: loc.LocationConstraint || 'us-east-1',
        Status: versioning.Status,
        count: list.KeyCount || 0,
        lastModified,
      },
    })
  } catch (e: any) {
    console.error('bucket-info error:', e)
    return res.status(500).json({ ok: false, error: { message: e.message } })
  }
}
