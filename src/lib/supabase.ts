/**
 * Supabase client — browser/client-side için.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY env'lerini bekler.
 * Bu key tarayıcıda çalışacak şekilde dizayn edilmiştir; RLS politikaları
 * her tablomuzda aktif olduğu için yetkilendirme satır seviyesinde sağlanır.
 *
 * Server-side (route handlers, server components) için ayrı bir factory
 * gerekirse `supabase-server.ts` eklenecek — şimdilik client-only.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!URL || !KEY) {
  // Build sırasında uyar ama kırma — env'ler Vercel'de set edildiğinde çalışır.
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL veya _ANON_KEY tanımsız.')
  }
}

export const supabase = createBrowserClient<Database>(
  URL ?? 'https://placeholder.supabase.co',
  KEY ?? 'placeholder-anon-key'
)

export type SupabaseClient = typeof supabase
