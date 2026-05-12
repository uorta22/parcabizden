/**
 * Logo — ParçaBizden CHASSIS-BAR Wordmark.
 *
 * Tasarım kaynağı: docs/design/logo-explore.html → logo-1
 *   01 · CHASSIS-BAR WORDMARK
 *   SPACE GROTESK / ACCENT BARS
 *
 * Yapı:
 *   ║ ║ ║   parça·bizden
 *   ▌ ▌ ▌                ← 3 turuncu dikey bar (56 / 38 / 22 px,
 *                          son bar yarı opak — şasi/aks görüntüsü)
 *   parça(siyah) + bizden(turuncu) — Space Grotesk 700, -0.04em
 *
 * Mobile için kompakt versiyon (sadece bars + 'pb') da export edilir.
 */

import Link from 'next/link'

const ACCENT = '#ff7a1a'

interface LogoProps {
  /** Çarpan (1 = ~56px bar, 0.5 = ~28px). */
  size?: number
  /** Hover/focus animasyonu açık mı */
  interactive?: boolean
  /** Açık zemin (varsayılan: false → karanlık metin). Koyu zeminde true → beyaz metin */
  light?: boolean
  className?: string
}

// ─────────────────────────────────────────────────────────
// ChassisBars — 3 kademeli dikey çubuk (logo mark'ı)
// ─────────────────────────────────────────────────────────
function ChassisBars({ size = 1, interactive = true }: { size?: number; interactive?: boolean }) {
  const heights = [56 * size, 38 * size, 22 * size] // px
  const barW = 4 * size
  const gap = 4 * size

  return (
    <span
      aria-hidden
      className={`inline-flex items-end ${interactive ? 'transition-transform group-hover:-translate-y-0.5' : ''}`}
      style={{ gap: `${gap}px`, height: `${heights[0]}px` }}
    >
      <span
        style={{
          width: `${barW}px`,
          height: `${heights[0]}px`,
          background: ACCENT,
          borderRadius: '2px',
        }}
      />
      <span
        style={{
          width: `${barW}px`,
          height: `${heights[1]}px`,
          background: ACCENT,
          borderRadius: '2px',
        }}
      />
      <span
        style={{
          width: `${barW}px`,
          height: `${heights[2]}px`,
          background: ACCENT,
          borderRadius: '2px',
          opacity: 0.5,
        }}
      />
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Wordmark — chassis-bar + Space Grotesk
// ─────────────────────────────────────────────────────────
export function LogoWordmark({ size = 1, interactive = true, light = false, className = '' }: LogoProps) {
  const fg = light ? '#ffffff' : '#111827'
  return (
    <span
      className={`inline-flex items-center font-space-grotesk font-bold leading-none tracking-[-0.04em] ${className}`}
      style={{ color: fg, gap: `${14 * size}px`, fontSize: `${56 * size}px` }}
    >
      <ChassisBars size={size} interactive={interactive} />
      <span>
        parça<span style={{ color: ACCENT }}>bizden</span>
      </span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Monogram (kompakt) — chassis-bars + 'pb' küçük etiket
// Mobile header + sticky için
// ─────────────────────────────────────────────────────────
export function LogoMonogram({ size = 1, interactive = true, light = false, className = '' }: LogoProps) {
  const fg = light ? '#ffffff' : '#111827'
  return (
    <span
      className={`inline-flex items-center font-space-grotesk font-bold leading-none tracking-[-0.04em] ${className}`}
      style={{ color: fg, gap: `${10 * size}px`, fontSize: `${28 * size}px` }}
    >
      <ChassisBars size={size * 0.5} interactive={interactive} />
      <span>
        parça<span style={{ color: ACCENT }}>bizden</span>
      </span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Mark — sadece chassis bars (favicon, avatar, footer)
// ─────────────────────────────────────────────────────────
export function LogoMark({ size = 1, interactive = false, className = '' }: LogoProps) {
  return (
    <span
      aria-label="ParçaBizden"
      className={`inline-flex ${className}`}
    >
      <ChassisBars size={size} interactive={interactive} />
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// LogoLink — Header'da kullanılan default sürüm
//   Mobile: Monogram (chassis ~14px + küçük yazı)
//   md+   : Wordmark (chassis 56px + büyük yazı)
// ─────────────────────────────────────────────────────────
export default function LogoLink({ size = 1, light = false, className = '' }: LogoProps) {
  return (
    <Link href="/" className={`group inline-flex items-center ${className}`} aria-label="ParçaBizden — Anasayfa">
      <span className="md:hidden">
        <LogoMonogram size={size * 0.9} light={light} />
      </span>
      <span className="hidden md:inline-flex">
        <LogoWordmark size={size * 0.55} light={light} />
      </span>
    </Link>
  )
}
