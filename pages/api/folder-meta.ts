import { NextApiRequest, NextApiResponse } from 'next'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getS3ClientFromRequest } from '@/clients/s3'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bucket, prefix } = req.query
  if (!bucket || !prefix) return res.status(400).json({ ok: false, error: { message: 'Missing bucket or prefix' } })

    let s3
      try {
        s3 = getS3ClientFromRequest(req)
      } catch (e: any) {
        return res.status(400).json({ ok: false, error: { message: e.message } })
      }

  try {
    let continuationToken: string | undefined = undefined
    let count = 0
    let totalSize = 0
    let lastModified: string | undefined

    do {
      const result = await s3.send(new ListObjectsV2Command({
        Bucket: String(bucket),
        Prefix: String(prefix),
        ContinuationToken: continuationToken,
      }))

      count += result.Contents?.length || 0
      for (const obj of result.Contents || []) {
        totalSize += obj.Size || 0
        if (!lastModified || new Date(obj.LastModified!) > new Date(lastModified)) {
          lastModified = obj.LastModified
        }
      }

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
    } while (continuationToken)

    return res.status(200).json({ ok: true, data: { count, totalSize, lastModified } })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: { message: e.message } })
  }
}
