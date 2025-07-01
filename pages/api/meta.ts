import type { NextApiRequest, NextApiResponse } from 'next'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: { accessKeyId: 'testuser', secretAccessKey: 'testsecret' },
  forcePathStyle: true,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bucket, key } = req.query
    if (!bucket || !key) {
      return res.status(400).json({ ok: false, error: { message: 'Missing bucket or key' } })
    }
    const result = await s3.send(
      new HeadObjectCommand({ Bucket: String(bucket), Key: String(key) })
    )
    return res.status(200).json({ ok: true, data: result })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: { message: e.message } })
  }
}
