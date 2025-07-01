// pages/api/test-s3-connection.ts
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, region, accessKeyId, secretAccessKey, sessionToken } = req.body;

  try {
    const client = new S3Client({
      endpoint: endpoint || undefined, // Use default AWS endpoint if not provided
      region: region || process.env.AWS_REGION || 'us-west-2',
      credentials: {
        accessKeyId: accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: sessionToken || undefined, // Include only if provided
      },
      forcePathStyle: true,
    });

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