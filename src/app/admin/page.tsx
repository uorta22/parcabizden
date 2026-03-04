'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react'
import * as api from '@/lib/api'
import type { Order } from '@/types/api'
import type { ShopProduct } from '@/types/shop'

export default function AdminDashboard() {
  const [productCount, setProductCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, orderRes] = await Promise.all([
          api.productList({ per_page: 1 }),
          api.adminOrderList(1),
        ])
        setProductCount(prodRes.total)
        setOrderCount(orderRes.total)
        setRecentOrders(orderRes.orders.slice(0, 5))
        setPendingOrders(orderRes.orders.filter(o => o.status === 'pending').length)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/urunler" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{productCount}</p>
              <p className="text-sm text-gray-500">Toplam Ürün</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/siparisler" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
              <p className="text-sm text-gray-500">Toplam Sipariş</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/siparisler?status=pending" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              <p className="text-sm text-gray-500">Bekleyen Sipariş</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Son Siparişler</h2>
          <Link href="/admin/siparisler" className="text-sm text-primary-600 hover:underline">Tümünü Gör</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500 text-sm">Henüz sipariş yok</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-sm text-gray-900">{order.order_no}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
