// pages/api/policy-validate.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { S3Client, PutBucketPolicyCommand, DeleteBucketPolicyCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: { accessKeyId: 'testuser', secretAccessKey: 'testsecret' },
  forcePathStyle: true,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const { bucket, policy } = req.body
  if (!bucket || !policy) {
    return res.status(400).json({ ok: false, error: { message: 'Missing bucket or policy' } })
  }

  try {
    // Try to apply the policy, then immediately remove it to avoid persisting changes
    await s3.send(new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: typeof policy === 'string' ? policy : JSON.stringify(policy),
    }))
    await s3.send(new DeleteBucketPolicyCommand({ Bucket: bucket }))

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: { message: e.message || 'Validation failed' } })
  }
}
