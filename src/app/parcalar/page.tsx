'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Settings, Car, Disc, Lightbulb, Battery, Thermometer, Wind, Wrench, Layout, Square, ChevronRight, ChevronLeft, Search, MessageCircle, Loader2, AlertCircle, Package, Copy, Check } from 'lucide-react'
import { categories } from '@/data/parts'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'
import { fetchVehicleCategories, fetchVehicleNodes, fetchVehicleParts, searchOemParts } from '@/lib/api'
import type { VehicleCategory, VehicleNode, VehiclePart } from '@/lib/api'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Settings, Car, Disc, Lightbulb, Battery, Thermometer, Wind, Wrench, Layout, Square,
}

const colorMap: Record<string, string> = {
  'motor': 'from-red-500 to-orange-500',
  'sanziman': 'from-blue-500 to-cyan-500',
  'suspansiyon': 'from-green-500 to-emerald-500',
  'fren': 'from-purple-500 to-pink-500',
  'kaporta': 'from-yellow-500 to-orange-500',
  'aydinlatma': 'from-amber-500 to-yellow-500',
  'elektrik': 'from-cyan-500 to-blue-500',
  'sogutma': 'from-sky-500 to-indigo-500',
  'egzoz': 'from-gray-500 to-slate-500',
  'direksiyon': 'from-rose-500 to-red-500',
  'ic-aksesuar': 'from-violet-500 to-purple-500',
  'cam': 'from-teal-500 to-cyan-500',
}

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
    <button onClick={copy} className="inline-flex items-center gap-1.5 px-2 py-1 bg-dark-900/60 border border-white/[0.06] rounded-md text-xs font-mono text-gray-400 hover:text-white hover:border-primary-500/30 transition-all" title="Kopyala">
      <span className="tracking-wider">{oem}</span>
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// ── Static view (no vehicle selected) ──
function StaticCategoriesView() {
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Parça <span className="text-primary-500">Kategorileri</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          İhtiyacınız olan parçayı kategoriye göre bulun. Tüm marka ve modellere uygun yedek parça ve çıkma parça seçenekleri.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <Link href="/sase-sorgula" className="flex items-center gap-4 p-6 bg-dark-800 border border-dark-700 rounded-2xl hover:border-primary-500/50 transition-all group">
          <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
            <Search className="w-7 h-7 text-primary-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">Şase Numarası ile Ara</h3>
            <p className="text-gray-400 text-sm">Aracınıza uygun parçaları bulmak için şase numaranızı girin</p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-primary-500 transition-colors" />
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon] || Car
          const gradientColor = colorMap[category.id] || 'from-gray-500 to-gray-600'
          return (
            <Link key={category.id} href={`/parcalar/${category.id}`} className="group bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-primary-500/50 transition-all card-hover">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-500 transition-colors">{category.name}</h2>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-500 text-sm font-medium">{category.partCount}+ Parça</span>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
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

  // Load categories
  useEffect(() => {
    setLoading(true)
    setError('')
    fetchVehicleCategories(brand, gen)
      .then(data => {
        setApiCategories(data.categories)
        setTotalParts(data.total_parts)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [brand, gen])

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
      <div className="mb-8 bg-gradient-to-br from-dark-800 to-dark-800/80 border border-primary-500/20 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
        <div className="px-6 py-3 bg-primary-500/[0.04] border-b border-primary-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary-500" />
              <span className="text-primary-400 text-sm font-medium">Seçili Araç</span>
            </div>
            <span className="text-xs text-gray-500 tabular-nums">{totalParts.toLocaleString('tr-TR')} parça</span>
          </div>
        </div>
        <div className="p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
          {vehicleImage && (
            <div className="w-36 h-24 md:w-44 md:h-28 rounded-xl bg-gradient-to-b from-dark-900/80 to-dark-900 border border-white/[0.06] flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vehicleImage} alt={modelName} className="w-full h-full object-contain p-2" />
            </div>
          )}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-white">{marka} {modelName}</h2>
            <p className="text-sm text-gray-400 mt-1">Aşağıdan kategori seçin veya WhatsApp ile bize ulaşın.</p>
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
          className={`transition-colors ${view === 'categories' ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}>
          Kategoriler
        </button>
        {selectedCat && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button onClick={() => { setView('nodes'); setSelectedNode(null) }}
              className={`transition-colors ${view === 'nodes' ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}>
              {selectedCat.name_tr}
            </button>
          </>
        )}
        {selectedNode && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-white font-medium">{selectedNode.label}</span>
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
                className="group bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500/40 hover:shadow-[0_4px_20px_rgba(234,179,8,0.04)] transition-all text-left">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-lg`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-primary-500 transition-colors">{cat.name_tr}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">{cat.total_parts.toLocaleString('tr-TR')} parça</span>
                      <span className="text-gray-600 text-xs">{cat.node_count} grup</span>
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
          <button onClick={goBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kategorilere Dön
          </button>

          {/* Node Search */}
          {nodes.length > 10 && (
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={nodeSearch} onChange={e => setNodeSearch(e.target.value)} placeholder="Grup ara..."
                className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors" />
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNodes.map(node => (
              <button key={node.name} onClick={() => handleNodeClick(node)}
                className="group bg-dark-800 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 hover:shadow-[0_4px_16px_rgba(234,179,8,0.04)] transition-all text-left flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] group-hover:bg-primary-500/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Package className="w-4 h-4 text-gray-500 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 group-hover:text-white font-medium transition-colors truncate">{node.label}</p>
                  <p className="text-xs text-gray-600">{node.part_count} parça</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
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
          <button onClick={goBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {selectedCat?.name_tr || 'Geri'}
          </button>

          {parts.length > 0 ? (
            <>
              {/* Parts Search */}
              {parts.length > 10 && (
                <div className="relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={partSearch} onChange={e => { setPartSearch(e.target.value); setPartsPage(1) }} placeholder="Parça adı veya OEM numarası ara..."
                    className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors" />
                </div>
              )}

              <p className="text-xs text-gray-500 mb-4">{filteredParts.length} parça listeleniyor</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginatedParts.map((part, i) => (
                  <div key={`${part.oem_number}-${i}`} className="group bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] rounded-xl p-4 hover:border-primary-500/25 hover:shadow-[0_4px_16px_rgba(234,179,8,0.04)] transition-all duration-200">
                    <h4 className="text-white font-semibold text-sm mb-2 group-hover:text-primary-500 transition-colors leading-snug">{part.name}</h4>
                    <div className="mb-3">
                      <OemBadge oem={part.oem_number} />
                    </div>
                    <button
                      onClick={() => {
                        const msg = `Merhaba, aşağıdaki parça için fiyat bilgisi almak istiyorum.\n\nParça: ${part.name}\nOEM No: ${part.oem_number}\nAraç: ${marka} ${modelName}`
                        window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
                      }}
                      className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 rounded-lg transition-all text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Fiyat Sor
                    </button>
                  </div>
                ))}
              </div>

              {remainingParts > 0 && (
                <button onClick={() => setPartsPage(p => p + 1)}
                  className="mt-4 w-full py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-gray-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                  Daha Fazla Göster
                  <span className="text-xs text-gray-500">({remainingParts} parça daha)</span>
                </button>
              )}

              {filteredParts.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-10">Aramanızla eşleşen parça bulunamadı</p>
              )}
            </>
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-1 text-sm">Bu grup için parça detayları yüklenemedi.</p>
              <p className="text-gray-600 text-xs mb-4">WhatsApp üzerinden bu gruptaki parçaları talep edebilirsiniz.</p>
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
          <h4 className="text-white font-bold text-base mb-1">Aradığınız parça listede yok mu?</h4>
          <p className="text-gray-400 text-sm">WhatsApp&apos;tan talep gönderin, size en uygun parçayı bulalım.</p>
        </div>
        <a href={getWhatsAppUrl(whatsappText)} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> WhatsApp ile Talep Oluştur
        </a>
      </div>
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

  const hasVehicle = brand && gen && marka && modelName

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Parçalar</span>
          {hasVehicle && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-500">{marka} {modelName}</span>
            </>
          )}
        </nav>

        {hasVehicle ? (
          <VehiclePartsExplorer brand={brand} gen={gen} marka={marka} modelName={modelName} />
        ) : (
          <StaticCategoriesView />
        )}

        {/* CTA Section */}
        {!hasVehicle && (
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
