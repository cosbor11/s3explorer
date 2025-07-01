// pages/api/cors.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  S3Client,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  DeleteBucketCorsCommand,
} from '@aws-sdk/client-s3'
import { getS3Client } from '@/clients/s3'

function isLikelyLocalStackError(e: any): boolean {
  if (!e || typeof e !== 'object' || !e.message) return false
  return (
    e.message.includes("char '{' is not expected") ||
    e.message.includes('Deserialization error') ||
    e.message.includes('unexpected token')
  )
}



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // For PUT requests, bucket should come from req.body, for GET/DELETE from req.query

  let s3
  try {
    s3 = getS3Client(req)
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: { message: e.message } })
  }

  const method = req.method
  const bucket =
    method === 'PUT' ? req.body?.bucket : req.query?.bucket

  console.log('api/cors handler:', method, { query: req.query, body: req.body })

  if (!bucket) {
    console.log('api/cors fail: Missing bucket')
    return res.status(400).json({ ok: false, error: { message: 'Missing bucket' } })
  }

  if (method === 'GET') {
    try {
      console.log('api/cors GET', { bucket })
      const data = await s3.send(new GetBucketCorsCommand({ Bucket: String(bucket) }))
      const rules = Array.isArray(data.CORSRules) ? data.CORSRules : []
      console.log('api/cors ok:', { CORSRules: rules })
      return res.status(200).json({ ok: true, data: { CORSRules: rules } })
    } catch (e: any) {
      console.log('api/cors error:', e)
      if (
        e.Code === 'NoSuchCORSConfiguration' ||
        e.name === 'NoSuchCORSConfiguration' ||
        /NoSuchCORSConfiguration/.test(e.message)
      ) {
        console.log('api/cors ok: NoSuchCORSConfiguration, returning empty array')
        return res.status(200).json({ ok: true, data: { CORSRules: [] } })
      }
      return res.status(500).json({ ok: false, error: { message: e.message } })
    }
  }

  if (req.method === 'PUT') {
    try {
      let cors = req.body.cors
      if (typeof cors === 'string') cors = JSON.parse(cors)
      console.log('api/cors PUT', { bucket, cors })
      if (Array.isArray(cors) && cors.length === 0) {
        // Clear CORS if rules are empty
        await s3.send(new DeleteBucketCorsCommand({ Bucket: String(bucket) }))
        console.log('api/cors put: cleared')
        return res.status(200).json({ ok: true })
      } else {
        await s3.send(new PutBucketCorsCommand({
          Bucket: String(bucket),
          CORSConfiguration: { CORSRules: Array.isArray(cors) ? cors : [] },
        }))
        console.log('api/cors put ok')
        return res.status(200).json({ ok: true })
      }
    } catch (e: any) {
      console.log('api/cors put error:', e)
      return res.status(400).json({ ok: false, error: { message: e.message } })
    }
  }

  if (req.method === 'DELETE') {
    try {
      console.log('api/cors DELETE', { bucket })
      await s3.send(new DeleteBucketCorsCommand({ Bucket: String(bucket) }))
      console.log('api/cors delete ok')
      return res.status(200).json({ ok: true })
    } catch (e: any) {
      const msg = e?.message || ''
      const isLocalstack = msg.includes("char '{' is not expected") || msg.includes('Deserialization error')
      if (isLocalstack) {
        console.warn('[cors-delete] localstack warning suppressed:', msg)
        return res.status(200).json({ ok: true, warning: msg })
      }

      console.log('api/cors delete error:', e)
      return res.status(400).json({ ok: false, error: { message: msg } })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  console.log('api/cors fail: Method Not Allowed', method)
  return res.status(405).end('Method Not Allowed')
}
