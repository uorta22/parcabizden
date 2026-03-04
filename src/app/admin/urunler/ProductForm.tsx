'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import * as api from '@/lib/api'
import type { ShopProduct } from '@/types/shop'

const CATEGORIES = [
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

function slugify(text: string): string {
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
  }
  return text
    .split('')
    .map(ch => map[ch] || ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Props {
  product?: ShopProduct
  isEdit?: boolean
}

export default function ProductForm({ product, isEdit }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Basic fields
  const [name, setName] = useState(product?.name || '')
  const [slug, setSlug] = useState(product?.slug || '')
  const [slugManual, setSlugManual] = useState(false)
  const [oemNumber, setOemNumber] = useState(product?.oem_number || '')
  const [brandName, setBrandName] = useState(product?.brand_name || '')
  const [category, setCategory] = useState(product?.category || 'diger')
  const [price, setPrice] = useState(product?.price?.toString() || '')
  const [discountPrice, setDiscountPrice] = useState(product?.discount_price?.toString() || '')
  const [inStock, setInStock] = useState(product?.in_stock ?? true)
  const [isConsumable, setIsConsumable] = useState(product?.is_consumable ?? false)
  const [description, setDescription] = useState(product?.description || '')

  // Images
  const [images, setImages] = useState<string[]>(product?.images || [''])
  const [thumbnail, setThumbnail] = useState(product?.thumbnail || '')

  // Specs
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(() => {
    if (product?.specs && Object.keys(product.specs).length > 0) {
      return Object.entries(product.specs).map(([key, value]) => ({ key, value }))
    }
    return [{ key: '', value: '' }]
  })

  // Compatible vehicles
  const [vehicles, setVehicles] = useState<{ brand: string; brand_slug: string; models: string }[]>(() => {
    if (product?.compatible_vehicles && product.compatible_vehicles.length > 0) {
      return product.compatible_vehicles.map(v => ({
        brand: v.brand,
        brand_slug: v.brand_slug,
        models: v.models.join(', '),
      }))
    }
    return [{ brand: '', brand_slug: '', models: '' }]
  })

  // Tags
  const [tags, setTags] = useState(product?.tags?.join(', ') || '')

  // Auto-slug
  useEffect(() => {
    if (!slugManual && !isEdit) {
      setSlug(slugify(name))
    }
  }, [name, slugManual, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Ürün adı zorunlu'); return }
    if (!slug.trim()) { setError('Slug zorunlu'); return }
    if (!category) { setError('Kategori seçin'); return }

    const filteredImages = images.filter(u => u.trim())
    const filteredSpecs: Record<string, string> = {}
    specs.forEach(s => { if (s.key.trim() && s.value.trim()) filteredSpecs[s.key.trim()] = s.value.trim() })
    const filteredVehicles = vehicles
      .filter(v => v.brand.trim())
      .map(v => ({
        brand: v.brand.trim(),
        brand_slug: v.brand_slug.trim() || slugify(v.brand.trim()),
        models: v.models.split(',').map(m => m.trim()).filter(Boolean),
      }))
    const filteredTags = tags.split(',').map(t => t.trim()).filter(Boolean)

    const data: Record<string, string> = {
      name: name.trim(),
      slug: slug.trim(),
      oem_number: oemNumber.trim(),
      brand_name: brandName.trim(),
      category,
      price: price.trim(),
      discount_price: discountPrice.trim(),
      in_stock: inStock ? '1' : '0',
      is_consumable: isConsumable ? '1' : '0',
      description: description.trim(),
      images: JSON.stringify(filteredImages),
      thumbnail: thumbnail.trim(),
      specs: JSON.stringify(filteredSpecs),
      compatible_vehicles: JSON.stringify(filteredVehicles),
      tags: JSON.stringify(filteredTags),
    }

    setSaving(true)
    try {
      if (isEdit && product) {
        await api.adminProductUpdate(Number(product.id), data)
      } else {
        await api.adminProductAdd(data)
      }
      router.push('/admin/urunler')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/urunler" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Basic info */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="Ön Fren Balata Seti"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
              {!isEdit && <span className="text-gray-400 font-normal ml-1">(otomatik)</span>}
            </label>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 font-mono"
              placeholder="on-fren-balata-seti"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OEM Numarası</label>
            <input
              type="text"
              value={oemNumber}
              onChange={e => setOemNumber(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="34116850568"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
            <input
              type="text"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="Bosch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Fiyat & Stok</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiyat (₺)
              <span className="text-gray-400 font-normal ml-1">boş = &quot;Fiyat Sorunuz&quot;</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İndirimli Fiyat (₺)</label>
            <input
              type="number"
              step="0.01"
              value={discountPrice}
              onChange={e => setDiscountPrice(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={e => setInStock(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Stokta</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isConsumable}
                onChange={e => setIsConsumable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Sarf Malzemesi</span>
            </label>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Açıklama</h2>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-y"
          placeholder="Ürün açıklaması..."
        />
      </section>

      {/* Images */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Görseller</h2>
        <div className="space-y-2">
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                value={img}
                onChange={e => {
                  const newImages = [...images]
                  newImages[i] = e.target.value
                  setImages(newImages)
                }}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setImages([...images, ''])}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Görsel Ekle
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
          <input
            type="url"
            value={thumbnail}
            onChange={e => setThumbnail(e.target.value)}
            placeholder="https://example.com/thumb.jpg veya yukarıdan bir URL"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
          {images.filter(u => u.trim()).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.filter(u => u.trim()).map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setThumbnail(u)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    thumbnail === u ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  Görsel {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Specs */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Teknik Özellikler</h2>
        <div className="space-y-2">
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={spec.key}
                onChange={e => {
                  const newSpecs = [...specs]
                  newSpecs[i] = { ...newSpecs[i], key: e.target.value }
                  setSpecs(newSpecs)
                }}
                placeholder="Özellik adı"
                className="w-1/3 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
              <input
                type="text"
                value={spec.value}
                onChange={e => {
                  const newSpecs = [...specs]
                  newSpecs[i] = { ...newSpecs[i], value: e.target.value }
                  setSpecs(newSpecs)
                }}
                placeholder="Değer"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
              {specs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSpecs([...specs, { key: '', value: '' }])}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Özellik Ekle
          </button>
        </div>
      </section>

      {/* Compatible vehicles */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Uyumlu Araçlar</h2>
        <div className="space-y-3">
          {vehicles.map((v, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <input
                type="text"
                value={v.brand}
                onChange={e => {
                  const newV = [...vehicles]
                  newV[i] = { ...newV[i], brand: e.target.value, brand_slug: slugify(e.target.value) }
                  setVehicles(newV)
                }}
                placeholder="Marka (ör: BMW)"
                className="w-full sm:w-1/4 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
              <input
                type="text"
                value={v.models}
                onChange={e => {
                  const newV = [...vehicles]
                  newV[i] = { ...newV[i], models: e.target.value }
                  setVehicles(newV)
                }}
                placeholder="Modeller (virgülle: 3 Serisi, 5 Serisi)"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
              {vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVehicles(vehicles.filter((_, j) => j !== i))}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVehicles([...vehicles, { brand: '', brand_slug: '', models: '' }])}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Araç Ekle
          </button>
        </div>
      </section>

      {/* Tags */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Etiketler</h2>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="fren, balata, ön fren (virgülle ayırın)"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ürünü Ekle'}
        </button>
        <Link
          href="/admin/urunler"
          className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          İptal
        </Link>
      </div>
    </form>
  )
}
