// pages/api/s3.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  S3Client,
  ListBucketsCommand, ListObjectsV2Command, GetObjectCommand,
  CreateBucketCommand, DeleteBucketCommand, PutObjectCommand,
  DeleteObjectCommand, HeadBucketCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: { accessKeyId: 'testuser', secretAccessKey: 'testsecret' },
  forcePathStyle: true,
})

/* ───── tiny util ───── */
const stamp = () => new Date().toISOString().replace('T', ' ').replace('Z', '')

/* success + error helpers (log inside) */
const ok = (res: NextApiResponse, data: any = null, code = 200) => {
  console.log(`${stamp()} ↩︎ ${code}`, JSON.stringify(data).slice(0, 200))
  return res.status(code).json({ ok: true, data })
}
const fail = (
  res: NextApiResponse,
  message: string,
  code: string,
  http = 400
) => {
  console.error(`${stamp()} ↩︎ ${http} ${code}: ${message}`)
  return res.status(http).json({ ok: false, error: { code, message } })
}

/* ───── handler ───── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  /* request log */
  console.log(`${stamp()} → ${req.method} ${req.url}`,
    req.method === 'GET' ? req.query : req.body)

  try {
    /* ---------- GET ---------- */
    if (req.method === 'GET') {
      const { bucket, prefix, key } = req.query
      /* … unchanged logic … */
      /* key+bucket */
      if (key && bucket) {
        const d = await s3.send(new GetObjectCommand({ Bucket: String(bucket), Key: String(key) }))
        const body = await (d.Body as any).transformToString()
        return ok(res, { body })
      }
      /* bucket listing */
      if (bucket) {
        const objs = await s3.send(new ListObjectsV2Command({
          Bucket: String(bucket),
          Prefix: prefix ? String(prefix) : undefined,
          Delimiter: '/',
        }))
        return ok(res, objs)
      }
      /* buckets */
      const bs = await s3.send(new ListBucketsCommand({}))
      return ok(res, bs)
    }

    /* ---------- POST ---------- */
    if (req.method === 'POST') {
      const { bucket, folder, body } = req.body
      /* … unchanged logic … */
      if (bucket && !folder) {
        try { await s3.send(new HeadBucketCommand({ Bucket: bucket })) }
        catch {}
        try {
          await s3.send(new CreateBucketCommand({ Bucket: bucket }))
          return ok(res, { message: `Bucket "${bucket}" created` })
        } catch (e: any) {
          return fail(res, e.message, e.name ?? 'CreateBucketError', 409)
        }
      }
      if (bucket && folder) {
        const isFolder = !body
        const key = isFolder ? (folder.endsWith('/') ? folder : `${folder}/`) : folder
        await s3.send(new PutObjectCommand({
          Bucket: bucket, Key: key, Body: isFolder ? '' : body,
        }))
        return ok(res, {
          message: isFolder ? `Folder "${folder}" created`
                            : `File "${folder}" created`,
        })
      }
      return fail(res, 'Missing bucket or folder parameter', 'BadRequest', 400)
    }

    /* ---------- DELETE ---------- */
    if (req.method === 'DELETE') {
      const { bucket, folder, key } = req.query
      /* bucket */
      if (bucket && !folder && !key) {
        try {
          await s3.send(new DeleteBucketCommand({ Bucket: String(bucket) }))
          return ok(res, { message: `Bucket "${bucket}" deleted` })
        } catch (e: any) {
          return fail(res, e.message, e.name ?? 'DeleteBucketError', 400)
        }
      }
      /* folder */
      if (bucket && folder) {
        const pref = String(folder).endsWith('/') ? String(folder) : `${folder}/`
        const objs = await s3.send(new ListObjectsV2Command({
          Bucket: String(bucket), Prefix: pref,
        }))
        if (objs.Contents?.length) {
          for (const o of objs.Contents)
            if (o.Key) await s3.send(new DeleteObjectCommand({ Bucket: String(bucket), Key: o.Key }))
        }
        return ok(res, { message: `Folder "${folder}" deleted` })
      }
      /* file */
      if (bucket && key) {
        await s3.send(new DeleteObjectCommand({ Bucket: String(bucket), Key: String(key) }))
        return ok(res, { message: `File "${key}" deleted` })
      }
      return fail(res, 'Missing parameters', 'BadRequest', 400)
    }

    /* ---------- unsupported ---------- */
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    console.warn(`${stamp()} ↩︎ 405 Method Not Allowed`)
    return res.status(405).end('Method Not Allowed')
  } catch (e: any) {
    return fail(res, e.message, e.name ?? 'ServerError', 500)
  }
}
