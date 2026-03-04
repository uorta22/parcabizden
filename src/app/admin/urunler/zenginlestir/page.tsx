'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle2, AlertCircle, Package, Save } from 'lucide-react'
import { searchOemParts, adminEnrichPart } from '@/lib/api'
import type { OemSearchResult } from '@/lib/api'

const CATEGORIES = [
  { value: 'engine', label: 'Motor' },
  { value: 'turbo_intake', label: 'Turbo & Emme' },
  { value: 'fuel', label: 'Yakıt Sistemi' },
  { value: 'exhaust', label: 'Egzoz' },
  { value: 'transmission', label: 'Şanzıman' },
  { value: 'brake', label: 'Fren' },
  { value: 'suspension', label: 'Süspansiyon' },
  { value: 'wheel_tyre', label: 'Jant & Lastik' },
  { value: 'body_exterior', label: 'Kaporta & Dış' },
  { value: 'glass_mirror', label: 'Cam & Ayna' },
  { value: 'lighting', label: 'Aydınlatma' },
  { value: 'electrical', label: 'Elektrik' },
  { value: 'climate', label: 'Klima & Isıtma' },
  { value: 'interior', label: 'İç Aksam' },
  { value: 'other', label: 'Diğer' },
]

export default function EnrichPartPage() {
  const [oemQuery, setOemQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<OemSearchResult[]>([])
  const [selectedOem, setSelectedOem] = useState<string | null>(null)
  const [partName, setPartName] = useState('')
  const [searchError, setSearchError] = useState('')

  // Form alanları
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [category, setCategory] = useState('other')
  const [thumbnail, setThumbnail] = useState('')
  const [inStock, setInStock] = useState(true)

  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSearch = async () => {
    const q = oemQuery.trim()
    if (q.length < 3) return

    setSearching(true)
    setSearchError('')
    setSearchResults([])
    setSelectedOem(null)
    setSaveResult(null)

    try {
      const data = await searchOemParts(q)
      if (data.results.length === 0) {
        setSearchError('Bu OEM numarası veritabanında bulunamadı.')
      } else {
        setSearchResults(data.results)
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Arama hatası')
    } finally {
      setSearching(false)
    }
  }

  const selectOem = (oem: string, name: string) => {
    setSelectedOem(oem)
    setPartName(name)
    setSaveResult(null)
    // Eğer bu OEM için zaten product varsa, bilgileri doldur
    const result = searchResults.find(r => r.oem_number === oem)
    if (result?.product) {
      setPrice(result.product.price?.toString() || '')
      setDiscountPrice(result.product.discount_price?.toString() || '')
      setThumbnail(result.product.thumbnail || '')
      setInStock(result.product.in_stock)
    } else {
      setPrice('')
      setDiscountPrice('')
      setThumbnail('')
      setInStock(true)
    }
  }

  const handleSave = async () => {
    if (!selectedOem) return

    setSaving(true)
    setSaveResult(null)

    try {
      const result = await adminEnrichPart({
        oem_number: selectedOem,
        price: price || undefined,
        discount_price: discountPrice || undefined,
        category,
        thumbnail: thumbnail || undefined,
        name: partName || undefined,
        in_stock: inStock ? '1' : '0',
      })

      const actionText = result.action === 'created' ? 'oluşturuldu' : 'güncellendi'
      setSaveResult({ type: 'success', message: `Ürün başarıyla ${actionText}! (${result.product.name})` })
    } catch (e) {
      setSaveResult({ type: 'error', message: e instanceof Error ? e.message : 'Kaydetme hatası' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Parça Zenginleştir</h1>
      <p className="text-sm text-gray-500 mb-8">OEM numarası ile parça bulun ve fiyat/görsel ekleyin.</p>

      {/* OEM Arama */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">OEM Numarası</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={oemQuery}
            onChange={e => setOemQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Örn: 1K0615301AA"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searching || oemQuery.trim().length < 3}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Ara
          </button>
        </div>

        {searchError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {searchError}
          </div>
        )}
      </div>

      {/* Arama Sonuçları */}
      {searchResults.length > 0 && !selectedOem && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">{searchResults.length} sonuç bulundu — birini seçin</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {/* Benzersiz OEM numaralarını göster */}
            {Array.from(new Map(searchResults.map(r => [r.oem_number, r])).values()).map(r => (
              <button
                key={r.oem_number}
                onClick={() => selectOem(r.oem_number, r.name)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{r.oem_number}</p>
                </div>
                {r.product && (
                  <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">
                    Mevcut
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seçili Parça — Düzenleme Formu */}
      {selectedOem && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{partName}</h2>
              <p className="text-sm text-gray-500 font-mono">{selectedOem}</p>
            </div>
            <button
              onClick={() => { setSelectedOem(null); setSaveResult(null) }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Değiştir
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İndirimli Fiyat (TL)</label>
              <input
                type="number"
                step="0.01"
                value={discountPrice}
                onChange={e => setDiscountPrice(e.target.value)}
                placeholder="Opsiyonel"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
            <input
              type="text"
              value={thumbnail}
              onChange={e => setThumbnail(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={e => setInStock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm text-gray-700">Stokta</span>
          </div>

          {/* Kaydet butonu */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>

          {/* Sonuç mesajı */}
          {saveResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              saveResult.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {saveResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {saveResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
