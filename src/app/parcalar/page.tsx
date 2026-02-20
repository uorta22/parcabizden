'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Car, ChevronRight, ChevronLeft, Search, MessageCircle, Loader2, AlertCircle, Package, Copy, Check } from 'lucide-react'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'
import { fetchVehicleCategories, fetchVehicleNodes, fetchVehicleParts, fetchGenerations, searchOemParts } from '@/lib/api'
import type { VehicleCategory, VehicleNode, VehiclePart } from '@/lib/api'
import PartDetailModal from '@/components/PartDetailModal'
import BrandPicker from '@/components/BrandPicker'

// Category icon/color mapping for API categories
const catStyleMap: Record<string, { color: string; icon: string }> = {
  engine: { color: 'from-red-500 to-orange-500', icon: '🔧' },
  turbo_intake: { color: 'from-sky-500 to-blue-500', icon: '💨' },
  fuel: { color: 'from-amber-500 to-yellow-500', icon: '⛽' },
  exhaust: { color: 'from-gray-500 to-slate-500', icon: '🏭' },
  transmission: { color: 'from-blue-500 to-cyan-500', icon: '⚙️' },
  brake: { color: 'from-purple-500 to-pink-500', icon: '🛑' },
  suspension: { color: 'from-green-500 to-emerald-500', icon: '🔩' },
  wheel_tyre: { color: 'from-gray-600 to-gray-500', icon: '🛞' },
  body_exterior: { color: 'from-yellow-500 to-orange-500', icon: '🚗' },
  glass_mirror: { color: 'from-teal-500 to-cyan-500', icon: '🪞' },
  lighting: { color: 'from-amber-400 to-yellow-500', icon: '💡' },
  electrical: { color: 'from-cyan-500 to-blue-500', icon: '⚡' },
  climate: { color: 'from-indigo-500 to-blue-500', icon: '❄️' },
  interior: { color: 'from-violet-500 to-purple-500', icon: '💺' },
  audio_media: { color: 'from-pink-500 to-rose-500', icon: '🔊' },
  tow_transport: { color: 'from-stone-500 to-gray-500', icon: '🪝' },
  other: { color: 'from-gray-500 to-gray-600', icon: '📦' },
}

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

// ── Static view (no vehicle selected) ──
function StaticCategoriesView() {
  const brandPickerRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  const handleCategorySelect = (cat: { id: string; name_tr: string }) => {
    sessionStorage.setItem('preselect_cat', cat.id)
    setToast(`${cat.name_tr} parçalarını görmek için araç seçin`)
    brandPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* Brand Picker — API-first approach */}
      <div ref={brandPickerRef}>
        <BrandPicker />
      </div>

      {/* Toast / info banner */}
      {toast && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-xl animate-in fade-in">
          <Car className="w-5 h-5 text-primary-500 flex-shrink-0" />
          <p className="text-primary-700 text-sm font-medium">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-auto text-primary-400 hover:text-primary-600 text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <Link href="/sase-sorgula" className="flex items-center gap-4 p-6 bg-white border border-gray-200 shadow-sm rounded-2xl hover:border-primary-500/50 transition-all group">
          <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
            <Search className="w-7 h-7 text-primary-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-lg mb-1">Şase Numarası ile Ara</h3>
            <p className="text-gray-500 text-sm">Aracınıza uygun parçaları bulmak için şase numaranızı girin</p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </Link>
      </div>

      {/* API Category Grid */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Parça Kategorileri</h2>
        <p className="text-sm text-gray-500 mb-5">Kategori seçmek için önce yukarıdan araç belirleyin.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {STATIC_API_CATEGORIES.map(cat => {
            const style = catStyleMap[cat.id] || catStyleMap.other
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="group bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:border-primary-400 hover:shadow-md transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform text-base`}>
                  {style.icon}
                </div>
                <h3 className="text-gray-900 font-medium text-sm group-hover:text-primary-500 transition-colors">{cat.name_tr}</h3>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ── Dynamic vehicle parts explorer ──
function VehiclePartsExplorer({ brand, gen, marka, modelName }: { brand: string; gen: string; marka: string; modelName: string }) {
  type View = 'categories' | 'nodes' | 'parts'

  const [view, setView] = useState<View>('categories')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  // Modal
  const [selectedApiPart, setSelectedApiPart] = useState<VehiclePart | null>(null)

  // Vehicle image
  const [vehicleImage, setVehicleImage] = useState('')
  const searchParams = useSearchParams()
  const modelSlug = searchParams.get('model_slug')
  const modelKey = searchParams.get('model_key')

  // Load vehicle image
  useEffect(() => {
    if (!marka || !modelSlug) return
    fetch('/data/vehicle-tree.json')
      .then(r => r.json())
      .then(tree => {
        const b = tree[marka]
        if (!b) return
        for (const models of Object.values(b.body_types) as { slug: string; key: string; image: string }[][]) {
          const found = models.find((m: { slug: string; key: string }) => m.slug === modelSlug || m.key === modelKey)
          if (found) { setVehicleImage(found.image); return }
        }
      })
      .catch(() => {})
  }, [marka, modelSlug, modelKey])

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

  // Load categories
  useEffect(() => {
    setLoading(true)
    setError('')
    fetchVehicleCategories(brand, gen)
      .then(data => {
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
      .finally(() => setLoading(false))
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
  const paginatedParts = filteredParts.slice(0, partsPage * PARTS_PER_PAGE)
  const remainingParts = filteredParts.length - paginatedParts.length

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
          {vehicleImage && (
            <div className="w-36 h-24 md:w-44 md:h-28 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vehicleImage} alt={modelName} className="w-full h-full object-contain p-2" />
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
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
            const style = catStyleMap[cat.id] || catStyleMap.other
            return (
              <button key={cat.id} onClick={() => handleCategoryClick(cat)}
                className="group bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:border-primary-400 hover:shadow-md transition-all text-left">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-lg`}>
                    {cat.icon}
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
                {paginatedParts.map((part, i) => (
                  <button
                    key={`${part.oem_number}-${i}`}
                    onClick={() => setSelectedApiPart(part)}
                    className="group bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 text-left"
                  >
                    <h4 className="text-gray-900 font-semibold text-sm mb-2 group-hover:text-primary-500 transition-colors leading-snug">{part.name}</h4>
                    <div className="mb-3">
                      <OemBadge oem={part.oem_number} />
                    </div>
                    <span className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 bg-primary-500/10 group-hover:bg-primary-500 text-primary-600 group-hover:text-dark-900 rounded-lg transition-all text-xs font-semibold">
                      Detay & Fiyat Al
                    </span>
                  </button>
                ))}
              </div>

              {remainingParts > 0 && (
                <button onClick={() => setPartsPage(p => p + 1)}
                  className="mt-4 w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 text-sm font-medium transition-all flex items-center justify-center gap-2">
                  Daha Fazla Göster
                  <span className="text-xs text-gray-400">({remainingParts} parça daha)</span>
                </button>
              )}

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

      {/* Part Detail Modal */}
      {selectedApiPart && (
        <PartDetailModal
          part={selectedApiPart}
          vehicleName={`${marka} ${modelName}`}
          categoryName={selectedCat?.name_tr}
          nodeName={selectedNode?.label}
          onClose={() => setSelectedApiPart(null)}
        />
      )}
    </>
  )
}

// ── Generation Picker (when brand is known but gen is missing) ──
function GenerationPicker({ brand, marka, modelName }: { brand: string; marka: string; modelName: string }) {
  const [generations, setGenerations] = useState<Array<{ generation_slug: string; generation_name: string; part_count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedGen, setSelectedGen] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const modelSlug = searchParams.get('model_slug')
  const modelKey = searchParams.get('model_key')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchGenerations(brand)
      .then(data => {
        setGenerations(data.generations || [])
        // Auto-select if only one generation
        if (data.generations?.length === 1) {
          setSelectedGen(data.generations[0].generation_slug)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [brand])

  // If a generation is selected, show the full parts explorer
  if (selectedGen) {
    const genSlugParam = `${brand}`
    return <VehiclePartsExplorer brand={genSlugParam} gen={selectedGen} marka={marka} modelName={modelName} />
  }

  return (
    <>
      {/* Vehicle Banner */}
      <div className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 bg-primary-50 border-b border-primary-100">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-primary-500" />
            <span className="text-primary-600 text-sm font-medium">Seçili Araç</span>
          </div>
        </div>
        <div className="p-5 md:p-6 flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{marka} {modelName}</h2>
            <p className="text-sm text-gray-500 mt-1">Aracınızın nesil/dönemini seçin.</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && generations.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{generations.length} nesil bulundu</h3>
              <p className="text-gray-500 text-xs">Doğru nesil/dönem seçimi daha iyi parça listesi sağlar</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {generations.map((gen) => (
              <button
                key={gen.generation_slug}
                onClick={() => setSelectedGen(gen.generation_slug)}
                className="group bg-white border border-gray-200 hover:border-primary-400 hover:shadow-md rounded-xl p-5 text-left transition-all duration-200"
              >
                <p className="text-gray-900 font-semibold text-sm group-hover:text-primary-600 transition-colors mb-2 leading-snug">{gen.generation_name}</p>
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500 text-xs tabular-nums">{gen.part_count.toLocaleString('tr-TR')} parça</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && generations.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600 mb-4">Bu marka için nesil bilgisi bulunamadı.</p>
          <a href={getWhatsAppUrl(`Merhaba, ${marka} ${modelName} için parça arıyorum.`)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <MessageCircle className="w-4 h-4" /> WhatsApp ile Talep Et
          </a>
        </div>
      )}
    </>
  )
}

// ── Main Page ──
function ParcalarContent() {
  const searchParams = useSearchParams()
  const brand = searchParams.get('brand')
  const gen = searchParams.get('gen')
  const marka = searchParams.get('marka')
  const modelName = searchParams.get('model_name')

  const hasVehicleWithGen = brand && gen && marka && modelName
  const hasVehicleWithoutGen = brand && marka && !gen

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Parçalar</span>
          {(hasVehicleWithGen || hasVehicleWithoutGen) && marka && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-500">{marka} {modelName}</span>
            </>
          )}
        </nav>

        {hasVehicleWithGen ? (
          <VehiclePartsExplorer brand={brand} gen={gen} marka={marka} modelName={modelName} />
        ) : hasVehicleWithoutGen ? (
          <GenerationPicker brand={brand} marka={marka} modelName={modelName || ''} />
        ) : (
          <StaticCategoriesView />
        )}

        {/* CTA Section */}
        {!hasVehicleWithGen && !hasVehicleWithoutGen && (
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
