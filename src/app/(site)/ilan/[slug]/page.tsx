/**
 * İlan Detay — alıcı sitesinde tekil ilan sayfası.
 *
 * URL: /ilan/[slug]
 *
 * Sunucu bileşeni: veriler build sırasında değil istek anında (revalidate:120)
 * çekilir, böylece arama motorları tam HTML görür ve `notFound()` doğrudan
 * çalışır. /parca/[oem]'in tersine burada istemci tarafı state gerekmiyor —
 * galeri ve rozetler statik olarak render edilebiliyor.
 */

import type { LucideIcon } from 'lucide-react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Package, MessageCircle, CheckCircle2, AlertTriangle, Clock, Truck, MapPin } from 'lucide-react'
import { getListingDetail, listingDetailImageUrl, type ListingDetail, type FitmentSource } from '@/lib/listing-detail'

interface Props {
  params: { slug: string }
}

const CONDITION_LABELS: Record<string, string> = {
  cikma: 'Çıkma',
  sifir: 'Sıfır',
  yenilenmis: 'Yenilenmiş',
}

const SHIPPING_LABELS: Record<string, string> = {
  buyer: 'Kargo: Alıcı öder',
  seller: 'Kargo: Satıcı öder',
  negotiable: 'Kargo: Pazarlıklı',
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListingDetail(params.slug)
  if (!listing) notFound()

  const conditionLabel = CONDITION_LABELS[listing.condition_type] ?? listing.condition_type
  const shippingLabel = SHIPPING_LABELS[listing.shipping_payer] ?? null
  const images = listing.images
  const cover = images[0] ? listingDetailImageUrl(images[0]) : null
  const thumbnails = images.slice(1, 13)

  const priceLabel = formatPrice(listing)
  const fitment = getFitmentBadge(listing.fitment_source, listing.vehicle_label)
  const freshnessLabel = getFreshnessLabel(listing.last_confirmed_at)

  const waMessage = `Merhaba, "${listing.title}" ilanınız hakkında bilgi almak istiyorum.${listing.oem_number ? ` (OEM: ${listing.oem_number})` : ''}`
  const sellerContact = listing.seller_whatsapp || listing.seller_phone
  const sellerWaUrl = sellerContact
    ? `https://wa.me/${toWhatsAppNumber(sellerContact)}?text=${encodeURIComponent(waMessage)}`
    : null

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary-600">Anasayfa</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <Link href="/ilanlar" className="hover:text-primary-600">İlanlar</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-gray-700 font-medium truncate">{listing.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* SOL: Görsel galeri */}
          <section className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {cover ? (
                <Image
                  src={cover}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
                  <Package className="h-16 w-16" />
                  <span className="text-xs">Görsel yok</span>
                </div>
              )}

              {/* Uyum rozeti — sayfanın en önemli parçası, görsel üzerinde göze çarpsın */}
              <div
                className={`absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold shadow-md ${fitment.badgeClass}`}
              >
                <fitment.Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{fitment.label}</span>
              </div>
            </div>

            {thumbnails.length > 0 && (
              <div className="grid grid-cols-6 gap-2">
                {thumbnails.map((img, i) => (
                  <div key={img} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <Image
                      src={listingDetailImageUrl(img)}
                      alt={`${listing.title} — görsel ${i + 2}`}
                      fill
                      sizes="120px"
                      className="object-contain p-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SAĞ: Bilgi + CTA */}
          <section>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
              {listing.title}
            </h1>
            {listing.vehicle_label && (
              <p className="mt-1 text-sm text-gray-500">{listing.vehicle_label}</p>
            )}

            {/* Uyum rozeti — detaylı açıklama */}
            <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${fitment.cardClass}`}>
              <fitment.Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${fitment.iconClass}`} />
              <div>
                <p className={`text-sm font-bold ${fitment.textClass}`}>{fitment.label}</p>
                <p className="mt-0.5 text-xs text-gray-600">{fitment.description}</p>
              </div>
            </div>

            {/* Fiyat */}
            <div className="mt-4">
              <span className="text-2xl font-black text-gray-900">{priceLabel}</span>
            </div>

            {/* Durum / stok / kargo rozetleri */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                <Package className="h-3.5 w-3.5" /> {conditionLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                {listing.quantity} adet stok
              </span>
              {shippingLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <Truck className="h-3.5 w-3.5" /> {shippingLabel}
                </span>
              )}
            </div>

            {/* Tazelik — teyit edilmiş ilan sinyali, rakipte yok */}
            {freshnessLabel && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <Clock className="h-3.5 w-3.5" /> {freshnessLabel}
              </p>
            )}

            {listing.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {listing.description}
              </p>
            )}

            {/* Satıcı kartı */}
            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{listing.seller_name}</p>
                  {(listing.district_name || listing.city_name) && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {[listing.district_name, listing.city_name].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                {listing.median_response_minutes !== null && (
                  <span className="whitespace-nowrap rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Ortalama yanıt: {listing.median_response_minutes} dk
                  </span>
                )}
              </div>

              {sellerWaUrl && (
                <a
                  href={sellerWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#22c55e] py-3.5 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-[#16a34a] hover:shadow-lg"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp ile Ulaş
                </a>
              )}
            </section>

            {/* İlan özellikleri */}
            <section className="mt-4 rounded-xl border border-gray-200 bg-white">
              <header className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold text-gray-900">İlan Özellikleri</h2>
              </header>
              <dl className="divide-y divide-gray-100">
                <SpecRow label="Parça" value={listing.part_label} highlight />
                {listing.oem_number && (
                  <SpecRow label="OEM Numarası" value={<span className="font-mono">{listing.oem_number}</span>} highlight />
                )}
                <SpecRow label="Durum" value={conditionLabel} />
                <SpecRow label="Stok" value={`${listing.quantity} adet`} />
                {shippingLabel && <SpecRow label="Kargo" value={shippingLabel} />}
              </dl>
            </section>
          </section>
        </div>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function formatPrice(listing: ListingDetail): string {
  if (listing.price) return `${Number(listing.price).toLocaleString('tr-TR')} ₺`
  if (listing.price_min && listing.price_max) {
    return `${Number(listing.price_min).toLocaleString('tr-TR')} – ${Number(listing.price_max).toLocaleString('tr-TR')} ₺`
  }
  return 'Fiyat bilgisi eksik'
}

interface FitmentBadge {
  label: string
  description: string
  Icon: LucideIcon
  badgeClass: string
  cardClass: string
  iconClass: string
  textClass: string
}

/**
 * Uyum kaynağını rozete çevirir. catalog_verified/vin_verified katalogdan
 * doğrulanmış sayılır (yeşil); seller_declared satıcı beyanıdır (amber uyarı).
 * Rakip uyum doğrulama sorumluluğunu alıcıya bırakıyor — biz kaynağı gösteriyoruz.
 */
function getFitmentBadge(source: FitmentSource, vehicleLabel: string | null): FitmentBadge {
  if (source === 'catalog_verified' || source === 'vin_verified') {
    return {
      label: vehicleLabel ? `${vehicleLabel} için uyum doğrulandı` : 'Uyum doğrulandı',
      description:
        source === 'vin_verified'
          ? 'Satıcı bu parçayı şase numaranızla aracınıza eşleştirdi.'
          : 'Satıcı bu parçayı araç kataloğundan seçti, uyum sistem tarafından doğrulandı.',
      Icon: CheckCircle2,
      badgeClass: 'bg-emerald-500 text-white',
      cardClass: 'border-emerald-200 bg-emerald-50',
      iconClass: 'text-emerald-600',
      textClass: 'text-emerald-800',
    }
  }
  return {
    label: vehicleLabel ? `${vehicleLabel} — satıcı beyanı` : 'Uyum satıcı beyanı',
    description: 'Bu ilanın araç uyumu satıcı tarafından beyan edilmiştir, katalogdan doğrulanmamıştır. Kesin uyum için satıcıya danışın.',
    Icon: AlertTriangle,
    badgeClass: 'bg-amber-500 text-white',
    cardClass: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-600',
    textClass: 'text-amber-800',
  }
}

/** "Satıcı X gün önce teyit etti" — rakipte olmayan tazelik sinyali. */
function getFreshnessLabel(lastConfirmedAt: string | null): string | null {
  if (!lastConfirmedAt) return null
  const days = Math.floor((Date.now() - new Date(lastConfirmedAt).getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'Satıcı bugün teyit etti'
  if (days === 1) return 'Satıcı 1 gün önce teyit etti'
  return `Satıcı ${days} gün önce teyit etti`
}

/** Yerel formatı (05XX... ya da 5XX...) wa.me'nin beklediği 90XXXXXXXXXX'e çevirir. */
function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('90')) return digits
  if (digits.startsWith('0')) return `90${digits.slice(1)}`
  return `90${digits}`
}

function SpecRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="text-xs text-gray-500">{label}:</dt>
      <dd className={`text-sm text-right ${highlight ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</dd>
    </div>
  )
}
