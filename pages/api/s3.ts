// pages/api/s3.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: { accessKeyId: 'testuser', secretAccessKey: 'testsecret' },
  forcePathStyle: true,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { bucket, prefix, key } = req.query
      if (key && bucket) {
        const d = await s3.send(new GetObjectCommand({ Bucket: String(bucket), Key: String(key) }))
        const body = await (d.Body as any).transformToString()
        return res.status(200).json({ body })
      }
      if (bucket) {
        const objs = await s3.send(new ListObjectsV2Command({ Bucket: String(bucket), Prefix: prefix ? String(prefix) : undefined, Delimiter: '/' }))
        return res.status(200).json(objs)
      }
      const bs = await s3.send(new ListBucketsCommand({}))
      return res.status(200).json(bs)
    }

    if (req.method === 'POST') {
      const { bucket, folder, body } = req.body
      if (bucket && !folder) {
        try { await s3.send(new HeadBucketCommand({ Bucket: bucket })); return res.status(409).json({ error: `Bucket "${bucket}" already exists` }) } catch {}
        await s3.send(new CreateBucketCommand({ Bucket: bucket }))
        return res.status(200).json({ message: `Bucket "${bucket}" created` })
      }
      if (bucket && folder) {
        const isFolder = !body
        const key = isFolder ? (folder.endsWith('/') ? folder : `${folder}/`) : folder
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: isFolder ? '' : body }))
        return res.status(200).json({ message: isFolder ? `Folder "${folder}" created` : `File "${folder}" created` })
      }
      return res.status(400).json({ error: 'Missing bucket or folder parameter' })
    }

    if (req.method === 'DELETE') {
      const { bucket, folder, key } = req.query

      if (bucket && !folder && !key) {
        await s3.send(new DeleteBucketCommand({ Bucket: String(bucket) }))
        return res.status(200).json({ message: `Bucket "${bucket}" deleted` })
      }

      if (bucket && folder) {
        const pref = String(folder).endsWith('/') ? String(folder) : `${folder}/`
        const objs = await s3.send(new ListObjectsV2Command({ Bucket: String(bucket), Prefix: pref }))
        if (objs.Contents?.length) {
          for (const o of objs.Contents) if (o.Key) await s3.send(new DeleteObjectCommand({ Bucket: String(bucket), Key: o.Key }))
        }
        return res.status(200).json({ message: `Folder "${folder}" deleted` })
      }

      if (bucket && key) {
        await s3.send(new DeleteObjectCommand({ Bucket: String(bucket), Key: String(key) }))
        return res.status(200).json({ message: `File "${key}" deleted` })
      }

      return res.status(400).json({ error: 'Missing parameters' })
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end('Method Not Allowed')
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
