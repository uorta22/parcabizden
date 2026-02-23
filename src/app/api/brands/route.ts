import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EXTERNAL_API = 'https://api.parcabizden.com.tr'

export async function GET() {
  try {
    const res = await fetch(`${EXTERNAL_API}/?action=brands`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const raw = await res.json()
    // PHP returns { brands: [{brand_slug, brand_name, gen_count, part_count}] }
    // Transform to { data: [{id, name, slug}] }
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
