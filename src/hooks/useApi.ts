// src/hooks/useApi.ts
import { useCallback } from 'react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type ApiOptions = {
  headers?: Record<string, string>
  body?: any
  [key: string]: any
}

type ApiFunc = <T = any>(url: string, options?: ApiOptions) => Promise<T>

type UseApiReturn = {
  GET: ApiFunc
  POST: ApiFunc
  PUT: ApiFunc
  DELETE: ApiFunc
  PATCH: ApiFunc
}

function buildRequestOptions(method: HttpMethod, options?: ApiOptions): RequestInit {
  const token = sessionStorage.getItem('s3-session-token') || ''
  const headers = new Headers(options?.headers || {})
  headers.set('x-s3-session-token', token)

  let opts: RequestInit = { ...options, method, headers }

  if (method !== 'GET' && options?.body !== undefined) {
    if (typeof options.body === 'string' || options.body instanceof FormData) {
      opts.body = options.body
    } else {
      headers.set('Content-Type', 'application/json')
      opts.body = JSON.stringify(options.body)
    }
  } else {
    // Do not send body or content-type for GET
    delete (opts as any).body
    headers.delete('Content-Type')
  }

  return opts
}

function useApi(): UseApiReturn {
  const request = useCallback<ApiFunc>(
    async (url, options = {}) => {
      const method = (options.method as HttpMethod) || 'GET'
      const req = buildRequestOptions(method, options)
      const res = await fetch(url, req)
      const text = await res.text()
      try {
        return text ? JSON.parse(text) : ({} as any)
      } catch {
        return text as any
      }
    },
    []
  )

  return {
    GET: (url, options) => request(url, { ...options, method: 'GET' }),
    POST: (url, options) => request(url, { ...options, method: 'POST' }),
    PUT: (url, options) => request(url, { ...options, method: 'PUT' }),
    DELETE: (url, options) => request(url, { ...options, method: 'DELETE' }),
    PATCH: (url, options) => request(url, { ...options, method: 'PATCH' }),
  }
}

export default useApi
