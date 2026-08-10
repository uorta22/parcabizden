'use client'

/**
 * Talep yüzeyi girişi — "yaz → yapı çıkar → onayla" akışının ilk adımı.
 *
 * Kullanıcı tek satır yazar (araç + parça, VIN ya da OEM numarası fark
 * etmez — tür otomatik tespit edilir). Ayrıştırma sonucu canlı chip olarak
 * gösterilir; yapı bonus, şart değil — metin boşsa bile "Talebi Oluştur"
 * kullanıcıyı /olustur'a taşır ve orada yapı tekrar kurulup düzenlenir.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, ShieldCheck, Users, Wallet } from 'lucide-react'
import { parseInput, decodeVinVehicle, type VehicleGuess } from '@/lib/part-parser'
import ParsedChips from './_components/ParsedChips'

export default function TalepHome() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [vinVehicle, setVinVehicle] = useState<VehicleGuess | null>(null)
  const [vinLoading, setVinLoading] = useState(false)

  const parsed = useMemo(() => parseInput(query), [query])

  useEffect(() => {
    if (parsed.kind !== 'vin' || !parsed.vin) {
      setVinVehicle(null)
      return
    }
    let active = true
    setVinLoading(true)
    decodeVinVehicle(parsed.vin)
      .then(v => { if (active) setVinVehicle(v) })
      .finally(() => { if (active) setVinLoading(false) })
    return () => { active = false }
  }, [parsed.kind, parsed.vin])

  const canSubmit = query.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    router.push(`/olustur?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <h1 className="text-center text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Yedek Parça Talebi
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-gray-500">
          Aracını ve aradığın parçayı tek satırda yaz — şase numarası ya da OEM kodu da olur.
          Doğrulanmış satıcılar teklifini göndersin. Üyelik gerekmez.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2">
            <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
              placeholder="Örn. e60 530d turbo hortumu, şase no ya da OEM numarası"
              className="w-full bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none"
              autoFocus
            />
          </div>

          {(query.trim().length > 0) && (
            <div className="border-t border-gray-100 px-3 py-3">
              <ParsedChips
                vehicle={parsed.kind === 'vin' ? vinVehicle : parsed.vehicle}
                vehicleLoading={parsed.kind === 'vin' && vinLoading}
                parts={parsed.parts}
                oemNumber={parsed.oemNumber}
                vin={parsed.vin}
              />
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-primary-400 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Talebi Oluştur <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-6 grid gap-2 sm:grid-cols-3">
          <li className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary-500" /> Ücretsiz ve üyeliksiz
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <Users className="h-4 w-4 flex-shrink-0 text-primary-500" /> Onaylı satıcılara ulaşır
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <Wallet className="h-4 w-4 flex-shrink-0 text-primary-500" /> Teklifleri karşılaştır, sen seç
          </li>
        </ul>
      </div>
    </main>
  )
}
