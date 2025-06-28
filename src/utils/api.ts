export async function api<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const r = await fetch(input, init)
  const j = await r.json()
  if (!j.ok) throw new Error(j.error?.message || 'Unknown error')
  return j.data as T
}
