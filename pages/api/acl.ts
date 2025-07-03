// pages/api/acl.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  GetObjectAclCommand,
  GetBucketAclCommand,
  PutObjectAclCommand,
  PutBucketAclCommand,
  Grant,
  Grantee,
} from '@aws-sdk/client-s3'
import { getS3 } from '@/clients/s3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bucket, key } = req.method === 'GET' ? req.query : req.body

  if (!bucket) {
    return res.status(400).json({ ok: false, error: { message: 'Missing bucket' } })
  }

  let s3
  try {
    s3 = getS3(req)
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: { message: e.message } })
  }

  try {
    if (req.method === 'GET') {
      const command = key
        ? new GetObjectAclCommand({ Bucket: String(bucket), Key: String(key) })
        : new GetBucketAclCommand({ Bucket: String(bucket) })

      const result = await s3.send(command)
      return res.status(200).json({ ok: true, data: result })
    }

    if (req.method === 'PUT') {
      const { grants, canned, owner } = req.body

      if (canned) {
        const command = key
          ? new PutObjectAclCommand({ Bucket: bucket, Key: key, ACL: canned })
          : new PutBucketAclCommand({ Bucket: bucket, ACL: canned })
        await s3.send(command)
        return res.status(200).json({ ok: true })
      }

      if (!Array.isArray(grants) || grants.length === 0) {
        return res.status(400).json({
          ok: false,
          error: { message: 'Cannot save ACL with no grants.' },
        })
      }

      if (!owner || !owner.ID) {
        return res.status(400).json({
          ok: false,
          error: { message: 'Missing owner information for custom ACL.' },
        })
      }

      const inputGrants: Grant[] = grants.map((g: any): Grant => {
        const grantee: Grantee = { Type: g.Grantee.Type }
        if (g.Grantee.Type === 'Group' && g.Grantee.URI) grantee.URI = g.Grantee.URI
        if (g.Grantee.Type === 'CanonicalUser' && g.Grantee.ID) grantee.ID = g.Grantee.ID
        if (g.Grantee.DisplayName) grantee.DisplayName = g.Grantee.DisplayName

        return { Grantee: grantee, Permission: g.Permission }
      })

      const command = key
        ? new PutObjectAclCommand({
            Bucket: bucket,
            Key: key,
            AccessControlPolicy: { Grants: inputGrants, Owner: owner },
          })
        : new PutBucketAclCommand({
            Bucket: bucket,
            AccessControlPolicy: { Grants: inputGrants, Owner: owner },
          })

      await s3.send(command)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ ok: false, error: { message: 'Method not allowed' } })
  } catch (e: any) {
    console.error('ACL error:', e)
    return res.status(500).json({ ok: false, error: { message: e.message } })
  }
}
