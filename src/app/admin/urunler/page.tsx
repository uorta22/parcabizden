'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import * as api from '@/lib/api'
import type { ShopProduct } from '@/types/shop'

const CATEGORIES = [
  { value: '', label: 'Tüm Kategoriler' },
  { value: 'motor', label: 'Motor' },
  { value: 'fren', label: 'Fren Sistemi' },
  { value: 'suspansiyon', label: 'Süspansiyon' },
  { value: 'elektrik', label: 'Elektrik & Aydınlatma' },
  { value: 'filtre', label: 'Filtre' },
  { value: 'yag', label: 'Yağ & Sıvılar' },
  { value: 'kayis', label: 'Kayış & Kasnak' },
  { value: 'egzoz', label: 'Egzoz' },
  { value: 'sogutma', label: 'Soğutma' },
  { value: 'sanziman', label: 'Şanzıman & Debriyaj' },
  { value: 'govde', label: 'Gövde & Kaporta' },
  { value: 'ic-aksesuar', label: 'İç Aksesuar' },
  { value: 'dis-aksesuar', label: 'Dış Aksesuar' },
  { value: 'lastik-jant', label: 'Lastik & Jant' },
  { value: 'aku', label: 'Akü' },
  { value: 'sarf', label: 'Sarf Malzemesi' },
  { value: 'diger', label: 'Diğer' },
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  const perPage = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.productList({
        page,
        per_page: perPage,
        search: search || undefined,
        category: category || undefined,
      })
      setProducts(res.products)
      setTotal(res.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, search, category])

  useEffect(() => { load() }, [load])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  async function handleDelete(id: number, name: string) {
    if (!confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return
    setDeleting(id)
    try {
      await api.adminProductDelete(id)
      load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ürünler ({total})</h1>
        <Link
          href="/admin/urunler/yeni"
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ürün Ekle
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
        </div>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center py-16 text-gray-500 text-sm">Ürün bulunamadı</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Görsel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ürün Adı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">OEM</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fiyat</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Stok</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">?</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                      {product.brand_name && <p className="text-xs text-gray-500">{product.brand_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{product.oem_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {CATEGORIES.find(c => c.value === product.category)?.label || product.category}
                    </td>
                    <td className="px-4 py-3">
                      {product.discount_price ? (
                        <div>
                          <span className="font-medium text-green-700">{product.discount_price.toLocaleString('tr-TR')} ₺</span>
                          <span className="text-xs text-gray-400 line-through ml-1">{product.price?.toLocaleString('tr-TR')}</span>
                        </div>
                      ) : product.price ? (
                        <span className="font-medium text-gray-900">{product.price.toLocaleString('tr-TR')} ₺</span>
                      ) : (
                        <span className="text-xs text-orange-600 font-medium">Fiyat Sorunuz</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.in_stock ? 'Stokta' : 'Tükendi'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/urunler/${product.id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(Number(product.id), product.name)}
                          disabled={deleting === Number(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
