/**
 * Logo — ParçaBizden Wordmark + Monogram varyantları.
 *
 * Tasarım sistemi kaynağı: parcabizden-design/Logo Variants.html
 *   • Wordmark: "parça" + "bizden" (#ff7a1a) + "." → Archivo Black, ana logo
 *   • Monogram: turuncu kare "P" + parçabizden (Space Grotesk) → kompakt
 *   • Mark   : sadece kare "P" (favicon/avatar)
 *
 * Accent color: #ff7a1a (ember orange — eski #f9ac1b'in rafine hali).
 * Tailwind primary-500 ile uyumlu değil; logo özel rengi inline tutuluyor.
 */

import Link from 'next/link'

const ACCENT = '#ff7a1a'

interface LogoProps {
  /** Boyut çarpanı (rem). Default 1 → ~24px x-height. */
  size?: number
  /** Hover/focus ile hafif animasyon */
  interactive?: boolean
  className?: string
}

// ─────────────────────────────────────────────────────────
// Wordmark — ana kullanım (Header desktop)
// ─────────────────────────────────────────────────────────
export function LogoWordmark({ size = 1, interactive = true, className = '' }: LogoProps) {
  return (
    <span
      className={`inline-flex items-baseline font-archivo-black leading-none tracking-[-0.04em] text-gray-900 ${interactive ? 'transition-transform group-hover:-translate-y-0.5' : ''} ${className}`}
      style={{ fontSize: `${size * 1.5}rem` }}
    >
      parça<span style={{ color: ACCENT }}>bizden</span><span style={{ color: ACCENT }}>.</span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Monogram — kompakt (Header mobile, sticky, sosyal)
// ─────────────────────────────────────────────────────────
export function LogoMonogram({ size = 1, interactive = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`flex aspect-square items-center justify-center rounded-[18%] font-archivo-black leading-none tracking-[-0.04em] ${interactive ? 'transition-transform group-hover:-translate-y-0.5' : ''}`}
        style={{
          width: `${size * 2.5}rem`,
          height: `${size * 2.5}rem`,
          background: ACCENT,
          color: '#1a0f00',
          fontSize: `${size * 1.6}rem`,
        }}
        aria-hidden
      >
        P
      </span>
      <span
        className="font-space-grotesk font-semibold leading-none tracking-[-0.02em] text-gray-900"
        style={{ fontSize: `${size * 1.15}rem` }}
      >
        parçabizden
      </span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Mark — sadece kare P (favicon yedeği, avatar)
// ─────────────────────────────────────────────────────────
export function LogoMark({ size = 1, interactive = false, className = '' }: LogoProps) {
  return (
    <span
      className={`flex aspect-square items-center justify-center rounded-[18%] font-archivo-black leading-none tracking-[-0.04em] ${interactive ? 'transition-transform group-hover:-translate-y-0.5' : ''} ${className}`}
      style={{
        width: `${size * 2.5}rem`,
        height: `${size * 2.5}rem`,
        background: ACCENT,
        color: '#1a0f00',
        fontSize: `${size * 1.6}rem`,
      }}
      aria-label="ParçaBizden"
    >
      P
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// LogoLink — Header'da kullanılan default sürüm.
// Mobile'da Monogram, md+ ekranda Wordmark gösterir.
// ─────────────────────────────────────────────────────────
export default function LogoLink({ size = 1, className = '' }: LogoProps) {
  return (
    <Link href="/" className={`group inline-flex items-center ${className}`} aria-label="ParçaBizden — Anasayfa">
      {/* Mobile: kompakt monogram */}
      <span className="md:hidden">
        <LogoMonogram size={size * 0.9} />
      </span>
      {/* Desktop: Archivo Black wordmark */}
      <span className="hidden md:inline-block">
        <LogoWordmark size={size} />
      </span>
    </Link>
  )
}
