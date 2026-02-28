import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EXTERNAL_API = 'https://api.parcabizden.com.tr'

export async function GET() {
  try {
    const res = await fetch(`${EXTERNAL_API}/?action=brands`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      console.error(`Brands API error: ${res.status} ${res.statusText}`)
      return NextResponse.json({ data: [] })
    }

    const raw = await res.json()
    const brands = (raw.brands || []).map((b: { brand_slug: string; brand_name: string }, i: number) => ({
      id: i + 1,
      name: b.brand_name,
      slug: b.brand_slug,
    }))

    return NextResponse.json({ data: brands })
  } catch (err) {
    console.error('Brands proxy error:', err)
    return NextResponse.json({ data: [] })
  }
}
