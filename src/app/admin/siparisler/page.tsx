'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'
import * as api from '@/lib/api'
import type { Order } from '@/types/api'

const STATUS_OPTIONS = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const perPage = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminOrderList(page, statusFilter || undefined)
      setOrders(res.orders)
      setTotal(res.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(orderId: number, newStatus: string) {
    setUpdatingId(orderId)
    try {
      await api.adminOrderUpdateStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Durum güncellenemedi')
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Siparişler ({total})</h1>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center py-16 text-gray-500 text-sm">Sipariş bulunamadı</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map(order => (
              <div key={order.id}>
                {/* Order row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <button className="p-0.5 text-gray-400">
                    {expandedId === order.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <span className="font-medium text-sm text-gray-900">{order.order_no}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(order.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          {order.total_price > 0 ? `${order.total_price.toLocaleString('tr-TR')} ₺` : 'Fiyat Sorunuz'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || ''}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{order.items.length} kalem</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === order.id && (
                  <div className="px-4 pb-4 pl-12 bg-gray-50 border-t border-gray-100">
                    {/* Items */}
                    <div className="mt-3 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-gray-900">{item.product_name}</span>
                            <span className="text-gray-500 ml-1">x{item.quantity}</span>
                          </div>
                          <span className="text-gray-700">
                            {item.has_price ? `${(item.unit_price * item.quantity).toLocaleString('tr-TR')} ₺` : 'Fiyat Sorunuz'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="mt-3 text-xs text-gray-500 bg-white p-2 rounded border border-gray-200">
                        <strong>Not:</strong> {order.notes}
                      </p>
                    )}

                    {/* Status change */}
                    <div className="mt-4 flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-600">Durum Değiştir:</label>
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.filter(s => s.value).map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      {updatingId === order.id && (
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} / {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
