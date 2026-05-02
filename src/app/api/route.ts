import { NextRequest, NextResponse } from 'next/server'

const NATRO_API = 'https://api.parcabizden.com.tr'

async function proxy(req: NextRequest): Promise<NextResponse> {
  const qs = req.nextUrl.search
  const targetUrl = `${NATRO_API}/${qs}`

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  const authHeader = req.headers.get('Authorization')
  if (authHeader) headers['Authorization'] = authHeader

  const xrw = req.headers.get('X-Requested-With')
  if (xrw) headers['X-Requested-With'] = xrw

  let body: BodyInit | undefined
  if (req.method === 'POST') {
    headers['Content-Type'] = req.headers.get('Content-Type') || 'application/x-www-form-urlencoded'
    body = await req.text()
  }

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    signal: AbortSignal.timeout(15_000),
  })

  const data = await upstream.text()
  return new NextResponse(data, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export const GET = proxy
export const POST = proxy
