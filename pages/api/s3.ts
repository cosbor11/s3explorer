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

/* ───────── helpers ───────── */
const ok = (res: NextApiResponse, data: any = null, code = 200) =>
  res.status(code).json({ ok: true, data })

const fail = (
  res: NextApiResponse,
  message: string,
  code: string,
  http = 400
) => res.status(http).json({ ok: false, error: { code, message } })

/* ───────── handler ───────── */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    /* ---------- GET ---------- */
    if (req.method === 'GET') {
      const { bucket, prefix, key } = req.query

      if (key && bucket) {
        const obj = await s3.send(
          new GetObjectCommand({ Bucket: String(bucket), Key: String(key) })
        )

        /* base64?  → used by image preview */
        if (req.query.base64 === '1') {
          const bytes = await (obj.Body as any).transformToByteArray()
          const base64 = Buffer.from(bytes).toString('base64')
          return ok(res, { base64 })
        }

        /* default text body */
        const body = await (obj.Body as any).transformToString()
        return ok(res, { body })
      }

      if (bucket) {
        const objs = await s3.send(
          new ListObjectsV2Command({
            Bucket: String(bucket),
            Prefix: prefix ? String(prefix) : undefined,
            Delimiter: '/',
          })
        )
        return ok(res, objs)
      }

      const bs = await s3.send(new ListBucketsCommand({}))
      return ok(res, bs)
    }

    /* ---------- POST ---------- */
    if (req.method === 'POST') {
      const { bucket, folder, body } = req.body

      if (bucket && !folder) {
        try {
          await s3.send(new HeadBucketCommand({ Bucket: bucket }))
        } catch {
          /* does not exist */
        }

        try {
          await s3.send(new CreateBucketCommand({ Bucket: bucket }))
          return ok(res, { message: `Bucket "${bucket}" created` })
        } catch (e: any) {
          return fail(res, e.message, e.name ?? 'CreateBucketError', 409)
        }
      }

      if (bucket && folder) {
        const isFolder = !body
        const key = isFolder
          ? folder.endsWith('/') ? folder : `${folder}/`
          : folder
        const payload = isFolder
          ? ''
          : req.body.isBase64
            ? Buffer.from(req.body.body, 'base64')   // decode binary
            : req.body.body                          // plain text
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: payload,
          })
        )
        return ok(res, {
          message: isFolder
            ? `Folder "${folder}" created`
            : `File "${folder}" created`,
        })
      }

      return fail(res, 'Missing bucket or folder parameter', 'BadRequest', 400)
    }

    /* ---------- DELETE ---------- */
    if (req.method === 'DELETE') {
      const { bucket, folder, key } = req.query

      if (bucket && !folder && !key) {
        try {
          await s3.send(new DeleteBucketCommand({ Bucket: String(bucket) }))
          return ok(res, { message: `Bucket "${bucket}" deleted` })
        } catch (e: any) {
          return fail(res, e.message, e.name ?? 'DeleteBucketError', 400)
        }
      }

      if (bucket && folder) {
        const pref = String(folder).endsWith('/') ? String(folder) : `${folder}/`
        const objs = await s3.send(
          new ListObjectsV2Command({
            Bucket: String(bucket),
            Prefix: pref,
          })
        )
        if (objs.Contents?.length) {
          for (const o of objs.Contents)
            if (o.Key)
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: String(bucket),
                  Key: o.Key,
                })
              )
        }
        return ok(res, { message: `Folder "${folder}" deleted` })
      }

      if (bucket && key) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: String(bucket),
            Key: String(key),
          })
        )
        return ok(res, { message: `File "${key}" deleted` })
      }

      return fail(res, 'Missing parameters', 'BadRequest', 400)
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).end('Method Not Allowed')
  } catch (e: any) {
    return fail(res, e.message, e.name ?? 'ServerError', 500)
  }
}

/* ───────── increase JSON body limit to 25 MB ───────── */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}
