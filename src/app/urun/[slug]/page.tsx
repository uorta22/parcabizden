'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight, Loader2, ShoppingCart, MessageCircle, Package, Minus, Plus, Check, Tag, Car, AlertCircle } from 'lucide-react'
import { getProductBySlug, formatPrice } from '@/lib/products'
import { searchOemParts } from '@/lib/api'
import type { ShopProduct } from '@/types/shop'
import type { OemSearchResult } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { getWhatsAppUrl } from '@/lib/config'
import { CategoryIcon } from '@/components/CategoryIcons'

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [oemResults, setOemResults] = useState<OemSearchResult[]>([])

  const { addItem } = useCart()

  // Load product
  useEffect(() => {
    setLoading(true)
    setError('')
    getProductBySlug(slug)
      .then(data => {
        if (data) {
          setProduct(data)
          // If product has OEM number, fetch compatible vehicles from API
          if (data.oem_number) {
            searchOemParts(data.oem_number)
              .then(res => setOemResults(res.results || []))
              .catch(() => {})
          }
        } else {
          setError('Ürün bulunamadı')
        }
      })
      .catch(() => setError('Ürün yüklenirken hata oluştu'))
      .finally(() => setLoading(false))
  }, [slug])

  const hasPrice = product && product.price != null && product.price > 0
  const hasDiscount = hasPrice && product!.discount_price != null && product!.discount_price! < product!.price!
  const displayPrice = hasDiscount ? product!.discount_price! : (product?.price || 0)

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image: product.thumbnail || undefined,
      unit_price: displayPrice,
      has_price: !!hasPrice,
      quantity,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const whatsappMsg = product
    ? `Merhaba, aşağıdaki ürün için bilgi almak istiyorum:\n\nÜrün: ${product.name}${product.oem_number ? `\nOEM: ${product.oem_number}` : ''}${hasPrice ? `\nFiyat: ${formatPrice(displayPrice)}` : ''}\nAdet: ${quantity}`
    : ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{error || 'Ürün bulunamadı'}</h1>
          <p className="text-gray-500 mb-6">Bu ürün mevcut değil veya kaldırılmış olabilir.</p>
          <Link href="/urunler" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-xl transition-colors">
            Ürünlere Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <Link href="/urunler" className="hover:text-gray-900 transition-colors">Ürünler</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Product Detail — 3 column layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left — Product Image */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-8">
                {product.thumbnail || (product.images && product.images.length > 0) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.thumbnail || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <CategoryIcon id={product.category} className="text-gray-300" size={96} stroke={1} />
                )}
              </div>
            </div>
          </div>

          {/* Middle — Product Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon id={product.category} className="text-gray-400" size={16} stroke={2} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">{product.category.replace(/_/g, ' ')}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

              {/* OEM Badge */}
              {product.oem_number && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg">
                  <span className="text-xs text-gray-400">OEM</span>
                  <span className="text-sm font-mono font-medium text-gray-700">{product.oem_number}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

            {/* Specs Table */}
            {Object.keys(product.specs).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Teknik Özellikler</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex px-4 py-2.5">
                      <span className="w-1/3 text-xs text-gray-500 font-medium">{key}</span>
                      <span className="flex-1 text-sm text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compatible Vehicles */}
            {product.compatible_vehicles && product.compatible_vehicles.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Uyumlu Araçlar</h3>
                </div>
                <div className="p-4 space-y-3">
                  {product.compatible_vehicles.map(v => (
                    <div key={v.brand_slug} className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/brands/${v.brand_slug}.png`}
                        alt={v.brand}
                        className="w-5 h-5 object-contain mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{v.brand}</span>
                        <p className="text-xs text-gray-500">{v.models.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API-sourced compatible vehicles */}
            {oemResults.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Parça Kataloğu Uyumluluğu</h3>
                  <span className="ml-auto text-xs text-gray-400">{oemResults.length} kayit</span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-2">Bu OEM numarası aşağıdaki araçlarda da kullanılmaktadır:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(oemResults.map(r => r.brand_slug))).slice(0, 8).map(slug => (
                      <span key={slug} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/brands/${slug}.png`} alt={slug} className="w-3.5 h-3.5 object-contain" />
                        {slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    ))}
                  </div>
                  {product.oem_number && (
                    <Link
                      href={`/parca/${encodeURIComponent(product.oem_number)}`}
                      className="inline-flex items-center gap-1 mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      Tüm uyumlu araçları gör <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right — Purchase Card (sticky) */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 space-y-4">
                  {/* Brand logo */}
                  {product.brand_name && (
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{product.brand_name}</span>
                    </div>
                  )}

                  {/* Price */}
                  {hasPrice ? (
                    <div>
                      {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">{formatPrice(product.price!)}</span>
                      )}
                      <p className="text-3xl font-bold text-gray-900">{formatPrice(displayPrice)}</p>
                      {hasDiscount && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-md mt-1">
                          %{Math.round((1 - product.discount_price! / product.price!) * 100)} indirim
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-gray-700">Fiyat bilgisi için sorun</p>
                      <p className="text-xs text-gray-400 mt-1">WhatsApp ile hızlı bilgi alın</p>
                    </div>
                  )}

                  {/* Stock status */}
                  <div className={`flex items-center gap-2 text-sm ${product.in_stock ? 'text-green-600' : 'text-gray-400'}`}>
                    {product.in_stock ? (
                      <><Check className="w-4 h-4" /> Stokta Mevcut</>
                    ) : (
                      <><AlertCircle className="w-4 h-4" /> Stokta Yok</>
                    )}
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Adet:</span>
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-500" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-gray-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Add to cart / Price ask */}
                  {hasPrice ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={addedToCart}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all text-sm ${
                        addedToCart
                          ? 'bg-green-500 text-white'
                          : 'bg-primary-500 hover:bg-primary-600 text-dark-900'
                      }`}
                    >
                      {addedToCart ? (
                        <><Check className="w-5 h-5" /> Sepete Eklendi!</>
                      ) : (
                        <><ShoppingCart className="w-5 h-5" /> Sepete Ekle</>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={addedToCart}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all text-sm ${
                        addedToCart
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {addedToCart ? (
                        <><Check className="w-5 h-5" /> Sepete Eklendi!</>
                      ) : (
                        <><ShoppingCart className="w-5 h-5" /> Sepete Ekle (Fiyat Sorulacak)</>
                      )}
                    </button>
                  )}

                  {/* WhatsApp CTA */}
                  <a
                    href={getWhatsAppUrl(whatsappMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {hasPrice ? 'WhatsApp ile Sipariş' : 'WhatsApp ile Fiyat Sor'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
