// pages/api/test.ts
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: {
      accessKeyId: 'testuser',
      secretAccessKey: 'testsecret',
    },
    forcePathStyle: true,
  });
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    res.status(200).json(data.Buckets);
  } catch (err) {
    res.status(500).json({ error: err.message, detail: err });
  }
}