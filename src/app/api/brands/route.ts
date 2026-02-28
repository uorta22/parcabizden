import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EXTERNAL_API = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'

export async function GET() {
  try {
    const res = await fetch(`${EXTERNAL_API}/?action=brands`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const raw = await res.json()
    const brands = (raw.brands || []).map((b: { brand_slug: string; brand_name: string }, i: number) => ({
      id: i + 1,
      name: b.brand_name,
      slug: b.brand_slug,
    }))

    return NextResponse.json({ data: brands })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
