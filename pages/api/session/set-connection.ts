// pages/api/session/set-connection.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { accessKeyId, secretAccessKey, sessionToken, region, endpoint } = req.body

  const creds = JSON.stringify({ accessKeyId, secretAccessKey, sessionToken, region, endpoint })

  res.setHeader('Set-Cookie', serialize('s3session', creds, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 30, // 30 minutes
  }))

  res.status(200).json({ ok: true })
}
