'use client'

import Link from 'next/link'
import { ShoppingCart, Trash2, Minus, Plus, MessageCircle, ArrowLeft, Package } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/products'

export default function SepetPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, getWhatsAppCartUrl } = useCart()

  const pricedItems = items.filter(i => i.has_price)
  const unpricedItems = items.filter(i => !i.has_price)

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sepetiniz Bos</h1>
          <p className="text-gray-500 mb-8">Henuz sepetinize urun eklemediniz.</p>
          <Link
            href="/urunler"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-xl transition-colors"
          >
            <Package className="w-5 h-5" />
            Urunlere Goz At
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/urunler" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sepetim</h1>
              <p className="text-sm text-gray-500">{items.length} urun</p>
            </div>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Sepeti Temizle
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            {/* Priced items */}
            {pricedItems.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Fiyatli Urunler ({pricedItems.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {pricedItems.map(item => (
                    <div key={item.product_id} className="p-5 flex items-center gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
                        {item.product_image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/urun/${item.product_slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
                          {item.product_name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">{formatPrice(item.unit_price)} / adet</p>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="p-1.5 hover:bg-gray-50 transition-colors">
                          <Minus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="p-1.5 hover:bg-gray-50 transition-colors">
                          <Plus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-bold text-gray-900 w-24 text-right">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>

                      {/* Remove */}
                      <button onClick={() => removeItem(item.product_id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unpriced items */}
            {unpricedItems.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                  <span className="text-sm font-semibold text-amber-800">Fiyat Sorulacak ({unpricedItems.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {unpricedItems.map(item => (
                    <div key={item.product_id} className="p-5 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
                        {item.product_image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/urun/${item.product_slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
                          {item.product_name}
                        </Link>
                        <p className="text-xs text-amber-600 mt-0.5">Fiyat WhatsApp uzerinden bildirilecek</p>
                      </div>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="p-1.5 hover:bg-gray-50 transition-colors">
                          <Minus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="p-1.5 hover:bg-gray-50 transition-colors">
                          <Plus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                      <span className="text-sm text-amber-600 font-medium w-24 text-right">Fiyat Sor</span>
                      <button onClick={() => removeItem(item.product_id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Siparis Ozeti</h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Priced summary */}
                  {pricedItems.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Fiyatli urunler ({pricedItems.reduce((s, i) => s + i.quantity, 0)} adet)</span>
                      <span className="font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
                    </div>
                  )}

                  {/* Unpriced note */}
                  {unpricedItems.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-600">{unpricedItems.length} urun fiyat sorulacak</span>
                    </div>
                  )}

                  <div className="h-px bg-gray-100" />

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">Toplam</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                      {unpricedItems.length > 0 && (
                        <p className="text-[11px] text-amber-600">+ fiyat sorulacak urunler</p>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Order */}
                  <a
                    href={getWhatsAppCartUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp ile Siparis Olustur
                  </a>

                  <p className="text-[11px] text-gray-400 text-center">
                    Siparisiniz WhatsApp uzerinden iletilecek ve ekibimiz sizinle iletisime gececektir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
