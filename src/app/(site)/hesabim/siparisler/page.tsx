'use client'

import { useState, useEffect } from 'react'
import { Package, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import { orderList } from '@/lib/api'
import type { Order } from '@/types/api'

const STATUS_CONFIG: Record<
  Order['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Beklemede',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  confirmed: {
    label: 'Onaylandı',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  shipped: {
    label: 'Kargoya Verildi',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  delivered: {
    label: 'Teslim Edildi',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  cancelled: {
    label: 'İptal Edildi',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const statusConfig = STATUS_CONFIG[order.status]
  const formattedDate = new Date(order.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const hasPrice = order.items.some((i) => i.has_price)
  const totalDisplay = hasPrice
    ? order.total_price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    : 'Fiyat Belirlenecek'

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Order header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">#{order.order_no}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="font-bold text-gray-900 text-sm">{totalDisplay}</p>
            <p className="text-xs text-gray-400">{order.items.length} ürün</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded order items */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
          {/* Items list */}
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.product_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-12 h-12 object-contain bg-white rounded-lg border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Adet: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {item.has_price ? (
                    <p className="text-sm font-semibold text-gray-900">
                      {(item.unit_price * item.quantity).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400">Fiyat Sor</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery address */}
          {order.address && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Teslimat Adresi</p>
              <p className="text-sm text-gray-700">
                {order.address.full_name} — {order.address.address_line1},{' '}
                {order.address.district}, {order.address.city}
              </p>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Sipariş Notu</p>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    orderList()
      .then((res) => setOrders(res.orders))
      .catch(() => setError('Siparişler yüklenemedi. Lütfen tekrar deneyin.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Siparişlerim</h1>
        <p className="text-gray-500 text-sm">Tüm sipariş geçmişiniz</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {!error && orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Henüz Siparişiniz Yok</h2>
          <p className="text-gray-500">Ürünleri inceleyerek ilk siparişinizi verebilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
