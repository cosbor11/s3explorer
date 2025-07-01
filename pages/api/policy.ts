// pages/api/policy.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  S3Client,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: { accessKeyId: 'testuser', secretAccessKey: 'testsecret' },
  forcePathStyle: true,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bucket } = req.method === 'GET' ? req.query : req.body

  if (!bucket) {
    return res.status(400).json({ ok: false, error: { message: 'Missing bucket' } })
  }

  try {
    if (req.method === 'GET') {
      const data = await s3.send(new GetBucketPolicyCommand({ Bucket: String(bucket) }))
      return res.status(200).json({ ok: true, data: { Policy: JSON.parse(data.Policy as string) } })
    }

    if (req.method === 'PUT') {
      const { policy } = req.body
      if (!policy) throw new Error('Missing policy')
      await s3.send(
        new PutBucketPolicyCommand({
          Bucket: String(bucket),
          Policy: JSON.stringify(policy),
        })
      )
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end('Method Not Allowed')
  } catch (e: any) {
    // If no policy set, AWS returns an error, treat as no policy
    if (e.Code === 'NoSuchBucketPolicy' || /no such/i.test(e.message)) {
      return res.status(200).json({ ok: true, data: { Policy: {} } })
    }
    return res.status(500).json({ ok: false, error: { message: e.message } })
  }
}
