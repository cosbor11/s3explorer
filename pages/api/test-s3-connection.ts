// pages/api/test-s3-connection.ts
import { getS3ClientUsingCreds } from '@/clients/s3';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, region, accessKeyId, secretAccessKey } = req.body;

  try {
    const client = getS3ClientUsingCreds(region, endpoint, accessKeyId, secretAccessKey)
    const data = await client.send(new ListBucketsCommand({}));
    res.status(200).json({ success: true, buckets: data.Buckets });
  } catch (err: any) {
    console.error('AWS Error:', err);
    res.status(400).json({
      error: err?.message || 'Unknown error',
      name: err?.name,
    });
  }
}