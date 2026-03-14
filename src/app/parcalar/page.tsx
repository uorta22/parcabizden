'use client'

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Car, ChevronRight, ChevronLeft, Search, MessageCircle, Loader2, AlertCircle, Package, Copy, Check, Calendar, Zap, Fuel, Settings2, ArrowRight, Grid3x3, List } from 'lucide-react'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'
import { CategoryIcon, getCategoryColor } from '@/components/CategoryIcons'
import { ProductCardSkeleton, GenerationCardSkeleton, Skeleton } from '@/components/Skeleton'
import Pagination from '@/components/Pagination'
import Tabs from '@/components/Tabs'
import { fetchVehicleCategories, fetchVehicleNodes, fetchVehicleParts, fetchGenerations, searchOemParts, fetchAutodataGenerations, fetchAutodataModels, fetchAutodataBrands, resolveAutodataSlug, fetchVehicleSpecs } from '@/lib/api'
import type { VehicleCategory, VehicleNode, VehiclePart } from '@/lib/api'
import type { AutodataGeneration, AutodataModel, SlugMatch, VehicleSpecRow } from '@/types/api'
import { findAutodataGenerationImage } from '@/lib/vehicleImage'
import PartDiagram from '@/components/PartDiagram'

// All 17 API categories with Turkish names (hardcoded — these don't change)
const STATIC_API_CATEGORIES: { id: string; name_tr: string }[] = [
  { id: 'engine', name_tr: 'Motor' },
  { id: 'turbo_intake', name_tr: 'Turbo & Emme' },
  { id: 'fuel', name_tr: 'Yakıt Sistemi' },
  { id: 'exhaust', name_tr: 'Egzoz' },
  { id: 'transmission', name_tr: 'Şanzıman' },
  { id: 'brake', name_tr: 'Fren' },
  { id: 'suspension', name_tr: 'Süspansiyon' },
  { id: 'wheel_tyre', name_tr: 'Jant & Lastik' },
  { id: 'body_exterior', name_tr: 'Kaporta & Dış' },
  { id: 'glass_mirror', name_tr: 'Cam & Ayna' },
  { id: 'lighting', name_tr: 'Aydınlatma' },
  { id: 'electrical', name_tr: 'Elektrik' },
  { id: 'climate', name_tr: 'Klima & Isıtma' },
  { id: 'interior', name_tr: 'İç Aksam' },
  { id: 'audio_media', name_tr: 'Ses & Medya' },
  { id: 'tow_transport', name_tr: 'Çeki & Taşıma' },
  { id: 'other', name_tr: 'Diğer' },
]

const PARTS_PER_PAGE = 20

// ── OEM Copy Button ──
function OemBadge({ oem }: { oem: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(oem)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-mono text-gray-600 hover:text-gray-900 hover:border-primary-400 transition-all" title="Kopyala">
      <span className="tracking-wider">{oem}</span>
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// ── Static view (no vehicle selected) — marka seçimi göster ──
function StaticCategoriesView() {
  const router = useRouter()
  const [brands, setBrands] = useState<{ name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAutodataBrands()
      .then(data => setBrands(data.brands || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getBrandLogo = (name: string): string => {
    const map: Record<string, string> = {
      'Mercedes-Benz': 'mercedes-benz.webp', 'Alfa Romeo': 'alfa-romeo.webp',
      'Land Rover': 'land-rover.webp', 'Aston Martin': 'aston-martin.webp',
      'Rolls-Royce': 'rolls-royce.webp',
    }
    return `/brands/${map[name] || name.toLowerCase().replace(/\s+/g, '-') + '.webp'}`
  }

  const handleBrandClick = (slug: string, name: string) => {
    router.push(`/parcalar?brand=${slug}&marka=${encodeURIComponent(name)}`)
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Marka Seçin</h2>
        <p className="text-gray-500">Aracınızın markasını seçerek parça kataloğuna ulaşın</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {brands.map(b => (
            <button
              key={b.slug}
              onClick={() => handleBrandClick(b.slug, b.name)}
              className="group flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getBrandLogo(b.name)} alt={b.name} className="w-12 h-12 object-contain" loading="lazy" />
              <span className="text-xs text-gray-700 font-medium text-center group-hover:text-primary-600 transition-colors">{b.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dynamic vehicle parts explorer ──
function VehiclePartsExplorer({ brand, gen, marka, modelName, generationName }: { brand: string; gen: string; marka: string; modelName: string; generationName?: string }) {
  type View = 'categories' | 'nodes' | 'parts'

  const [view, setView] = useState<View>('categories')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fallbackToGenerations, setFallbackToGenerations] = useState(false)

  // Data
  const [apiCategories, setApiCategories] = useState<VehicleCategory[]>([])
  const [totalParts, setTotalParts] = useState(0)
  const [nodes, setNodes] = useState<VehicleNode[]>([])
  const [parts, setParts] = useState<VehiclePart[]>([])

  // Selection
  const [selectedCat, setSelectedCat] = useState<VehicleCategory | null>(null)
  const [selectedNode, setSelectedNode] = useState<VehicleNode | null>(null)

  // Search & Pagination
  const [nodeSearch, setNodeSearch] = useState('')
  const [partSearch, setPartSearch] = useState('')
  const [partsPage, setPartsPage] = useState(1)

  // Vehicle image
  const [vehicleImage, setVehicleImage] = useState('')
  const searchParams = useSearchParams()
  const modelSlug = searchParams.get('model_slug')
  const modelKey = searchParams.get('model_key')

  // Marka logosu
  const brandLogo = marka ? getBrandLogoPath(marka) : ''

  // Load vehicle image — önce spesifik nesil adı, sonra vehicle-tree.json, en son genel model adı
  useEffect(() => {
    if (!marka) return
    let cancelled = false

    const loadImage = async () => {
      // 1. Spesifik nesil adı varsa önce onu dene (GenerationPicker'dan gelen)
      if (!cancelled && generationName) {
        const img = await findAutodataGenerationImage(marka, generationName)
        if (img && !cancelled) { setVehicleImage(img); return }
      }

      // 2. vehicle-tree.json'dan dene (URL'den gelen model slug ile)
      if (modelSlug) {
        try {
          const res = await fetch('/data/vehicle-tree.json')
          const tree = await res.json()
          const b = tree[marka]
          if (b) {
            for (const models of Object.values(b.body_types) as { slug: string; key: string; image: string }[][]) {
              const found = models.find((m: { slug: string; key: string }) => m.slug === modelSlug || m.key === modelKey)
              if (found && !cancelled) { setVehicleImage(found.image); return }
            }
          }
        } catch { /* devam et */ }
      }

      // 3. Fallback: genel model adı ile autodata görseli
      if (!cancelled && modelName) {
        const img = await findAutodataGenerationImage(marka, modelName)
        if (img && !cancelled) setVehicleImage(img)
      }
    }

    loadImage()
    return () => { cancelled = true }
  }, [marka, modelSlug, modelKey, gen, generationName])

  const handleCategoryClick = useCallback(async (cat: VehicleCategory) => {
    setSelectedCat(cat)
    setView('nodes')
    setLoading(true)
    setError('')
    setNodeSearch('')
    try {
      const data = await fetchVehicleNodes(brand, gen, cat.id)
      setNodes(data.nodes)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [brand, gen])

  // Load categories — anında statik isimlerle göster, arka planda sayıları doldur
  useEffect(() => {
    setError('')
    setFallbackToGenerations(false)

    // Anında statik kategorileri göster (sayılar 0 olarak, loading yok)
    const placeholder: VehicleCategory[] = STATIC_API_CATEGORIES.map((c, i) => ({
      id: c.id, name_tr: c.name_tr, name_en: c.id, icon: c.id,
      sort_order: i, total_parts: 0, node_count: 0,
    }))
    setApiCategories(placeholder)
    setLoading(false)

    // Arka planda gerçek sayıları fetch et
    fetchVehicleCategories(brand, gen)
      .then(data => {
        if (data.total_parts === 0 || data.categories.length === 0) {
          setFallbackToGenerations(true)
          return
        }
        setApiCategories(data.categories)
        setTotalParts(data.total_parts)

        // Auto-select preselected category from sessionStorage
        const preselect = sessionStorage.getItem('preselect_cat')
        if (preselect) {
          sessionStorage.removeItem('preselect_cat')
          const matched = data.categories.find(c => c.id === preselect)
          if (matched) {
            setTimeout(() => handleCategoryClick(matched), 0)
          }
        }
      })
      .catch(e => setError(e.message))
  }, [brand, gen, handleCategoryClick])

  const handleNodeClick = useCallback(async (node: VehicleNode) => {
    setSelectedNode(node)
    setView('parts')
    setLoading(true)
    setError('')
    setPartSearch('')
    setPartsPage(1)
    try {
      const data = await fetchVehicleParts(brand, gen, node.name)
      setParts(data.parts || [])
    } catch {
      setParts([])
    } finally {
      setLoading(false)
    }
  }, [brand, gen])

  const goBack = () => {
    if (view === 'parts') { setView('nodes'); setParts([]); setSelectedNode(null) }
    else if (view === 'nodes') { setView('categories'); setNodes([]); setSelectedCat(null) }
  }

  const whatsappText = `Merhaba, ${marka} ${modelName} aracım için parça arıyorum.${selectedCat ? `\nKategori: ${selectedCat.name_tr}` : ''}${selectedNode ? `\nGrup: ${selectedNode.label}` : ''}`

  // Filtered lists
  const filteredNodes = nodes.filter(n => !nodeSearch || n.label.toLowerCase().includes(nodeSearch.toLowerCase()))
  const filteredParts = parts.filter(p => !partSearch || p.name.toLowerCase().includes(partSearch.toLowerCase()) || p.oem_number.toLowerCase().includes(partSearch.toLowerCase()))
  const totalPages = Math.ceil(filteredParts.length / PARTS_PER_PAGE)
  const paginatedParts = filteredParts.slice((partsPage - 1) * PARTS_PER_PAGE, partsPage * PARTS_PER_PAGE)

  // If generation slug doesn't match DB, fallback to generation picker
  if (fallbackToGenerations) {
    return <GenerationPicker brand={brand} marka={marka} modelName={modelName} />
  }

  return (
    <>
      {/* Vehicle Banner */}
      <div className="mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-3 bg-primary-50 border-b border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary-500" />
              <span className="text-primary-600 text-sm font-medium">Seçili Araç</span>
            </div>
            <span className="text-xs text-gray-400 tabular-nums">{totalParts.toLocaleString('tr-TR')} parça</span>
          </div>
        </div>
        <div className="p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
          {vehicleImage ? (
            <div className="w-36 h-24 md:w-44 md:h-28 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vehicleImage} alt={modelName} className="w-full h-full object-contain p-2" />
            </div>
          ) : brandLogo && (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandLogo} alt={marka} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{marka} {modelName}</h2>
            <p className="text-sm text-gray-500 mt-1">Aşağıdan kategori seçin veya WhatsApp ile bize ulaşın.</p>
          </div>
          <a href={getWhatsAppUrl(whatsappText)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
            Parça Talep Et
          </a>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <button onClick={() => { setView('categories'); setSelectedCat(null); setSelectedNode(null) }}
          className={`transition-colors ${view === 'categories' ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}>
          Kategoriler
        </button>
        {selectedCat && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button onClick={() => { setView('nodes'); setSelectedNode(null) }}
              className={`transition-colors ${view === 'nodes' ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}>
              {selectedCat.name_tr}
            </button>
          </>
        )}
        {selectedNode && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{selectedNode.label}</span>
          </>
        )}
      </nav>

      {/* Loading */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── CATEGORIES VIEW ── */}
      {view === 'categories' && !loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apiCategories.map(cat => {
            const color = getCategoryColor(cat.id)
            return (
              <button key={cat.id} onClick={() => handleCategoryClick(cat)}
                className="group bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:border-primary-400 hover:shadow-md transition-all text-left">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <CategoryIcon id={cat.id} className="text-white" size={22} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold text-sm mb-1 group-hover:text-primary-500 transition-colors">{cat.name_tr}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">{cat.total_parts.toLocaleString('tr-TR')} parça</span>
                      <span className="text-gray-400 text-xs">{cat.node_count} grup</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── NODES VIEW ── */}
      {view === 'nodes' && !loading && !error && (
        <div>
          <button onClick={goBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kategorilere Dön
          </button>

          {/* Node Search */}
          {nodes.length > 10 && (
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={nodeSearch} onChange={e => setNodeSearch(e.target.value)} placeholder="Grup ara..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors" />
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNodes.map(node => (
              <button key={node.name} onClick={() => handleNodeClick(node)}
                className="group bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:border-primary-400 hover:shadow-md transition-all text-left flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-primary-500/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Package className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 group-hover:text-gray-900 font-medium transition-colors truncate">{node.label}</p>
                  <p className="text-xs text-gray-400">{node.part_count} parça</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
          {filteredNodes.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-10">Sonuç bulunamadı</p>
          )}
        </div>
      )}

      {/* ── PARTS VIEW ── */}
      {view === 'parts' && !loading && (
        <div>
          <button onClick={goBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {selectedCat?.name_tr || 'Geri'}
          </button>

          {/* Part Diagram */}
          {selectedNode && (
            <PartDiagram brand={brand} gen={gen} node={selectedNode.name} nodeLabel={selectedNode.label} />
          )}

          {parts.length > 0 ? (
            <>
              {/* Parts Search */}
              {parts.length > 10 && (
                <div className="relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={partSearch} onChange={e => { setPartSearch(e.target.value); setPartsPage(1) }} placeholder="Parça adı veya OEM numarası ara..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors" />
                </div>
              )}

              <p className="text-xs text-gray-400 mb-4">{filteredParts.length} parça listeleniyor</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginatedParts.map((part, i) => {
                  const detailParams = new URLSearchParams()
                  if (brand) detailParams.set('brand', brand)
                  if (gen) detailParams.set('gen', gen)
                  if (marka) detailParams.set('marka', marka)
                  if (modelName) detailParams.set('model_name', modelName)
                  if (selectedCat) { detailParams.set('cat', selectedCat.id); detailParams.set('cat_name', selectedCat.name_tr) }
                  if (selectedNode) { detailParams.set('node', selectedNode.name); detailParams.set('node_name', selectedNode.label) }
                  const detailHref = `/parca/${encodeURIComponent(part.oem_number)}?${detailParams.toString()}`

                  return (
                    <Link
                      key={`${part.oem_number}-${i}`}
                      href={detailHref}
                      className="group bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 text-left block"
                    >
                      <h4 className="text-gray-900 font-semibold text-sm mb-2 group-hover:text-primary-500 transition-colors leading-snug">{part.name}</h4>
                      <div className="mb-3">
                        <OemBadge oem={part.oem_number} />
                      </div>
                      <span className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 bg-primary-500/10 group-hover:bg-primary-500 text-primary-600 group-hover:text-dark-900 rounded-lg transition-all text-xs font-semibold">
                        Detay & Fiyat Al
                      </span>
                    </Link>
                  )
                })}
              </div>

              <Pagination currentPage={partsPage} totalPages={totalPages} onPageChange={setPartsPage} />

              {filteredParts.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-10">Aramanızla eşleşen parça bulunamadı</p>
              )}
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-1 text-sm">Bu grup için parça detayları yüklenemedi.</p>
              <p className="text-gray-400 text-xs mb-4">WhatsApp üzerinden bu gruptaki parçaları talep edebilirsiniz.</p>
              <a href={getWhatsAppUrl(`Merhaba, ${marka} ${modelName} için "${selectedNode?.label}" grubundaki parçalar hakkında bilgi almak istiyorum.`)}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp ile Talep Et
              </a>
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-10 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-gray-900 font-bold text-base mb-1">Aradığınız parça listede yok mu?</h4>
          <p className="text-gray-500 text-sm">WhatsApp&apos;tan talep gönderin, size en uygun parçayı bulalım.</p>
        </div>
        <a href={getWhatsAppUrl(whatsappText)} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> WhatsApp ile Talep Oluştur
        </a>
      </div>

    </>
  )
}

// ── Spec summary type for generation cards ──
interface GenSpecSummary {
  powerRange: string
  engineRange: string
  fuelTypes: string
  transmissions: string
}

function getBrandLogoPath(name: string): string {
  const overrides: Record<string, string> = {
    'Alfa Romeo': 'alfa-romeo.webp', 'Aston Martin': 'aston-martin.webp',
    'Land Rover': 'land-rover.webp', 'Mercedes-Benz': 'mercedes-benz.webp',
    'Rolls-Royce': 'rolls-royce.webp',
  }
  return `/brands/${overrides[name] || name.toLowerCase().replace(/\s+/g, '-') + '.webp'}`
}

function summarizeSpecs(specs: VehicleSpecRow[]): GenSpecSummary | null {
  if (!specs || specs.length === 0) return null
  const powers = specs.map(s => s.power_hp).filter((v): v is number => v != null && v > 0)
  const engines = specs.map(s => s.engine_cc).filter((v): v is number => v != null && v > 0)
  const fuels = Array.from(new Set(specs.map(s => s.fuel_type).filter(Boolean) as string[]))
  const trans = Array.from(new Set(specs.map(s => {
    const t = s.transmission
    if (!t) return null
    const lower = t.toLowerCase()
    if (lower.includes('otomatik') || lower.includes('automatic') || lower.includes('auto')) return 'Otomatik'
    if (lower.includes('manuel') || lower.includes('manual')) return 'Manuel'
    if (lower.includes('cvt')) return 'CVT'
    if (lower.includes('robot')) return 'Robot'
    return t.split(' ')[0]
  }).filter(Boolean) as string[]))

  const minP = powers.length ? Math.min(...powers) : 0
  const maxP = powers.length ? Math.max(...powers) : 0
  const minE = engines.length ? Math.min(...engines) : 0
  const maxE = engines.length ? Math.max(...engines) : 0

  return {
    powerRange: powers.length === 0 ? '' : minP === maxP ? `${minP} HP` : `${minP}–${maxP} HP`,
    engineRange: engines.length === 0 ? '' : minE === maxE ? `${minE} cc` : `${minE}–${maxE} cc`,
    fuelTypes: fuels.join(', '),
    transmissions: trans.join(', '),
  }
}

// ── Model Picker (when brand is known but model_name is missing) ──
function ModelPicker({ brand, marka }: { brand: string; marka: string }) {
  const [models, setModels] = useState<AutodataModel[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchAutodataModels(brand)
      .then(data => setModels(data.models || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [brand])

  const handleModelClick = (model: AutodataModel) => {
    router.push(`/parcalar?brand=${brand}&marka=${encodeURIComponent(marka)}&model_name=${encodeURIComponent(model.name)}`)
  }

  return (
    <>
      {/* Vehicle Banner */}
      <div className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-5">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getBrandLogoPath(marka)} alt={marka} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{marka}</h2>
            <p className="text-sm text-gray-500 mt-1">Aracınızın modelini seçin</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2" aria-hidden="true">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          ))}
        </div>
      ) : models.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {models.map(m => (
            <button
              key={m.name}
              onClick={() => handleModelClick(m)}
              className="group bg-white border border-gray-200 hover:border-primary-400 hover:shadow-md rounded-xl p-4 text-left transition-all"
            >
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{m.name}</p>
              <p className="text-xs text-gray-400 mt-1">{m.gen_count} nesil{m.min_year && m.max_year ? ` · ${m.min_year}–${m.max_year}` : ''}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600 mb-4">Bu marka için model bilgisi bulunamadı.</p>
          <a href={getWhatsAppUrl(`Merhaba, ${marka} aracım için parça arıyorum.`)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <MessageCircle className="w-4 h-4" /> WhatsApp ile Talep Et
          </a>
        </div>
      )}
    </>
  )
}

// ── Generation Picker (when brand is known but gen is missing) ──
function GenerationPicker({ brand, marka, modelName }: { brand: string; marka: string; modelName: string }) {
  // Autodata generations (richer data)
  const [autodataGens, setAutodataGens] = useState<AutodataGeneration[]>([])
  // Fallback: parts DB generations
  const [dbGenerations, setDbGenerations] = useState<Array<{ generation_slug: string; generation_name: string; part_count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')
  const [selectedGen, setSelectedGen] = useState<string | null>(null)
  const [selectedGenName, setSelectedGenName] = useState<string | null>(null)
  const [useAutodata, setUseAutodata] = useState(false)

  // New states for enhanced UX
  const [genImages, setGenImages] = useState<Record<string, string>>({})
  const [genSpecs, setGenSpecs] = useState<Record<string, GenSpecSummary>>({})
  const [selectedGenDisplay, setSelectedGenDisplay] = useState<{ name: string; yearRange: string; image?: string; specs?: GenSpecSummary } | null>(null)
  const [activeBodyType, setActiveBodyType] = useState('__all__')
  const fetchedSpecsRef = useRef<Set<string>>(new Set())

  // Read autodata_gen / autodata_year from URL (passed by VehicleSelector on resolve fail)
  const genSearchParams = useSearchParams()
  const autodataGen = genSearchParams.get('autodata_gen')
  const autodataYear = genSearchParams.get('autodata_year')

  // Helper: filter matches/generations by model name relevance
  const filterByModel = useCallback((matches: Array<{ generation_slug: string; generation_name: string; part_count: number }>) => {
    if (!modelName) return matches

    // "3 Serisi" → ["3", "serisi"], "X5" → ["x5"], "Golf" → ["golf"]
    const modelWords = modelName.toLowerCase().split(/\s+/).filter(Boolean)
    const baseModel = modelWords[0]
    if (!baseModel) return matches

    // "Serisi" gibi genel kelimeleri çıkar, asıl model tanımlayıcısını bul
    const genericWords = ['serisi', 'series', 'class', 'klasse', 'sınıfı']
    const significantWords = modelWords.filter(w => !genericWords.includes(w))

    return matches.filter(m => {
      const name = m.generation_name.toLowerCase()
      const slug = m.generation_slug.toLowerCase()

      // Kısa sayısal model isimleri için (3, 5, 7 gibi): "3 serisi" → generation'da "3" ile başlaması lazım
      if (baseModel.length <= 2 && /^\d+$/.test(baseModel)) {
        // "3 Serisi (E90)" gibi generation_name'lerde "3 " ile başlama veya "3-" içerme kontrolü
        const pattern = new RegExp(`\\b${baseModel}\\b`)
        return pattern.test(name) || pattern.test(slug)
      }

      // Uzun model isimleri için: herhangi bir önemli kelime generation_name'de geçmeli
      if (significantWords.length > 0) {
        return significantWords.some(w => name.includes(w) || slug.includes(w))
      }

      return name.startsWith(baseModel) || name.includes(baseModel)
    })
  }, [modelName])

  // Fetch generation images — model+body_type bazlı tek görsel (aynı model için tek fetch)
  useEffect(() => {
    if (!marka || autodataGens.length === 0) return
    setGenImages({})
    let cancelled = false
    const fetchImages = async () => {
      // Model adına göre grupla — her grup için sadece 1 fetch yap
      const modelGroups = new Map<string, string[]>() // modelBaseKey → genKey[]
      for (const gen of autodataGens) {
        const genKey = `${gen.name}-${gen.body_type}`
        // Model adını nesil adından çıkar (ilk kelime)
        const modelBase = gen.name.split(/[\s(]/)[0].toLowerCase()
        const groupKey = `${modelBase}_${gen.body_type || ''}`
        if (!modelGroups.has(groupKey)) modelGroups.set(groupKey, [])
        modelGroups.get(groupKey)!.push(genKey)
      }

      // Her model grubu için tek bir neslin görselini fetch et
      const fetched = new Map<string, string | null>()
      const uniqueGens = Array.from(modelGroups.entries()).map(([groupKey, genKeys]) => {
        // Grubun ilk nesil adını kullan (representative)
        const repGen = autodataGens.find(g => `${g.name}-${g.body_type}` === genKeys[0])!
        return { groupKey, genKeys, repGen }
      })

      const results = await Promise.all(
        uniqueGens.map(async ({ groupKey, repGen }) => {
          const img = await findAutodataGenerationImage(marka, repGen.name)
          return { groupKey, img }
        })
      )
      if (cancelled) return

      for (const { groupKey, img } of results) {
        fetched.set(groupKey, img)
      }

      // Tüm nesillere model grubunun görselini ata
      const images: Record<string, string> = {}
      for (const [groupKey, genKeys] of Array.from(modelGroups.entries())) {
        const img = fetched.get(groupKey)
        if (img) {
          for (const gk of genKeys) images[gk] = img
        }
      }
      setGenImages(images)
    }
    fetchImages()
    return () => { cancelled = true }
  }, [marka, autodataGens])

  // Lazy fetch specs on hover/focus
  const prefetchSpec = useCallback((gen: AutodataGeneration) => {
    const key = `${gen.name}-${gen.body_type}`
    if (fetchedSpecsRef.current.has(key) || !brand || !modelName) return
    fetchedSpecsRef.current.add(key)
    fetchVehicleSpecs(brand, gen.name, gen.year_start ?? undefined, modelName)
      .then(data => {
        const summary = summarizeSpecs(data.specs)
        if (summary) setGenSpecs(prev => ({ ...prev, [key]: summary }))
      })
      .catch(() => {})
  }, [brand, modelName])

  // Body type tabs derived from autodata generations
  const bodyTypeTabs = useMemo(() => {
    if (autodataGens.length < 3) return []
    const counts = new Map<string, number>()
    for (const gen of autodataGens) {
      const bt = gen.body_type || 'Diger'
      counts.set(bt, (counts.get(bt) || 0) + 1)
    }
    if (counts.size < 2) return []
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }))
  }, [autodataGens])

  // Filtered generations by body type
  const filteredAutodataGens = useMemo(() => {
    if (activeBodyType === '__all__') return autodataGens
    return autodataGens.filter(g => (g.body_type || 'Diger') === activeBodyType)
  }, [autodataGens, activeBodyType])

  // Auto-resolve when autodata_gen is present in URL — handles everything in one effect
  useEffect(() => {
    if (!autodataGen || !brand || !modelName) return
    setResolving(true)
    setLoading(false)
    setError('')

    // Run resolve + DB generations in parallel
    const resolvePromise = resolveAutodataSlug(brand, modelName, autodataGen, autodataYear ? parseInt(autodataYear) : undefined)
      .catch(() => null)
    const dbPromise = fetchGenerations(brand)
      .then(data => data.generations || [])
      .catch(() => [] as Array<{ generation_slug: string; generation_name: string; part_count: number }>)

    Promise.all([resolvePromise, dbPromise]).then(([result, allDbGens]) => {
      // Try auto_selected first
      if (result?.auto_selected) {
        setSelectedGen(result.auto_selected)
        return
      }

      // Filter resolve matches by model name
      const relevantMatches = result?.matches ? filterByModel(result.matches) : []
      if (relevantMatches.length === 1) {
        setSelectedGen(relevantMatches[0].generation_slug)
        return
      }
      if (relevantMatches.length > 1) {
        setDbGenerations(relevantMatches)
        setUseAutodata(false)
        setResolving(false)
        return
      }

      // Filter DB generations by model name
      const relevantDbGens = filterByModel(allDbGens)
      if (relevantDbGens.length === 1) {
        setSelectedGen(relevantDbGens[0].generation_slug)
        return
      }
      if (relevantDbGens.length > 1) {
        setDbGenerations(relevantDbGens)
        setUseAutodata(false)
        setResolving(false)
        return
      }

      // No relevant generations at all → no parts catalog
      setError('no_parts')
      setResolving(false)
    })
  }, [autodataGen, autodataYear, brand, modelName, filterByModel])

  // Normal generation loading (no autodata_gen in URL)
  useEffect(() => {
    if (autodataGen) return

    setLoading(true)
    setError('')

    // Pre-fetch DB generations filtered by modelName
    const dbPromise = fetchGenerations(brand)
      .then(data => {
        let gens = data.generations || []
        const filtered = filterByModel(gens)
        if (filtered.length > 0) gens = filtered
        setDbGenerations(gens)
        return gens
      })
      .catch(() => [] as Array<{ generation_slug: string; generation_name: string; part_count: number }>)

    // If we have a model_name, try autodata first
    if (modelName) {
      fetchAutodataGenerations(brand, modelName)
        .then(async data => {
          if (data.generations && data.generations.length > 0) {
            setAutodataGens(data.generations)
            setUseAutodata(true)
            setLoading(false)
          } else {
            const dbGens = await dbPromise
            setUseAutodata(false)
            if (dbGens.length === 1) {
              setSelectedGen(dbGens[0].generation_slug)
            }
            setLoading(false)
          }
        })
        .catch(async () => {
          const dbGens = await dbPromise
          setUseAutodata(false)
          if (dbGens.length === 1) {
            setSelectedGen(dbGens[0].generation_slug)
          }
          setLoading(false)
        })
    } else {
      dbPromise.then(dbGens => {
        setUseAutodata(false)
        if (dbGens.length === 1) {
          setSelectedGen(dbGens[0].generation_slug)
        }
        setLoading(false)
      })
    }
  }, [brand, modelName, autodataGen, filterByModel])

  // Handle autodata generation selection — resolve to parts DB slug
  const handleAutodataSelect = async (gen: AutodataGeneration) => {
    const genKey = `${gen.name}-${gen.body_type}`
    const yearRange = `${gen.year_start || '?'}–${gen.year_end || 'gunumuz'}`
    setSelectedGenDisplay({
      name: gen.name,
      yearRange,
      image: genImages[genKey],
      specs: genSpecs[genKey],
    })
    setSelectedGenName(gen.name)
    setResolving(true)
    setError('')

    // 15 saniye timeout — API aşırı yavaşsa takılmayı önle
    const timeout = setTimeout(() => {
      setResolving(false)
      setError('no_parts')
      setSelectedGenDisplay(null)
    }, 15000)

    try {
      const result = await resolveAutodataSlug(brand, modelName, gen.name, gen.year_start ?? undefined)
      clearTimeout(timeout)
      if (result.auto_selected) {
        setSelectedGen(result.auto_selected)
      } else if (result.matches.length === 1) {
        setSelectedGen(result.matches[0].generation_slug)
      } else if (result.matches.length > 1) {
        const relevant = filterByModel(result.matches)
        if (relevant.length === 1) {
          setSelectedGen(relevant[0].generation_slug)
        } else if (relevant.length > 1) {
          setDbGenerations(relevant)
          setAutodataGens([])
          setUseAutodata(false)
          setResolving(false)
          setSelectedGenDisplay(null)
        } else {
          const relevantDb = filterByModel(dbGenerations)
          if (relevantDb.length > 0) {
            setDbGenerations(relevantDb)
            setAutodataGens([])
            setUseAutodata(false)
          } else {
            setError('no_parts')
          }
          setResolving(false)
          setSelectedGenDisplay(null)
        }
      } else {
        const relevantDb = filterByModel(dbGenerations)
        if (relevantDb.length > 0) {
          setDbGenerations(relevantDb)
          setAutodataGens([])
          setUseAutodata(false)
        } else {
          setError('no_parts')
        }
        setResolving(false)
        setSelectedGenDisplay(null)
      }
    } catch {
      clearTimeout(timeout)
      const relevantDb = filterByModel(dbGenerations)
      if (relevantDb.length > 0) {
        setDbGenerations(relevantDb)
        setAutodataGens([])
        setUseAutodata(false)
      } else {
        setError('no_parts')
      }
      setResolving(false)
      setSelectedGenDisplay(null)
    }
  }

  const whatsappText = `Merhaba, ${marka} ${modelName} aracim icin parca ariyorum.`
  const [genSearch, setGenSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Nesil arama filtresi
  const searchFilteredAutodataGens = useMemo(() => {
    if (!genSearch.trim()) return filteredAutodataGens
    const q = genSearch.toLowerCase()
    return filteredAutodataGens.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.body_type && g.body_type.toLowerCase().includes(q)) ||
      `${g.year_start}`.includes(q) ||
      `${g.year_end}`.includes(q)
    )
  }, [filteredAutodataGens, genSearch])

  const searchFilteredDbGens = useMemo(() => {
    if (!genSearch.trim()) return dbGenerations
    const q = genSearch.toLowerCase()
    return dbGenerations.filter(g =>
      g.generation_name.toLowerCase().includes(q) ||
      g.generation_slug.toLowerCase().includes(q)
    )
  }, [dbGenerations, genSearch])

  // If a generation is selected, show the full parts explorer
  if (selectedGen) {
    return <VehiclePartsExplorer brand={brand} gen={selectedGen} marka={marka} modelName={modelName} generationName={selectedGenName || undefined} />
  }

  return (
    <>
      {/* Vehicle Banner — gradient hero */}
      <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-secondary-800 via-secondary-700 to-secondary-600 shadow-lg">
        <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5 md:gap-8">
          {/* Marka logo */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getBrandLogoPath(marka)} alt={marka} className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-white">{marka} {modelName}</h2>
            <p className="text-secondary-200 text-sm mt-2">Aracınızın nesil/dönemini seçerek parça kataloğuna ulaşın</p>
            {!loading && useAutodata && autodataGens.length > 0 && (
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-xs font-medium text-white">
                  <Car className="w-3.5 h-3.5" />
                  {autodataGens.length} nesil
                </span>
                {bodyTypeTabs.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-xs font-medium text-white">
                    {bodyTypeTabs.length} kasa tipi
                  </span>
                )}
              </div>
            )}
          </div>
          <a href={getWhatsAppUrl(whatsappText)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-all flex-shrink-0 text-sm shadow-lg shadow-green-500/30 hover:shadow-green-400/40">
            <MessageCircle className="w-4 h-4" />
            Parça Talep Et
          </a>
        </div>
      </div>

      {/* Resolving overlay — visual confirmation card */}
      {resolving && (
        <div className="mb-8">
          <div className="bg-white border-2 border-primary-200 rounded-2xl overflow-hidden shadow-md">
            <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
              {selectedGenDisplay?.image ? (
                <div className="w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedGenDisplay.image} alt={selectedGenDisplay.name} className="w-full h-full object-contain p-2" />
                </div>
              ) : (
                <div className="w-36 h-24 sm:w-44 sm:h-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getBrandLogoPath(marka)} alt={marka} className="w-12 h-12 object-contain opacity-30" />
                </div>
              )}
              <div className="flex-1 text-center sm:text-left min-w-0">
                {selectedGenDisplay ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-900">{selectedGenDisplay.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedGenDisplay.yearRange}</p>
                    {selectedGenDisplay.specs && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        {selectedGenDisplay.specs.powerRange && (
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" />{selectedGenDisplay.specs.powerRange}</span>
                        )}
                        {selectedGenDisplay.specs.fuelTypes && (
                          <span className="flex items-center gap-1"><Fuel className="w-3 h-3 text-blue-500" />{selectedGenDisplay.specs.fuelTypes}</span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600 font-medium">Parça kataloğu eşleştiriliyor...</p>
                )}
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
                <span className="text-xs text-gray-400">Yükleniyor...</span>
              </div>
            </div>
            {/* Animated progress bar */}
            <div className="h-1.5 bg-primary-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-r-full animate-pulse" style={{ width: '60%', animation: 'pulse 1.5s ease-in-out infinite, slideRight 2s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* Loading state (initial) */}
      {loading && !resolving && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <GenerationCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error === 'no_parts' && !loading && !resolving && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-2">Parça kataloğu henüz hazır değil</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            {marka} {modelName} için parça kataloğu henüz sistemimizde bulunmuyor. WhatsApp üzerinden talep oluşturabilirsiniz.
          </p>
          <a href={getWhatsAppUrl(whatsappText)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-md">
            <MessageCircle className="w-5 h-5" /> WhatsApp ile Talep Et
          </a>
        </div>
      )}

      {error && error !== 'no_parts' && !loading && !resolving && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Autodata generations — visual cards with images and specs */}
      {!loading && !resolving && !error && useAutodata && autodataGens.length > 0 && (
        <div>
          {/* Toolbar: Body type tabs + Search + View toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            {/* Body Type Tabs */}
            {bodyTypeTabs.length > 0 && (
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <Tabs
                  tabs={[
                    { id: '__all__', label: 'Tümü', count: autodataGens.length },
                    ...bodyTypeTabs.map(({ type, count }) => ({ id: type, label: type, count })),
                  ]}
                  activeTab={activeBodyType}
                  onChange={setActiveBodyType}
                />
              </div>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Arama */}
              {autodataGens.length > 6 && (
                <div className="relative flex-1 sm:flex-none sm:w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={genSearch}
                    onChange={e => setGenSearch(e.target.value)}
                    placeholder="Nesil ara..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>
              )}
              {/* Görünüm değiştirici */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Izgara görünüm"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Liste görünüm"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sonuç sayısı */}
          {genSearch && (
            <p className="text-xs text-gray-400 mb-3">{searchFilteredAutodataGens.length} nesil eşleşiyor</p>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchFilteredAutodataGens.map((gen) => {
                const genKey = `${gen.name}-${gen.body_type}`
                const genImg = genImages[genKey]
                const specs = genSpecs[genKey]
                return (
                  <button
                    key={genKey}
                    onClick={() => handleAutodataSelect(gen)}
                    onMouseEnter={() => prefetchSpec(gen)}
                    onFocus={() => prefetchSpec(gen)}
                    className="group bg-white border border-gray-200 hover:border-primary-400 hover:shadow-lg rounded-xl overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {/* Nesil görseli */}
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
                      {genImg ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={genImg}
                          alt={gen.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getBrandLogoPath(marka)} alt={marka} className="w-12 h-12 object-contain opacity-15" />
                        </div>
                      )}
                      {/* Yıl badge */}
                      {(gen.year_start || gen.year_end) && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-medium text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3" />
                          {gen.year_start || '?'}–{gen.year_end || 'günümüz'}
                        </span>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors duration-300" />
                    </div>

                    {/* Kart gövdesi */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">{gen.name}</p>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                        {gen.body_type && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600 font-medium">{gen.body_type}</span>
                        )}
                        <span className="text-[11px] text-gray-400">{gen.mod_count} varyant</span>
                      </div>

                      {/* Teknik özellikler */}
                      <div className="mt-3 pt-3 border-t border-gray-100 min-h-[48px]">
                        {specs && (specs.powerRange || specs.fuelTypes) ? (
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            {specs.powerRange && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="truncate">{specs.powerRange}</span>
                              </div>
                            )}
                            {specs.engineRange && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <Settings2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{specs.engineRange}</span>
                              </div>
                            )}
                            {specs.fuelTypes && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <Fuel className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="truncate">{specs.fuelTypes}</span>
                              </div>
                            )}
                            {specs.transmissions && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <Settings2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                <span className="truncate">{specs.transmissions}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Settings2 className="w-3 h-3 flex-shrink-0" />
                            <span>{gen.mod_count} varyant mevcut</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {searchFilteredAutodataGens.map((gen) => {
                const genKey = `${gen.name}-${gen.body_type}`
                const genImg = genImages[genKey]
                const specs = genSpecs[genKey]
                return (
                  <button
                    key={genKey}
                    onClick={() => handleAutodataSelect(gen)}
                    onMouseEnter={() => prefetchSpec(gen)}
                    onFocus={() => prefetchSpec(gen)}
                    className="group w-full bg-white border border-gray-200 hover:border-primary-400 hover:shadow-md rounded-xl p-3 md:p-4 text-left transition-all duration-200 flex items-center gap-4"
                  >
                    {/* Küçük görsel */}
                    <div className="w-24 h-16 md:w-32 md:h-20 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden flex-shrink-0">
                      {genImg ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={genImg} alt={gen.name} className="w-full h-full object-contain p-1" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getBrandLogoPath(marka)} alt={marka} className="w-8 h-8 object-contain opacity-15" />
                        </div>
                      )}
                    </div>

                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{gen.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {(gen.year_start || gen.year_end) && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {gen.year_start || '?'}–{gen.year_end || 'günümüz'}
                          </span>
                        )}
                        {gen.body_type && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600 font-medium">{gen.body_type}</span>
                        )}
                        <span className="text-[11px] text-gray-400">{gen.mod_count} varyant</span>
                      </div>
                      {/* Spec satırı */}
                      {specs && (specs.powerRange || specs.fuelTypes) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-gray-500">
                          {specs.powerRange && <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" />{specs.powerRange}</span>}
                          {specs.fuelTypes && <span className="flex items-center gap-1"><Fuel className="w-3 h-3 text-blue-500" />{specs.fuelTypes}</span>}
                          {specs.transmissions && <span className="flex items-center gap-1"><Settings2 className="w-3 h-3 text-purple-400" />{specs.transmissions}</span>}
                        </div>
                      )}
                    </div>

                    {/* Ok */}
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Arama sonuç yok */}
          {genSearch && searchFilteredAutodataGens.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">&ldquo;{genSearch}&rdquo; ile eşleşen nesil bulunamadı</p>
              <button onClick={() => setGenSearch('')} className="mt-2 text-primary-500 hover:text-primary-600 text-sm font-medium">Aramayı temizle</button>
            </div>
          )}
        </div>
      )}

      {/* DB generations fallback — enhanced cards */}
      {!loading && !resolving && !error && !useAutodata && dbGenerations.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{dbGenerations.length} nesil bulundu</h3>
                <p className="text-gray-500 text-xs">Doğru nesil/dönem seçimi daha iyi parça listesi sağlar</p>
              </div>
            </div>
            {dbGenerations.length > 6 && (
              <div className="relative w-48 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={genSearch}
                  onChange={e => setGenSearch(e.target.value)}
                  placeholder="Ara..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {searchFilteredDbGens.map((gen) => (
              <button
                key={gen.generation_slug}
                onClick={() => setSelectedGen(gen.generation_slug)}
                className="group bg-white border border-gray-200 hover:border-primary-400 hover:shadow-lg rounded-xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-900 font-bold text-sm group-hover:text-primary-600 transition-colors leading-snug">{gen.generation_name}</p>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 border border-primary-100 rounded-lg text-xs font-medium text-primary-600 tabular-nums">
                    <Package className="w-3 h-3" />
                    {gen.part_count.toLocaleString('tr-TR')} parça
                  </span>
                </div>
              </button>
            ))}
          </div>
          {genSearch && searchFilteredDbGens.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">&ldquo;{genSearch}&rdquo; ile eşleşen nesil bulunamadı</p>
              <button onClick={() => setGenSearch('')} className="mt-2 text-primary-500 hover:text-primary-600 text-sm font-medium">Aramayı temizle</button>
            </div>
          )}
        </div>
      )}

      {!loading && !resolving && !error && (useAutodata ? autodataGens.length === 0 : dbGenerations.length === 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-2">Nesil bilgisi bulunamadı</h3>
          <p className="text-gray-500 text-sm mb-6">WhatsApp üzerinden parça talebinde bulunabilirsiniz.</p>
          <a href={getWhatsAppUrl(whatsappText)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md">
            <MessageCircle className="w-4 h-4" /> WhatsApp ile Talep Et
          </a>
        </div>
      )}
    </>
  )
}

// ── OEM Search Results View ──
function OemSearchView({ query }: { query: string }) {
  const [results, setResults] = useState<{ oem_number: string; name: string; brand_slug?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!query) return
    setLoading(true)
    searchOemParts(query)
      .then(data => setResults(data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [query])

  // Aynı OEM numaralarını grupla — her OEM'den sadece biri gösterilsin, uyumlu araç sayısı badge olarak
  const uniqueParts = useMemo(() => {
    const map = new Map<string, { oem_number: string; name: string; count: number }>()
    for (const r of results) {
      const existing = map.get(r.oem_number)
      if (existing) {
        existing.count++
      } else {
        map.set(r.oem_number, { oem_number: r.oem_number, name: r.name, count: 1 })
      }
    }
    return Array.from(map.values())
  }, [results])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (uniqueParts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-gray-900 font-semibold mb-2">&ldquo;{query}&rdquo; için sonuç bulunamadı</h3>
        <p className="text-gray-500 text-sm mb-5">Farklı bir arama terimi deneyin veya WhatsApp ile bize ulaşın.</p>
        <a href={getWhatsAppUrl(`Merhaba, "${query}" araması için yardım istiyorum.`)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <MessageCircle className="w-4 h-4" /> WhatsApp ile Talep Et
        </a>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">&ldquo;{query}&rdquo; için {uniqueParts.length} parça bulundu</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {uniqueParts.map((part) => (
          <Link
            key={part.oem_number}
            href={`/parca/${encodeURIComponent(part.oem_number)}`}
            className="group bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all block"
          >
            <h4 className="text-gray-900 font-semibold text-sm mb-2 group-hover:text-primary-500 transition-colors leading-snug">{part.name}</h4>
            <div className="mb-3">
              <OemBadge oem={part.oem_number} />
            </div>
            <span className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 bg-primary-500/10 group-hover:bg-primary-500 text-primary-600 group-hover:text-dark-900 rounded-lg transition-all text-xs font-semibold">
              Detay & Fiyat Al
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──
function ParcalarContent() {
  const searchParams = useSearchParams()
  const brand = searchParams.get('brand')
  const gen = searchParams.get('gen')
  const marka = searchParams.get('marka')
  const modelName = searchParams.get('model_name')
  const qParam = searchParams.get('q')

  // Durum tespiti
  const hasVehicleWithGen = brand && gen && marka && modelName
  const hasBrandWithModel = brand && marka && modelName && !gen
  const hasBrandOnly = brand && marka && !modelName && !gen
  const hasSearch = qParam && !brand && !gen

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          {brand ? (
            <Link href="/parcalar" className="hover:text-gray-900 transition-colors">Parçalar</Link>
          ) : (
            <span className="text-gray-900">Parçalar</span>
          )}
          {marka && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-500">{marka} {modelName || ''}</span>
            </>
          )}
          {hasSearch && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-500">Arama: {qParam}</span>
            </>
          )}
        </nav>

        {hasVehicleWithGen ? (
          <VehiclePartsExplorer brand={brand} gen={gen} marka={marka} modelName={modelName} />
        ) : hasBrandWithModel ? (
          <GenerationPicker brand={brand} marka={marka} modelName={modelName} />
        ) : hasBrandOnly ? (
          <ModelPicker brand={brand} marka={marka} />
        ) : hasSearch ? (
          <OemSearchView query={qParam} />
        ) : (
          <StaticCategoriesView />
        )}

        {/* CTA Section */}
        {!hasVehicleWithGen && !hasBrandWithModel && !hasBrandOnly && (
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-secondary-700 to-secondary-900 rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Aradığınız Parçayı Bulamadınız mı?</h2>
              <p className="text-gray-300 mb-6 max-w-xl mx-auto">WhatsApp üzerinden bize ulaşın, şase numaranızı ve ihtiyacınız olan parçayı belirtin.</p>
              <a href={getWhatsAppUrl('Merhaba, bir parça arıyorum. Yardımcı olur musunuz?')} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all">
                WhatsApp ile Sorun
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ParcalarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ParcalarContent />
    </Suspense>
  )
}
