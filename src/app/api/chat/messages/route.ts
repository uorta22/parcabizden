import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Rate limiting: 30 req/min per IP
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  rateLimitMap.set(ip, recent)
  if (rateLimitMap.size > 1000) {
    Array.from(rateLimitMap.entries()).forEach(([key, vals]) => {
      const filtered = vals.filter(t => now - t < RATE_LIMIT_WINDOW)
      if (filtered.length === 0) rateLimitMap.delete(key)
      else rateLimitMap.set(key, filtered)
    })
  }
  return true
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { messages: [], error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  const ticketId = req.nextUrl.searchParams.get('ticketId')
  if (!ticketId) {
    return NextResponse.json(
      { messages: [], error: 'ticketId required' },
      { status: 400 }
    )
  }

  if (!API_BASE) {
    return NextResponse.json({ messages: [] })
  }

  try {
    const res = await fetch(
      `${API_BASE}/?action=chat_messages&ticket_id=${encodeURIComponent(ticketId)}`,
      { signal: AbortSignal.timeout(5_000) }
    )

    if (!res.ok) {
      return NextResponse.json({ messages: [] })
    }

    const data = await res.json()
    return NextResponse.json({ messages: data.messages || [] })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}
