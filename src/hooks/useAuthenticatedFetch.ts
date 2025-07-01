// src/hooks/useAuthenticatedFetch.ts
import { useCallback } from 'react'

function useAuthenticatedFetch() {
  return useCallback(async (input: RequestInfo, init: RequestInit = {}) => {
    const token = sessionStorage.getItem('s3-session-token') || ''
    const headers = new Headers(init.headers || {})
    headers.set('x-s3-session-token', token)

    const res = await fetch(input, {
      ...init,
      headers,
    })

    const json = await res.json()
    return json
  }, [])
}

export default useAuthenticatedFetch
