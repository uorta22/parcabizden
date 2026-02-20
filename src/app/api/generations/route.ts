import { NextRequest, NextResponse } from 'next/server'

const EXTERNAL_API = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand')
  if (!brand) {
    return NextResponse.json({ error: 'brand parametresi gerekli' }, { status: 400 })
  }

  try {
    const url = `${EXTERNAL_API}/?action=generations&brand=${encodeURIComponent(brand)}`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      throw new Error(`External API error: ${res.status}`)
    }

    const data = await res.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Nesil bilgisi alınamadı'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
