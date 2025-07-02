// pages/api/s3.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3'
import { getS3ClientFromRequest, getS3Client } from '@/clients/s3'
import { S3Connection } from '@/contexts/S3ConnectionContext'

/* ───────── helpers ───────── */
const ok = (res: NextApiResponse, data: any = null, code = 200) => {
  console.log('api/s3 ok:', { code, data: typeof data === 'object' && data !== null ? Object.keys(data) : data })
  return res.status(code).json({ ok: true, data })
}

const fail = (
  res: NextApiResponse,
  message: string,
  code: string,
  http = 400
) => {
  console.error('api/s3 fail:', { code, message, http })
  return res.status(http).json({ ok: false, error: { code, message } })
}

async function getRegionAdjustedClient(conn: S3Connection, bucket: string) {
  const client = getS3Client(conn)
  const result = await client.send(new GetBucketLocationCommand({ Bucket: bucket }))

  let region = result.LocationConstraint || 'us-east-1'
  if (region === 'EU') region = 'eu-west-1'
  return getS3Client({ ...conn, region })
}

/* ───────── handler ───────── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('api/s3 handler:', req.method, { query: req.query, body: req.body })
  try {
    const s3 = getS3ClientFromRequest(req)
    const s3Conn = JSON.parse(req.headers['x-s3-session-token']?.toString() || '{}') as S3Connection

    if (req.method === 'GET') {
      const { bucket, prefix, key } = req.query
      console.log('api/s3 GET', { bucket, prefix, key })

      if (key && bucket) {
        const adjustedClient = await getRegionAdjustedClient(s3Conn, String(bucket))
        const obj = await adjustedClient.send(
          new GetObjectCommand({ Bucket: String(bucket), Key: String(key) })
        )

        if (req.query.base64 === '1') {
          const bytes = await (obj.Body as any).transformToByteArray()
          const base64 = Buffer.from(bytes).toString('base64')
          return ok(res, { base64 })
        }

        const body = await (obj.Body as any).transformToString()
        return ok(res, { body })
      }

      if (bucket) {
        const adjustedClient = await getRegionAdjustedClient(s3Conn, String(bucket))
        const objs = await adjustedClient.send(
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

    if (req.method === 'POST') {
      const { bucket, folder, body } = req.body
      if (bucket && !folder) {
        try {
          await s3.send(new HeadBucketCommand({ Bucket: bucket }))
        } catch {}
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
            ? Buffer.from(req.body.body, 'base64')
            : req.body.body

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
        const adjustedClient = await getRegionAdjustedClient(s3Conn, String(bucket))
        const pref = String(folder).endsWith('/') ? String(folder) : `${folder}/`
        const objs = await adjustedClient.send(
          new ListObjectsV2Command({
            Bucket: String(bucket),
            Prefix: pref,
          })
        )
        if (objs.Contents?.length) {
          for (const o of objs.Contents) {
            if (o.Key) {
              await adjustedClient.send(
                new DeleteObjectCommand({
                  Bucket: String(bucket),
                  Key: o.Key,
                })
              )
            }
          }
        }
        return ok(res, { message: `Folder "${folder}" deleted` })
      }

      if (bucket && key) {
        const adjustedClient = await getRegionAdjustedClient(s3Conn, String(bucket))
        await adjustedClient.send(
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
    console.error('api/s3 error:', { message: e.message, name: e.name, stack: e.stack })
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
