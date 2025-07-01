// pages/api/test.ts
import { getS3Client } from '@/clients/s3';
import {Bucket, ListBucketsCommand } from '@aws-sdk/client-s3';
import { NextApiRequest } from 'next';

export default async function handler(req: NextApiRequest, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: Bucket[] | undefined): void; new(): any; }; }; }) {
  let s3
  try {
    s3 = getS3Client(req)
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: { message: e.message } })
  }
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    res.status(200).json(data.Buckets);
  } catch (err) {
    res.status(500).json({ error: err.message, detail: err });
  }
}