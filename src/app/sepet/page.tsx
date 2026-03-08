'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Trash2, Minus, Plus, MessageCircle, ArrowLeft, Package, MapPin, Check, Loader2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import EmptyState from '@/components/EmptyState'
import { formatPrice } from '@/lib/products'
import { addressList, orderCreate } from '@/lib/api'
import type { UserAddress } from '@/types/api'

export default function SepetPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, getWhatsAppCartUrl } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [orderNotes, setOrderNotes] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')

  const pricedItems = items.filter(i => i.has_price)
  const unpricedItems = items.filter(i => !i.has_price)

  // Load addresses if logged in
  useEffect(() => {
    if (user) {
      addressList()
        .then(res => {
          setAddresses(res.addresses || [])
          const defaultAddr = res.addresses?.find(a => a.is_default)
          if (defaultAddr) setSelectedAddressId(defaultAddr.id)
        })
        .catch(() => {})
    }
  }, [user])

  const handleCreateOrder = async () => {
    if (!selectedAddressId || items.length === 0) return
    setOrdering(true)
    setOrderError('')
    try {
      await orderCreate({
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          has_price: i.has_price,
        })),
        address_id: selectedAddressId,
        notes: orderNotes || undefined,
      })
      setOrderSuccess(true)
      clearCart()
      toast('Siparişiniz başarıyla oluşturuldu!', 'success')
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Sipariş oluşturulurken hata oluştu'
      setOrderError(errMsg)
      toast(errMsg, 'error')
    } finally {
      setOrdering(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Siparişiniz Alındı!</h1>
          <p className="text-gray-500 mb-8">Siparişiniz başarıyla oluşturuldu. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/hesabim/siparisler"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-xl transition-colors"
            >
              <Package className="w-5 h-5" />
              Siparişlerimi Gör
            </Link>
            <Link
              href="/urunler"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
            >
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <EmptyState
          icon={<ShoppingCart className="w-10 h-10" />}
          title="Sepetiniz Boş"
          description="Henüz sepetinize ürün eklemediniz."
          action={{ label: 'Ürünlere Göz At', href: '/urunler', icon: <Package className="w-5 h-5" /> }}
        />
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
              <p className="text-sm text-gray-500">{items.length} ürün</p>
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
                  <span className="text-sm font-semibold text-gray-900">Fiyatlı Ürünler ({pricedItems.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {pricedItems.map(item => (
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
                        <p className="text-sm text-gray-500 mt-0.5">{formatPrice(item.unit_price)} / adet</p>
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
                      <span className="text-sm font-bold text-gray-900 w-24 text-right">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>
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
                        <p className="text-xs text-amber-600 mt-0.5">Fiyat WhatsApp üzerinden bildirilecek</p>
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

            {/* Login prompt for guests */}
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-4">
                <MapPin className="w-8 h-8 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Sipariş vermek için giriş yapın</p>
                  <p className="text-xs text-blue-600 mt-0.5">Adres seçimi ve sipariş takibi için hesabınıza giriş yapmanız gerekiyor.</p>
                </div>
                <Link href="/giris" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0">
                  Giriş Yap
                </Link>
              </div>
            )}

            {/* Address Selection (only if logged in) */}
            {user && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">Teslimat Adresi</span>
                </div>
                <div className="p-5">
                  {addresses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">Henüz adres eklenmemiş.</p>
                      <Link href="/hesabim/adresler" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Adres Ekle
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map(addr => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-primary-400 bg-primary-50/50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 accent-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{addr.title}</span>
                              {addr.is_default && <span className="text-[10px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded font-medium">Varsayılan</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{addr.full_name} - {addr.phone}</p>
                            <p className="text-xs text-gray-500">{addr.address_line1}, {addr.district}/{addr.city}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Order notes */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Sipariş Notu (opsiyonel)</label>
                    <textarea
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      placeholder="Siparişinizle ilgili not ekleyebilirsiniz..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Sipariş Özeti</h2>
                </div>
                <div className="p-5 space-y-4">
                  {pricedItems.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Fiyatlı ürünler ({pricedItems.reduce((s, i) => s + i.quantity, 0)} adet)</span>
                      <span className="font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
                    </div>
                  )}

                  {unpricedItems.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-600">{unpricedItems.length} ürün fiyat sorulacak</span>
                    </div>
                  )}

                  <div className="h-px bg-gray-100" />

                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">Toplam</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                      {unpricedItems.length > 0 && (
                        <p className="text-[11px] text-amber-600">+ fiyat sorulacak ürünler</p>
                      )}
                    </div>
                  </div>

                  {/* Create Order Button */}
                  {user && addresses.length > 0 && (
                    <>
                      <button
                        onClick={handleCreateOrder}
                        disabled={ordering || !selectedAddressId}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-primary-500 hover:bg-primary-600 text-dark-900 rounded-xl font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ordering ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Sipariş Oluşturuluyor...</>
                        ) : (
                          <><Package className="w-5 h-5" /> Sipariş Oluştur</>
                        )}
                      </button>
                      {orderError && (
                        <p className="text-xs text-red-500 text-center">{orderError}</p>
                      )}
                    </>
                  )}

                  {/* WhatsApp Order */}
                  <a
                    href={getWhatsAppCartUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp ile Sipariş Oluştur
                  </a>

                  <p className="text-[11px] text-gray-400 text-center">
                    Siparişiniz WhatsApp üzerinden veya sistem üzerinden oluşturulabilir.
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
