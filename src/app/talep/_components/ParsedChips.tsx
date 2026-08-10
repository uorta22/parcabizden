'use client'

/**
 * ParsedChips — part-parser çıktısını düzenlenebilir chip satırı olarak gösterir.
 *
 * Araç chip'i salt bilgi amaçlıdır (düzeltme: metni değiştir ya da aşağıdaki
 * "Araç Seç" / manuel giriş ile geçersiz kıl). Parça chip'leri tek dokunuşla
 * kaldırılabilir — "Uygula" bu listeden hariç tutulanları satıra eklemez.
 */

import { Car, Wrench, Hash, ScanLine, Loader2, X } from 'lucide-react'
import type { PartGuess, VehicleGuess } from '@/lib/part-parser'

interface Props {
  vehicle: VehicleGuess | null
  vehicleLoading?: boolean
  parts: PartGuess[]
  oemNumber?: string | null
  vin?: string | null
  onRemovePart?: (key: string) => void
}

export default function ParsedChips({ vehicle, vehicleLoading, parts, oemNumber, vin, onRemovePart }: Props) {
  const showVinPending = !!vin && !vehicle && !vehicleLoading
  const hasAnything = vehicle || vehicleLoading || parts.length > 0 || oemNumber || showVinPending
  if (!hasAnything) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {vehicleLoading && (
        <Chip icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />} tone="neutral">
          Şase çözülüyor…
        </Chip>
      )}
      {!vehicleLoading && vehicle && (
        <Chip icon={<Car className="h-3.5 w-3.5" />} tone="primary">
          {vehicle.label}
        </Chip>
      )}
      {showVinPending && (
        <Chip icon={<ScanLine className="h-3.5 w-3.5" />} tone="neutral">
          Şase bulunamadı, {vin} olarak eklenecek
        </Chip>
      )}
      {oemNumber && (
        <Chip icon={<Hash className="h-3.5 w-3.5" />} tone="neutral">
          OEM {oemNumber}
        </Chip>
      )}
      {parts.map(p => (
        <Chip
          key={p.key}
          icon={<Wrench className="h-3.5 w-3.5" />}
          tone="primary"
          onRemove={onRemovePart ? () => onRemovePart(p.key) : undefined}
        >
          {p.label}
        </Chip>
      ))}
    </div>
  )
}

function Chip({
  icon, tone, onRemove, children,
}: { icon: React.ReactNode; tone: 'primary' | 'neutral'; onRemove?: () => void; children: React.ReactNode }) {
  const toneClass = tone === 'primary'
    ? 'border-primary-200 bg-primary-50 text-primary-700'
    : 'border-gray-200 bg-gray-50 text-gray-600'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClass}`}>
      {icon}
      {children}
      {onRemove && (
        <button
          type="button" onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 text-current/60 hover:bg-black/5"
          aria-label="Kaldır"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
