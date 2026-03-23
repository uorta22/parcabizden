'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Copy, Check, MessageCircle, Loader2, Package, AlertCircle,
  Car, Wrench, Info, CheckCircle2, ShoppingCart, Minus, Plus, Heart,
  Shield, Truck, BadgeCheck, ChevronRight, Star, ThumbsUp, Send,
} from 'lucide-react'
import { searchOemParts, reviewList, reviewSummary, reviewAdd, reviewHelpful } from '@/lib/api'
import type { OemSearchResult, ProductEnrichment, Review, ReviewSummary } from '@/lib/api'
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
import { CATEGORY_NAMES } from '@/data/categories'

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
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg font-mono transition-all"
      title="OEM numarasını kopyala"
    >
      <span className="tracking-wider text-sm text-gray-700 font-semibold">{oem}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  )
}

// ── Fiyat formatlayıcı ──
function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })
}

// ── Tab türü ──
type TabKey = 'aciklama' | 'uyumlu' | 'teknik' | 'yorumlar'

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

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('aciklama')

  // Review state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummaryData, setReviewSummaryData] = useState<ReviewSummary | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewPages, setReviewPages] = useState(1)
  const [reviewSort, setReviewSort] = useState('newest')
  const [helpedIds, setHelpedIds] = useState<Set<number>>(new Set())

  // Yorum formu state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({ author_name: '', rating: 5, title: '', comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

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

  // Yorumları ve özeti yükle
  useEffect(() => {
    reviewSummary(oem).then(setReviewSummaryData).catch(() => {})
  }, [oem])

  const loadReviews = (page: number, sort: string) => {
    setReviewsLoading(true)
    reviewList(oem, page, sort)
      .then(data => {
        setReviews(data.reviews || [])
        setReviewPages(data.pages || 1)
        setReviewPage(data.page || 1)
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }

  useEffect(() => {
    if (activeTab === 'yorumlar') {
      loadReviews(reviewPage, reviewSort)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reviewSort])

  const handleReviewSubmit = async () => {
    if (reviewSubmitting) return
    setReviewSubmitting(true)
    try {
      await reviewAdd({
        oem_number: oem,
        author_name: reviewFormData.author_name,
        rating: reviewFormData.rating,
        title: reviewFormData.title || undefined,
        comment: reviewFormData.comment,
      })
      toast('Yorumunuz eklendi!', 'success')
      setShowReviewForm(false)
      setReviewFormData({ author_name: '', rating: 5, title: '', comment: '' })
      // Yeniden yükle
      loadReviews(1, reviewSort)
      reviewSummary(oem).then(setReviewSummaryData).catch(() => {})
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Yorum eklenemedi', 'error')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleHelpful = async (reviewId: number) => {
    if (helpedIds.has(reviewId)) return
    setHelpedIds(prev => new Set(prev).add(reviewId))
    await reviewHelpful(reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r))
  }

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

  // Teknik spec
  const partSpec = findPartSpec(displayPartName, catId || undefined)

  // Otomatik oluşturulan açıklama
  const autoDescription = partSpec?.description
    ?? `Bu parça ${displayPartName} (${oem}), ${primaryBrandName || marka} araçlar için tasarlanmış orijinal OEM yedek parçadır.${displayCatName ? ` ${displayCatName} kategorisinde yer almaktadır.` : ''} Araç uyumluluğundan emin olmak için OEM numarasını kontrol ediniz.`

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

  // WhatsApp mesajı — zengin bilgili şablon
  const whatsappMessage = (() => {
    const lines: string[] = [
      `Merhaba, aşağıdaki parça için ${hasPrice ? 'sipariş vermek' : 'fiyat ve stok bilgisi almak'} istiyorum.`,
      '',
      `*${displayPartName}*`,
      `OEM No: ${oem}`,
    ]

    // Marka bilgisi
    if (primaryBrandName) lines.push(`Marka: ${primaryBrandName}`)

    // Araç bilgisi
    if (marka && modelName) {
      lines.push(`Araç: ${marka} ${modelName}`)
    }

    // Uyumlu araçlar (ilk 3 tanesi)
    if (modelRows.length > 0) {
      const uniqueModels = Array.from(new Set(modelRows.map(r => `${r.brand} ${r.model}${r.chassis ? ` (${r.chassis})` : ''}`)))
      const shown = uniqueModels.slice(0, 3)
      lines.push(`Uyumlu Araçlar: ${shown.join(', ')}${uniqueModels.length > 3 ? ` +${uniqueModels.length - 3} araç daha` : ''}`)
    }

    // Kategori + Grup
    if (displayCatName) lines.push(`Kategori: ${displayCatName}`)
    if (displayNodeName) lines.push(`Parça Grubu: ${displayNodeName}`)

    // Marka grubu (VAG, Stellantis vs.)
    if (groupLabel) lines.push(`Grup: ${groupLabel}`)

    // Fiyat + adet
    if (hasPrice) {
      lines.push('')
      lines.push(`Fiyat: ${formatPrice(displayPrice)}`)
      if (quantity > 1) lines.push(`Adet: ${quantity} (Toplam: ${formatPrice(displayPrice * quantity)})`)
      else lines.push(`Adet: ${quantity}`)
    }

    // Sayfa linki
    if (typeof window !== 'undefined') {
      lines.push('')
      lines.push(window.location.href)
    }

    return lines.join('\n')
  })()

  const catGradient = getCategoryColor(catId || 'other')

  // Stok durumu — DB'deki tüm parçalar stokta
  const stockBadge = {
    label: 'Stokta Var',
    className: 'bg-green-50 text-green-700 border border-green-200' as const,
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  }

  // Tab tanımları
  const reviewCount = reviewSummaryData?.total || 0
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'aciklama', label: 'Ürün Açıklaması', icon: <Info className="w-4 h-4" /> },
    { key: 'uyumlu', label: `Uyumlu Araçlar${modelRows.length > 0 ? ` (${modelRows.length})` : ''}`, icon: <Car className="w-4 h-4" /> },
    { key: 'teknik', label: 'Teknik Özellikler', icon: <Wrench className="w-4 h-4" /> },
    { key: 'yorumlar', label: `Yorumlar${reviewCount > 0 ? ` (${reviewCount})` : ''}`, icon: <Star className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

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
            <div className="container mx-auto px-4 py-8 md:py-10">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

                  {/* Sol: Görsel */}
                  <div className="relative">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 relative bg-gradient-to-br from-gray-50 via-white to-gray-100">
                      {productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={productImage}
                          alt={displayPartName}
                          className="w-full h-full object-contain p-8"
                        />
                      ) : brandLogoUrl ? (
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${catGradient} bg-opacity-5`}
                          style={{ background: 'linear-gradient(135deg, rgba(249,250,251,1) 0%, rgba(243,244,246,1) 100%)' }}
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
                          className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all shadow-sm ${
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

                    {/* Orijinal OEM etiketi */}
                    <div className="mt-3 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-500 font-medium">Orijinal OEM Parça</span>
                    </div>
                  </div>

                  {/* Sag: Ürün Bilgi Paneli */}
                  <div className="space-y-5">

                    {/* Breadcrumb */}
                    <div className="text-xs">
                      <Breadcrumb
                        items={[
                          { label: 'Ana Sayfa', href: '/' },
                          { label: 'Parçalar', href: '/parcalar' },
                          ...(marka ? [{ label: `${marka} ${modelName}`, href: `/parcalar?brand=${brand}&gen=${gen}&marka=${encodeURIComponent(marka)}&model_name=${encodeURIComponent(modelName)}` }] : []),
                          { label: oem },
                        ]}
                      />
                    </div>

                    {/* Başlık */}
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                      {displayPartName}
                    </h1>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              reviewSummaryData && i < Math.round(reviewSummaryData.average)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200 fill-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setActiveTab('yorumlar')}
                        className="text-xs text-gray-500 hover:text-primary-600 hover:underline"
                      >
                        {reviewSummaryData && reviewSummaryData.total > 0
                          ? `${reviewSummaryData.average} / 5 (${reviewSummaryData.total} yorum)`
                          : 'İlk yorumu yapın'
                        }
                      </button>
                    </div>

                    {/* Ürün Bilgi Tablosu */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {/* OEM Numarası */}
                          <tr className="bg-white border-b border-gray-100">
                            <td className="px-4 py-3 text-gray-500 font-medium w-2/5 whitespace-nowrap">OEM Numarası</td>
                            <td className="px-4 py-3 text-gray-900">
                              <OemCopyBadge oem={oem} />
                            </td>
                          </tr>

                          {/* Marka */}
                          {primaryBrandName && (
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <td className="px-4 py-3 text-gray-500 font-medium">Marka</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <BrandLogo brand={primaryBrandName} size={20} />
                                  <span className="text-gray-900 font-medium">{primaryBrandName}</span>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Kategori */}
                          {displayCatName && (
                            <tr className="bg-white border-b border-gray-100">
                              <td className="px-4 py-3 text-gray-500 font-medium">Kategori</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 text-gray-900">
                                  {catId && <CategoryIcon id={catId} className="text-gray-400" size={14} strokeWidth={2} />}
                                  {displayCatName}
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Parça Grubu */}
                          {displayNodeName && (
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <td className="px-4 py-3 text-gray-500 font-medium">Parça Grubu</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 text-gray-900">
                                  <Package className="w-3.5 h-3.5 text-gray-400" />
                                  {displayNodeName}
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Stok Durumu */}
                          <tr className="bg-white border-b border-gray-100">
                            <td className="px-4 py-3 text-gray-500 font-medium">Stok Durumu</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${stockBadge.className}`}>
                                {stockBadge.icon}
                                {stockBadge.label}
                              </span>
                            </td>
                          </tr>

                          {/* Durum */}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3 text-gray-500 font-medium">Durum</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                                <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                                Orijinal OEM Parça
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Fiyat + Adet + Butonlar */}
                    <div className="space-y-4">
                      {/* Fiyat */}
                      {hasPrice ? (
                        <div>
                          {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through block">{formatPrice(productInfo!.price!)}</span>
                          )}
                          <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-gray-900">{formatPrice(displayPrice)}</p>
                            {hasDiscount && (
                              <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg">
                                %{Math.round((1 - productInfo!.discount_price! / productInfo!.price!) * 100)} tasarruf
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-bold text-gray-700">Fiyat bilgisi için iletişime geçin</p>
                          <p className="text-sm text-gray-400 mt-0.5">WhatsApp ile anında fiyat alın</p>
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
                          {quantity > 1 && (
                            <span className="text-sm text-gray-400">Toplam: {formatPrice(displayPrice * quantity)}</span>
                          )}
                        </div>
                      )}

                      {/* Eylem butonları */}
                      <div className="flex flex-col gap-3">
                        {hasPrice && (
                          <button
                            onClick={handleAddToCart}
                            disabled={addedToCart}
                            className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold transition-all text-base ${
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
                          className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold transition-all text-base ${
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

                    {/* Güven Badge'leri — yatay sıra */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl">
                        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-[11px] text-gray-500 font-medium leading-tight">Orijinal Parça Garantisi</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl">
                        <Truck className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className="text-[11px] text-gray-500 font-medium leading-tight">Hızlı Kargo</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl">
                        <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-[11px] text-gray-500 font-medium leading-tight">Güvenli Ödeme</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tab Bölümü (Alt İçerik) ── */}
          <div className="container mx-auto px-4 py-8 md:py-10">
            <div className="max-w-6xl mx-auto space-y-8">

              {/* Tab Navigasyonu */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Tab Başlıkları */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                        activeTab === tab.key
                          ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab: Ürün Açıklaması */}
                {activeTab === 'aciklama' && (
                  <div className="p-6 space-y-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{autoDescription}</p>
                    {partSpec && partSpec.specs.length > 0 && (
                      <ul className="space-y-2 mt-4">
                        {partSpec.specs.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!partSpec && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        Daha fazla bilgi için OEM numarasını kontrol edin veya WhatsApp&apos;tan iletişime geçin.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Uyumlu Araçlar */}
                {activeTab === 'uyumlu' && (
                  <div>
                    {/* Uyumlu Markalar */}
                    {brandSlugs.length > 0 && (
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Uyumlu Markalar</h3>
                            {groupLabel && (
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-medium">
                                {groupLabel}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {brandSlugs.map(slug => {
                            const formatted = formatBrandSlug(slug)
                            const count = brandGroups.get(slug)?.length || 0
                            return (
                              <Link
                                key={slug}
                                href={`/parcalar?brand=${slug}&marka=${encodeURIComponent(formatted)}`}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm transition-all group"
                              >
                                <BrandLogo brand={formatted} size={22} />
                                <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{formatted}</span>
                                <span className="text-xs text-gray-400">({count})</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors" />
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Uyumlu Modeller Tablosu */}
                    {modelRows.length > 0 ? (
                      <>
                        {/* Masaüstü tablosu */}
                        <div className="hidden md:block overflow-x-auto max-h-[480px] overflow-y-auto">
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
                                <tr key={`${row.brandSlug}-${row.genSlug}-${i}`} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                  <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <BrandLogo brand={row.brand} size={22} />
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

                        {/* Mobil kartlar */}
                        <div className="md:hidden divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                          {modelRows.map((row, i) => (
                            <div key={`${row.brandSlug}-${row.genSlug}-${i}`} className={`px-5 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <BrandLogo brand={row.brand} size={18} />
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
                      </>
                    ) : (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <Car className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        Uyumlu araç bilgisi bulunamadı.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Teknik Özellikler */}
                {activeTab === 'teknik' && (
                  <div className="p-6">
                    {partSpec ? (
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900">{partSpec.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{partSpec.description}</p>
                        {partSpec.specs.length > 0 && (
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                              <tbody>
                                {partSpec.specs.map((s, i) => (
                                  <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="px-4 py-3">
                                      <div className="flex items-start gap-2 text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                        {s}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        <p>Bu parça için teknik özellik bilgisi mevcut değil.</p>
                        <p className="mt-1 text-xs">Detaylı bilgi için WhatsApp&apos;tan iletişime geçebilirsiniz.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Yorumlar */}
                {activeTab === 'yorumlar' && (
                  <div className="p-6 space-y-6">

                    {/* Puan Özeti + Yorum Yaz Butonu */}
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Sol: Puan özeti */}
                      <div className="flex items-center gap-6 flex-1">
                        {reviewSummaryData && reviewSummaryData.total > 0 ? (
                          <>
                            <div className="text-center">
                              <div className="text-4xl font-bold text-gray-900">{reviewSummaryData.average}</div>
                              <div className="flex items-center gap-0.5 mt-1 justify-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.round(reviewSummaryData.average) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">{reviewSummaryData.total} yorum</div>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              {[5, 4, 3, 2, 1].map(star => {
                                const count = reviewSummaryData.distribution[star] || 0
                                const pct = reviewSummaryData.total > 0 ? (count / reviewSummaryData.total) * 100 : 0
                                return (
                                  <div key={star} className="flex items-center gap-2 text-xs">
                                    <span className="w-3 text-gray-500 text-right">{star}</span>
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-6 text-gray-400 text-right">{count}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Henüz yorum yapılmamış. İlk yorumu siz yapın!
                          </div>
                        )}
                      </div>

                      {/* Sağ: Yorum yaz butonu */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setShowReviewForm(!showReviewForm)}
                          className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-900 font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Yorum Yaz
                        </button>
                      </div>
                    </div>

                    {/* Yorum Formu */}
                    {showReviewForm && (
                      <div className="border border-primary-200 bg-primary-50/30 rounded-xl p-5 space-y-4">
                        <h4 className="font-semibold text-gray-900 text-sm">Yorum Yazın</h4>

                        {/* Puanlama */}
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1.5">Puanınız</label>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setReviewFormData(prev => ({ ...prev, rating: i + 1 }))}
                                className="p-0.5 transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-7 h-7 ${i < reviewFormData.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                                />
                              </button>
                            ))}
                            <span className="text-sm text-gray-500 ml-2">{reviewFormData.rating}/5</span>
                          </div>
                        </div>

                        {/* İsim */}
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1.5">Adınız *</label>
                          <input
                            type="text"
                            value={reviewFormData.author_name}
                            onChange={e => setReviewFormData(prev => ({ ...prev, author_name: e.target.value }))}
                            placeholder="Adınızı yazın"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
                            maxLength={100}
                          />
                        </div>

                        {/* Başlık (opsiyonel) */}
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1.5">Başlık <span className="text-gray-400">(opsiyonel)</span></label>
                          <input
                            type="text"
                            value={reviewFormData.title}
                            onChange={e => setReviewFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Yorum başlığı"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
                            maxLength={255}
                          />
                        </div>

                        {/* Yorum */}
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1.5">Yorumunuz *</label>
                          <textarea
                            value={reviewFormData.comment}
                            onChange={e => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Bu ürün hakkındaki düşüncelerinizi paylaşın (en az 10 karakter)"
                            rows={4}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none resize-none"
                            maxLength={2000}
                          />
                          <div className="text-xs text-gray-400 text-right mt-1">{reviewFormData.comment.length}/2000</div>
                        </div>

                        {/* Butonlar */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleReviewSubmit}
                            disabled={reviewSubmitting || !reviewFormData.author_name || reviewFormData.comment.length < 10}
                            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-900 font-bold rounded-xl transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Gönder
                          </button>
                          <button
                            onClick={() => setShowReviewForm(false)}
                            className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sıralama */}
                    {reviews.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{reviewSummaryData?.total || 0} yorum</span>
                        <select
                          value={reviewSort}
                          onChange={e => setReviewSort(e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 focus:ring-2 focus:ring-primary-300 outline-none"
                        >
                          <option value="newest">En Yeni</option>
                          <option value="oldest">En Eski</option>
                          <option value="highest">En Yüksek Puan</option>
                          <option value="lowest">En Düşük Puan</option>
                          <option value="helpful">En Faydalı</option>
                        </select>
                      </div>
                    )}

                    {/* Yorum Listesi */}
                    {reviewsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map(review => (
                          <div key={review.id} className="border border-gray-200 rounded-xl p-5">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-900">{review.author_name}</span>
                                  {review.verified === 1 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-medium">
                                      <BadgeCheck className="w-3 h-3" />
                                      Doğrulanmış
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {new Date(review.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.title && <h5 className="font-medium text-sm text-gray-900 mb-1">{review.title}</h5>}
                            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                            <div className="mt-3 flex items-center">
                              <button
                                onClick={() => handleHelpful(review.id)}
                                disabled={helpedIds.has(review.id)}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                  helpedIds.has(review.id)
                                    ? 'bg-primary-50 text-primary-600 border border-primary-200'
                                    : 'text-gray-400 hover:text-primary-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                Faydalı ({review.helpful_count})
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Sayfalama */}
                        {reviewPages > 1 && (
                          <div className="flex justify-center gap-2 pt-2">
                            {Array.from({ length: reviewPages }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => { setReviewPage(i + 1); loadReviews(i + 1, reviewSort) }}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                  reviewPage === i + 1
                                    ? 'bg-primary-500 text-dark-900'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        <p>Henüz yorum yapılmamış.</p>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="mt-2 text-primary-600 hover:underline text-sm font-medium"
                        >
                          İlk yorumu siz yazın
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
