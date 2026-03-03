'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronRight, Copy, Check, MessageCircle, Loader2, Package, AlertCircle, Car, Wrench, Info, CheckCircle2 } from 'lucide-react'
import { searchOemParts } from '@/lib/api'
import type { OemSearchResult } from '@/lib/api'
import { getWhatsAppUrl } from '@/lib/config'
import { getProductByOem } from '@/lib/products'
import type { ShopProduct } from '@/types/shop'
import { BrandLogo } from '@/components/BrandLogos'
import { CategoryIcon } from '@/components/CategoryIcons'
import { findPartSpec } from '@/data/part-descriptions'
import { findBrandGroup, formatBrandSlug, parseGenerationSlug } from '@/lib/brand-groups'

// ── OEM Kopyala Butonu ──
function OemCopyBadge({ oem, large }: { oem: string; large?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(oem)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-2 border rounded-lg font-mono transition-all hover:border-primary-400 ${
        large
          ? 'px-4 py-2.5 bg-gray-50 border-gray-200 text-base text-gray-700 hover:text-gray-900'
          : 'px-2.5 py-1.5 bg-gray-100 border-gray-200 text-xs text-gray-600 hover:text-gray-900'
      }`}
      title="OEM numarasını kopyala"
    >
      <span className="tracking-wider">{oem}</span>
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  )
}

// ── Kategori adlarını ID'den çeviren map ──
const CATEGORY_NAMES: Record<string, string> = {
  engine: 'Motor',
  turbo_intake: 'Turbo & Emme',
  fuel: 'Yakıt Sistemi',
  exhaust: 'Egzoz',
  transmission: 'Şanzıman',
  brake: 'Fren',
  suspension: 'Süspansiyon',
  wheel_tyre: 'Jant & Lastik',
  body_exterior: 'Kaporta & Dış',
  glass_mirror: 'Cam & Ayna',
  lighting: 'Aydınlatma',
  electrical: 'Elektrik',
  climate: 'Klima & Isıtma',
  interior: 'İç Aksam',
  audio_media: 'Ses & Medya',
  tow_transport: 'Çeki & Taşıma',
  other: 'Diğer',
}

function PartDetailContent() {
  const params = useParams()
  const searchParams = useSearchParams()

  const oem = decodeURIComponent(params.oem as string)
  const brand = searchParams.get('brand') || ''
  const gen = searchParams.get('gen') || ''
  const marka = searchParams.get('marka') || ''
  const modelName = searchParams.get('model_name') || ''
  const catId = searchParams.get('cat') || ''
  const catName = searchParams.get('cat_name') || ''
  const node = searchParams.get('node') || ''
  const nodeName = searchParams.get('node_name') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allResults, setAllResults] = useState<OemSearchResult[]>([])
  const [partName, setPartName] = useState('')
  const [shopProduct, setShopProduct] = useState<ShopProduct | null>(null)

  // searchOemParts ile tüm uyumlu araçları getir + shop product check
  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      searchOemParts(oem).catch(() => ({ results: [] })),
      getProductByOem(oem).catch(() => null),
    ])
      .then(([data, product]) => {
        const results = data.results || []
        setAllResults(results)
        setShopProduct(product)
        const match = results.find(r => r.oem_number === oem)
        if (match) {
          setPartName(match.name)
        } else if (results.length > 0) {
          setPartName(results[0].name)
        }
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Veri yüklenirken hata oluştu'))
      .finally(() => setLoading(false))
  }, [oem])

  // Uyumlu markaları grupla
  const brandGroups = useMemo(() => {
    const map = new Map<string, OemSearchResult[]>()
    for (const r of allResults) {
      if (!r.brand_slug) continue
      const existing = map.get(r.brand_slug) || []
      existing.push(r)
      map.set(r.brand_slug, existing)
    }
    return map
  }, [allResults])

  const brandSlugs = useMemo(() => Array.from(brandGroups.keys()).sort(), [brandGroups])
  const groupLabel = useMemo(() => findBrandGroup(brandSlugs), [brandSlugs])

  // Uyumlu modeller tablosu
  const modelRows = useMemo(() => {
    return allResults.map(r => {
      const parsed = parseGenerationSlug(r.generation_slug || '')
      return {
        brand: formatBrandSlug(r.brand_slug || ''),
        brandSlug: r.brand_slug || '',
        model: parsed.model,
        chassis: parsed.chassis,
        year: parsed.year,
        genSlug: r.generation_slug || '',
        nodeName: r.node_name_en || '',
      }
    })
  }, [allResults])

  // Kategori ve node bilgisi
  const displayCatName = catName || (catId ? CATEGORY_NAMES[catId] || catId : '')
  const displayNodeName = nodeName || node || ''
  const displayPartName = partName || oem

  // WhatsApp mesajı
  const whatsappMessage = `Merhaba, aşağıdaki parça için fiyat bilgisi almak istiyorum.\n\nParça: ${displayPartName}\nOEM No: ${oem}${marka ? `\nAraç: ${marka} ${modelName}` : ''}${displayCatName ? `\nKategori: ${displayCatName}` : ''}${displayNodeName ? `\nGrup: ${displayNodeName}` : ''}`

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <Link href="/parcalar" className="hover:text-gray-900 transition-colors">Parçalar</Link>
          {marka && (
            <>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <Link
                href={`/parcalar?brand=${brand}&gen=${gen}&marka=${encodeURIComponent(marka)}&model_name=${encodeURIComponent(modelName)}`}
                className="hover:text-gray-900 transition-colors"
              >
                {marka} {modelName}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-gray-900 font-medium">{oem}</span>
        </nav>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-500 text-sm">Parça bilgileri yükleniyor...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="max-w-5xl mx-auto space-y-8">

            {/* ── Parça Başlığı ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{displayPartName}</h1>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <OemCopyBadge oem={oem} large />
                      {displayCatName && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {catId && <CategoryIcon id={catId} className="text-gray-400" size={14} stroke={2} />}
                          {displayCatName}
                        </span>
                      )}
                      {displayNodeName && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          {displayNodeName}
                        </span>
                      )}
                    </div>

                    {/* Araç bilgisi */}
                    {marka && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                        <Car className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className="text-sm text-primary-700 font-medium">{marka} {modelName}</span>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp CTA */}
                  <a
                    href={getWhatsAppUrl(whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex-shrink-0 shadow-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp ile Fiyat Al
                  </a>
                </div>
              </div>
            </div>

            {/* ── E-Magaza Baglantisi ── */}
            {shopProduct && (
              <Link
                href={`/urun/${shopProduct.slug}`}
                className="block bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200 rounded-2xl p-5 hover:border-primary-400 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/30 transition-colors">
                    <Package className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-primary-700 font-semibold text-sm mb-0.5">Bu urun e-magazamizda mevcut!</p>
                    <p className="text-primary-600/70 text-xs">{shopProduct.name}{shopProduct.price ? ` — ${shopProduct.discount_price || shopProduct.price} TL` : ''}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary-400 group-hover:text-primary-600 flex-shrink-0 transition-colors" />
                </div>
              </Link>
            )}

            {/* ── Uyumlu Markalar ── */}
            {brandSlugs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Car className="w-4.5 h-4.5 text-primary-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Uyumlu Markalar</h2>
                        <p className="text-xs text-gray-500">Bu OEM numaralı parça aşağıdaki markalarda kullanılır</p>
                      </div>
                    </div>
                    {groupLabel && (
                      <span className="hidden sm:inline-flex px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-medium">
                        {groupLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {groupLabel && (
                    <div className="mb-4 sm:hidden">
                      <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-medium">
                        {groupLabel}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {brandSlugs.map(slug => {
                      const formatted = formatBrandSlug(slug)
                      const count = brandGroups.get(slug)?.length || 0
                      return (
                        <div
                          key={slug}
                          className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-white transition-all"
                        >
                          <BrandLogo brand={formatted} size={28} />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{formatted}</span>
                            <span className="text-xs text-gray-400 ml-1.5">({count})</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Uyumlu Modeller Tablosu ── */}
            {modelRows.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                      <Wrench className="w-4.5 h-4.5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Uyumlu Modeller</h2>
                      <p className="text-xs text-gray-500">{modelRows.length} farklı araç-nesil kombinasyonu</p>
                    </div>
                  </div>
                </div>

                {/* Tablo — Masaüstü */}
                <div className="hidden md:block overflow-x-auto max-h-[320px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marka</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kasa Kodu</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Grup</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {modelRows.map((row, i) => (
                        <tr key={`${row.brandSlug}-${row.genSlug}-${i}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <BrandLogo brand={row.brand} size={22} />
                              <span className="text-sm font-medium text-gray-900">{row.brand}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-gray-700">{row.model}</td>
                          <td className="px-6 py-3.5">
                            {row.chassis ? (
                              <span className="inline-flex px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-600">{row.chassis}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-500">{row.nodeName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Kartlar — Mobil */}
                <div className="md:hidden divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
                  {modelRows.map((row, i) => (
                    <div key={`${row.brandSlug}-${row.genSlug}-${i}`} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BrandLogo brand={row.brand} size={20} />
                        <span className="text-sm font-semibold text-gray-900">{row.brand}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        <div>
                          <span className="text-xs text-gray-400">Model</span>
                          <p className="text-gray-700">{row.model}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Kasa Kodu</span>
                          <p className="text-gray-700 font-mono text-xs">{row.chassis || '—'}</p>
                        </div>
                        {row.nodeName && (
                          <div>
                            <span className="text-xs text-gray-400">Grup</span>
                            <p className="text-gray-700 text-xs">{row.nodeName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Teknik Özellikler ── */}
            {(() => {
              const spec = findPartSpec(displayPartName, catId || undefined)
              if (!spec) return (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Info className="w-4.5 h-4.5 text-purple-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Teknik Özellikler</h2>
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm mb-3">Bu parçanın teknik özellikleri için bizimle iletişime geçin.</p>
                    <a
                      href={getWhatsAppUrl(`Merhaba, ${oem} OEM numaralı "${displayPartName}" parçasının teknik özelliklerini öğrenmek istiyorum.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600 rounded-xl text-sm font-medium transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp ile Sor
                    </a>
                  </div>
                </div>
              )
              return (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Info className="w-4.5 h-4.5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Teknik Özellikler</h2>
                        <p className="text-xs text-gray-500">{spec.title}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{spec.description}</p>
                    {spec.specs.length > 0 && (
                      <ul className="space-y-2">
                        {spec.specs.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* ── Alt CTA ── */}
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-gray-900 font-bold text-base mb-1">Aradığınız parçayı bulamadınız mı?</h4>
                <p className="text-gray-500 text-sm">WhatsApp&apos;tan talep gönderin, size en uygun parçayı bulalım.</p>
              </div>
              <a
                href={getWhatsAppUrl('Merhaba, bir parça arıyorum ama bulamadım. Yardımcı olur musunuz?')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Talep Oluştur
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default function PartDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PartDetailContent />
    </Suspense>
  )
}
