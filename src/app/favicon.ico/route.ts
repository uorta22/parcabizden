import { NextResponse } from 'next/server'

// favicon.ico → /icon yönlendir (Next.js icon.tsx tarafından üretiliyor)
export async function GET() {
  return NextResponse.redirect(new URL('/icon', 'https://parcabizden.com.tr'), 301)
}
