import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Simple in-memory rate limiting: IP → timestamps
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  rateLimitMap.set(ip, recent)
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    Array.from(rateLimitMap.entries()).forEach(([key, vals]) => {
      const filtered = vals.filter(t => now - t < RATE_LIMIT_WINDOW)
      if (filtered.length === 0) rateLimitMap.delete(key)
      else rateLimitMap.set(key, filtered)
    })
  }
  return true
}

const FALLBACK_REPLY = 'Talebiniz alındı! En kısa sürede size dönüş yapacağız.'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.' },
      { status: 429 }
    )
  }

  let body: {
    ticketId?: string
    message?: string
    name?: string
    vehicle?: string
    phone?: string
    vin?: string
    pageUrl?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Geçersiz istek.' },
      { status: 400 }
    )
  }

  const { ticketId, message, name, vehicle, phone, vin, pageUrl } = body

  if (!ticketId || !message?.trim()) {
    return NextResponse.json(
      { success: false, error: 'Mesaj boş olamaz.' },
      { status: 400 }
    )
  }

  // If no backend configured, return fallback
  if (!API_BASE) {
    return NextResponse.json({
      success: true,
      ticketId,
      autoReply: FALLBACK_REPLY,
    })
  }

  try {
    const params = new URLSearchParams()
    params.set('ticket_id', ticketId)
    params.set('message', message.trim())
    if (name) params.set('name', name)
    if (vehicle) params.set('vehicle', vehicle)
    if (phone) params.set('phone', phone)
    if (vin) params.set('vin', vin)
    if (pageUrl) params.set('page_url', pageUrl)

    const backendRes = await fetch(`${API_BASE}/?action=chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10_000),
    })

    if (!backendRes.ok) {
      throw new Error(`Backend returned ${backendRes.status}`)
    }

    const data = await backendRes.json()

    return NextResponse.json({
      success: true,
      ticketId: data.ticket_id || ticketId,
      autoReply: data.auto_reply || FALLBACK_REPLY,
    })
  } catch {
    // Backend unreachable → return fallback
    return NextResponse.json({
      success: true,
      ticketId,
      autoReply: FALLBACK_REPLY,
    })
  }
}
