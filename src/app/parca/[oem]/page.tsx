'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Copy, Check, MessageCircle, Loader2, Package, AlertCircle,
  Car, Wrench, Info, CheckCircle2, ShoppingCart, Minus, Plus, Heart,
  Shield, Truck, BadgeCheck, ChevronRight,
} from 'lucide-react'
import { searchOemParts } from '@/lib/api'
import type { OemSearchResult, ProductEnrichment } from '@/lib/api'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'
import { BrandLogo, getBrandLogoUrl } from '@/components/BrandLogos'
import { CategoryIcon, getCategoryColor } from '@/components/CategoryIcons'
import { findPartSpec } from '@/data/part-descriptions'
import { findBrandGroup, formatBrandSlug, parseGenerationSlug } from '@/lib/brand-groups'
import { guessOemBrand } from '@/lib/oem-prefix'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Breadcrumb from '@/components/Breadcrumb'
import { favoriteAdd, favoriteRemove } from '@/lib/api'

// ── OEM Kopyala Butonu ──
function OemCopyBadge({ oem }: { oem: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(oem)
      setCopied(true)
      toast('OEM numarası kopyalandı', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast('Kopyalama başarısız — OEM: ' + oem, 'info')
    }
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl font-mono transition-all hover:border-primary-400 hover:shadow-md"
      title="OEM numarasını kopyala"
    >
      <span className="tracking-wider text-sm text-gray-700">{oem}</span>
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  )
}

import { CATEGORY_NAMES } from '@/data/categories'

// ── Fiyat formatlayıcı ──
function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })
}

function PartDetailContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()

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
  const [productInfo, setProductInfo] = useState<ProductEnrichment | null>(null)

  // Sepet ve favori state
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    searchOemParts(oem)
      .then(data => {
        const results = data.results || []
        setAllResults(results)
        const match = results.find(r => r.oem_number === oem)
        if (match) {
          setPartName(match.name)
          if (match.product) setProductInfo(match.product)
        } else if (results.length > 0) {
          setPartName(results[0].name)
          if (results[0].product) setProductInfo(results[0].product)
        }
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Veri yüklenirken hata oluştu'))
      .finally(() => setLoading(false))
  }, [oem])

  // JSON-LD Schema — Product + BreadcrumbList
  useEffect(() => {
    if (loading || !partName) return

    const schemas: object[] = []

    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: partName,
      description: `${partName} - OEM No: ${oem}${marka ? ` | ${marka} ${modelName} uyumlu` : ''}`,
      sku: oem,
      mpn: oem,
      brand: marka ? { '@type': 'Brand', name: marka } : { '@type': 'Brand', name: 'OEM' },
      category: 'Araç Yedek Parça',
      url: window.location.href,
    }
    if (productInfo?.thumbnail) {
      productSchema.image = productInfo.thumbnail
    }
    if (productInfo && productInfo.price != null && productInfo.price > 0) {
      const finalPrice = (productInfo.discount_price != null && productInfo.discount_price < productInfo.price)
        ? productInfo.discount_price
        : productInfo.price
      productSchema.offers = {
        '@type': 'Offer',
        price: finalPrice,
        priceCurrency: 'TRY',
        availability: productInfo.in_stock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: siteConfig.name },
      }
    }
    schemas.push(productSchema)

    const breadcrumbItems = [
      { name: 'Ana Sayfa', url: siteConfig.url },
      { name: 'Parcalar', url: `${siteConfig.url}/parcalar` },
    ]
    if (marka && modelName) {
      breadcrumbItems.push({
        name: `${marka} ${modelName}`,
        url: `${siteConfig.url}/parcalar?brand=${brand}&gen=${gen}&marka=${encodeURIComponent(marka)}&model_name=${encodeURIComponent(modelName)}`,
      })
    }
    breadcrumbItems.push({ name: oem, url: window.location.href })

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    })

    const scriptId = 'part-detail-jsonld'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(schemas)

    return () => {
      const el = document.getElementById(scriptId)
      if (el) el.remove()
    }
  }, [loading, partName, oem, marka, modelName, brand, gen, productInfo])

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

  // OEM prefix'inden marka tahmini (API sonucu boşsa bile)
  const oemGuess = useMemo(() => guessOemBrand(oem), [oem])

  const displayCatName = catName || (catId ? CATEGORY_NAMES[catId] || catId : '')
  const displayNodeName = nodeName || node || ''
  // Parça adı fallback zinciri: API sonucu → marka+kategori → kategori → marka tahmini → ham OEM
  const displayPartName = partName
    || (displayNodeName && (oemGuess?.brand || marka)
      ? `${oemGuess?.brand || marka} ${displayNodeName}`
      : displayNodeName)
    || (oemGuess ? `${oemGuess.brand} Yedek Parça` : oem)

  // Fiyat bilgileri
  const hasPrice = productInfo && (productInfo.price != null && productInfo.price > 0)
  const hasDiscount = hasPrice && productInfo!.discount_price != null && productInfo!.discount_price! < productInfo!.price!
  const displayPrice = hasDiscount ? productInfo!.discount_price! : (productInfo?.price || 0)

  // Görsel: productInfo thumbnail varsa onu kullan, yoksa marka logosu
  const productImage = productInfo?.thumbnail || null
  const primaryBrandSlug = brandSlugs[0] || oemGuess?.brandSlug || ''
  const primaryBrandName = primaryBrandSlug ? formatBrandSlug(primaryBrandSlug) : (marka || oemGuess?.brand || '')
  const brandLogoUrl = primaryBrandName ? getBrandLogoUrl(primaryBrandName) : null

  // Sepete ekle
  const handleAddToCart = () => {
    if (!productInfo || !hasPrice) return
    addItem({
      product_id: String(productInfo.id),
      product_name: displayPartName,
      product_slug: productInfo.slug,
      product_image: productInfo.thumbnail || undefined,
      unit_price: displayPrice,
      has_price: true,
      quantity,
    })
    setAddedToCart(true)
    toast('Ürün sepete eklendi', 'success')
    setTimeout(() => setAddedToCart(false), 2000)
  }

  // Favori toggle
  const handleToggleFavorite = async () => {
    if (!productInfo || !user) return
    setFavLoading(true)
    try {
      if (isFavorite) {
        await favoriteRemove(productInfo.id)
        setIsFavorite(false)
        toast('Favorilerden çıkarıldı', 'info')
      } else {
        await favoriteAdd(productInfo.id)
        setIsFavorite(true)
        toast('Favorilere eklendi', 'success')
      }
    } catch {
      toast('İşlem başarısız oldu', 'error')
    } finally {
      setFavLoading(false)
    }
  }

  // WhatsApp mesajı
  const whatsappMessage = `Merhaba, aşağıdaki parça için ${hasPrice ? 'sipariş vermek' : 'fiyat bilgisi almak'} istiyorum.\n\nParça: ${displayPartName}\nOEM No: ${oem}${marka ? `\nAraç: ${marka} ${modelName}` : ''}${displayCatName ? `\nKategori: ${displayCatName}` : ''}${displayNodeName ? `\nGrup: ${displayNodeName}` : ''}${hasPrice ? `\nFiyat: ${formatPrice(displayPrice)}\nAdet: ${quantity}` : ''}`

  const catGradient = getCategoryColor(catId || 'other')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb
            items={[
              { label: 'Ana Sayfa', href: '/' },
              { label: 'Parçalar', href: '/parcalar' },
              ...(marka ? [{ label: `${marka} ${modelName}`, href: `/parcalar?brand=${brand}&gen=${gen}&marka=${encodeURIComponent(marka)}&model_name=${encodeURIComponent(modelName)}` }] : []),
              { label: oem },
            ]}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Parça bilgileri yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* ── Hero Bölümü ── */}
          <div className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 py-8 md:py-12">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

                  {/* Sol: Görsel */}
                  <div className="relative">
                    <div className="aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 relative">
                      {productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={productImage}
                          alt={displayPartName}
                          className="w-full h-full object-contain p-8"
                        />
                      ) : brandLogoUrl ? (
                        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${catGradient} bg-opacity-5`}
                          style={{ background: `linear-gradient(135deg, rgba(249,250,251,1) 0%, rgba(243,244,246,1) 100%)` }}
                        >
                          <Image
                            src={brandLogoUrl}
                            alt={primaryBrandName}
                            width={120}
                            height={120}
                            className="object-contain opacity-30"
                          />
                          <span className="mt-4 text-sm text-gray-400 font-medium">{primaryBrandName}</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <CategoryIcon id={catId || 'other'} className="text-gray-200" size={80} strokeWidth={1} />
                          <span className="mt-4 text-sm text-gray-300 font-medium">{displayCatName || 'Yedek Parça'}</span>
                        </div>
                      )}

                      {/* Favori butonu */}
                      {user && productInfo && (
                        <button
                          onClick={handleToggleFavorite}
                          disabled={favLoading}
                          className={`absolute top-4 right-4 p-3 rounded-xl transition-all shadow-sm ${
                            isFavorite
                              ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
                              : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200'
                          } ${favLoading ? 'opacity-50' : ''}`}
                        >
                          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      )}

                      {/* İndirim badge */}
                      {hasDiscount && (
                        <span className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-xl shadow-sm">
                          %{Math.round((1 - productInfo!.discount_price! / productInfo!.price!) * 100)} indirim
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sağ: Ürün Bilgileri + Satın Al */}
                  <div className="space-y-6">
                    {/* Kategori + Stok */}
                    <div className="flex flex-wrap items-center gap-2">
                      {displayCatName && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                          {catId && <CategoryIcon id={catId} className="text-gray-400" size={14} strokeWidth={2} />}
                          {displayCatName}
                        </span>
                      )}
                      {displayNodeName && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          {displayNodeName}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        productInfo?.in_stock === true
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : productInfo?.in_stock === false
                            ? 'bg-gray-100 text-gray-500 border border-gray-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {productInfo?.in_stock === true ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Stokta Var</>
                        ) : productInfo?.in_stock === false ? (
                          <><AlertCircle className="w-3.5 h-3.5" /> Stokta Yok</>
                        ) : (
                          <><Info className="w-3.5 h-3.5" /> Sorgulayınız</>
                        )}
                      </span>
                    </div>

                    {/* Başlık */}
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      {displayPartName}
                    </h1>

                    {/* OEM + Araç */}
                    <div className="flex flex-wrap items-center gap-3">
                      <OemCopyBadge oem={oem} />
                      {marka && (
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-xl">
                          <Car className="w-4 h-4 text-primary-500 flex-shrink-0" />
                          <span className="text-sm text-primary-700 font-medium">{marka} {modelName}</span>
                        </div>
                      )}
                    </div>

                    {/* Fiyat Kartı */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-5">
                      {hasPrice ? (
                        <div>
                          {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(productInfo!.price!)}</span>
                          )}
                          <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-bold text-gray-900">{formatPrice(displayPrice)}</p>
                            {hasDiscount && (
                              <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg">
                                %{Math.round((1 - productInfo!.discount_price! / productInfo!.price!) * 100)} tasarruf
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-bold text-gray-700">Fiyat bilgisi için iletişime geçin</p>
                          <p className="text-sm text-gray-400 mt-1">WhatsApp ile anında fiyat alın</p>
                        </div>
                      )}

                      {/* Adet seçici */}
                      {hasPrice && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 font-medium">Adet:</span>
                          <div className="flex items-center border border-gray-300 rounded-xl bg-white">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-gray-50 transition-colors rounded-l-xl">
                              <Minus className="w-4 h-4 text-gray-500" />
                            </button>
                            <span className="w-12 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 hover:bg-gray-50 transition-colors rounded-r-xl">
                              <Plus className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          {hasPrice && quantity > 1 && (
                            <span className="text-sm text-gray-400">Toplam: {formatPrice(displayPrice * quantity)}</span>
                          )}
                        </div>
                      )}

                      {/* Butonlar */}
                      <div className="flex flex-col gap-3">
                        {hasPrice && (
                          <button
                            onClick={handleAddToCart}
                            disabled={addedToCart}
                            className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold transition-all text-base ${
                              addedToCart ? 'bg-green-500 text-white shadow-green-200 shadow-lg' : 'bg-primary-500 hover:bg-primary-600 text-dark-900 hover:shadow-lg hover:shadow-primary-200'
                            }`}
                          >
                            {addedToCart ? <><Check className="w-5 h-5" /> Sepete Eklendi!</> : <><ShoppingCart className="w-5 h-5" /> Sepete Ekle</>}
                          </button>
                        )}
                        <a
                          href={getWhatsAppUrl(whatsappMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold transition-all text-base ${
                            hasPrice
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 animate-pulse hover:animate-none'
                          }`}
                        >
                          <MessageCircle className="w-5 h-5" />
                          {hasPrice ? 'WhatsApp ile Sipariş' : 'WhatsApp ile Fiyat Sor'}
                        </a>
                      </div>
                    </div>

                    {/* Güven Badge'leri */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-[11px] text-gray-500 font-medium text-center leading-tight">Orijinal Parça Garantisi</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl">
                        <Truck className="w-5 h-5 text-primary-500" />
                        <span className="text-[11px] text-gray-500 font-medium text-center leading-tight">Hızlı Kargo</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl">
                        <BadgeCheck className="w-5 h-5 text-green-500" />
                        <span className="text-[11px] text-gray-500 font-medium text-center leading-tight">Güvenli Ödeme</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Alt Bölümler ── */}
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-6xl mx-auto space-y-8">

              {/* ── Uyumlu Markalar ── */}
              {brandSlugs.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary-500" />
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
                          <Link
                            key={slug}
                            href={`/parcalar?brand=${slug}&marka=${encodeURIComponent(formatted)}`}
                            className="inline-flex items-center gap-2.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm transition-all group"
                          >
                            <BrandLogo brand={formatted} size={28} />
                            <div>
                              <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{formatted}</span>
                              <span className="text-xs text-gray-400 ml-1.5">({count})</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Uyumlu Modeller Tablosu ── */}
              {modelRows.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Uyumlu Modeller</h2>
                        <p className="text-xs text-gray-500">{modelRows.length} farklı araç-nesil kombinasyonu</p>
                      </div>
                    </div>
                  </div>

                  {/* Tablo — Masaüstü */}
                  <div className="hidden md:block overflow-x-auto max-h-[400px] overflow-y-auto">
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
                              <div className="flex items-center gap-2.5">
                                <BrandLogo brand={row.brand} size={24} />
                                <span className="text-sm font-medium text-gray-900">{row.brand}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-sm text-gray-700">{row.model}</td>
                            <td className="px-6 py-3.5">
                              {row.chassis ? (
                                <span className="inline-flex px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-600">{row.chassis}</span>
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
                  <div className="md:hidden divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
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
                if (!spec) return null
                return (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                          <Info className="w-5 h-5 text-purple-600" />
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-gray-900 font-bold text-lg mb-1">Aradığınız parçayı bulamadınız mı?</h4>
                    <p className="text-gray-500 text-sm">WhatsApp&apos;tan talep gönderin, size en uygun parçayı bulalım.</p>
                  </div>
                  <a
                    href={getWhatsAppUrl('Merhaba, bir parça arıyorum ama bulamadım. Yardımcı olur musunuz?')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-green-200 hover:shadow-xl"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Talep Oluştur
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobil Sticky Bottom Bar ── */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 safe-area-pb">
            <div className="flex items-center gap-3">
              {hasPrice && (
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">{formatPrice(displayPrice)}</p>
                </div>
              )}
              {hasPrice ? (
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                    addedToCart ? 'bg-green-500 text-white' : 'bg-primary-500 text-dark-900'
                  }`}
                >
                  {addedToCart ? <><Check className="w-4 h-4" /> Eklendi</> : <><ShoppingCart className="w-4 h-4" /> Sepete Ekle</>}
                </button>
              ) : null}
              <a
                href={getWhatsAppUrl(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-green-600 text-white ${hasPrice ? 'px-5' : 'flex-1'}`}
              >
                <MessageCircle className="w-4 h-4" />
                {hasPrice ? 'WhatsApp' : 'WhatsApp ile Fiyat Sor'}
              </a>
            </div>
          </div>
          {/* Sticky bar altı boşluk (mobilde içerik kayması olmasın) */}
          <div className="lg:hidden h-20" />
        </>
      )}
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
