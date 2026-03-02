'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MessageCircle, Sparkles, AlertCircle, CheckCircle, Wrench, Info, Car, Loader2, Copy, Check, Package, ChevronLeft, Hash, ChevronRight } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogos'
import { CategoryIcon, getCategoryColor } from '@/components/CategoryIcons'
import type { VehicleInfo, VehicleGeneration } from '@/types/vehicle'
import { siteConfig } from '@/lib/config'
import { validateVIN as validateVINUtil, decodeVIN, translateFuelType, translateTransmission, parseModelYear, cleanModelName } from '@/lib/vehicle'
import { fetchVehicleCategories, fetchVehicleNodes, fetchVehicleParts } from '@/lib/api'
import type { VehicleCategory, VehicleNode, VehiclePart } from '@/lib/api'
import { getWhatsAppUrl } from '@/lib/config'

interface BrandModelItem {
  name: string
  bodyType: string
  image: string
}

function findBrandModels(tree: Record<string, { body_types: Record<string, { name: string; image: string }[]> }>, make: string): BrandModelItem[] {
  const normalizedMake = make.toLowerCase().replace(/[- ]/g, '')
  for (const [brandName, brandData] of Object.entries(tree)) {
    const normalizedBrand = brandName.toLowerCase().replace(/[- ]/g, '')
    if (normalizedBrand === normalizedMake || normalizedMake.includes(normalizedBrand) || normalizedBrand.includes(normalizedMake)) {
      const models: BrandModelItem[] = []
      for (const [bodyType, bodyModels] of Object.entries(brandData.body_types)) {
        for (const m of bodyModels) {
          models.push({ name: m.name, bodyType, image: m.image })
        }
      }
      models.sort((a, b) => parseModelYear(a.name) - parseModelYear(b.name))
      return models
    }
  }
  return []
}

const PARTS_PER_PAGE = 20

type SearchTab = 'vin' | 'oem'

export default function HeroSection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SearchTab>('vin')

  // VIN state
  const [vin, setVin] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [error, setError] = useState('')
  const [missingModel, setMissingModel] = useState(false)
  const [brandModels, setBrandModels] = useState<BrandModelItem[]>([])
  const [modelSearch, setModelSearch] = useState('')
  const [selectedModelImage, setSelectedModelImage] = useState('')
  const modelSelectRef = useRef<HTMLDivElement>(null)

  // OEM state
  const [oemQuery, setOemQuery] = useState('')
  const [oemError, setOemError] = useState('')

  // API-driven parts state
  const [selectedGen, setSelectedGen] = useState<{ slug: string; name: string } | null>(null)
  const [apiCategories, setApiCategories] = useState<VehicleCategory[]>([])
  const [apiNodes, setApiNodes] = useState<VehicleNode[]>([])
  const [apiParts, setApiParts] = useState<VehiclePart[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [partsView, setPartsView] = useState<'generations' | 'categories' | 'nodes' | 'parts'>('categories')
  const [loadingParts, setLoadingParts] = useState(false)
  const [totalApiParts, setTotalApiParts] = useState(0)
  const [partsPage, setPartsPage] = useState(1)
  const [nodeSearch, setNodeSearch] = useState('')
  const [copiedOem, setCopiedOem] = useState<string | null>(null)
  const [generations, setGenerations] = useState<VehicleGeneration[]>([])

  useEffect(() => {
    const resetState = () => {
      setVin('')
      setIsSearching(false)
      setVehicleInfo(null)
      setError('')
      setMissingModel(false)
      setBrandModels([])
      setModelSearch('')
      setSelectedModelImage('')
      setSelectedGen(null)
      setApiCategories([])
      setApiNodes([])
      setApiParts([])
      setSelectedCat(null)
      setSelectedNode(null)
      setPartsView('categories')
      setLoadingParts(false)
      setTotalApiParts(0)
      setPartsPage(1)
      setNodeSearch('')
      setCopiedOem(null)
      setGenerations([])
      setOemQuery('')
      setOemError('')
    }
    window.addEventListener('page-reset', resetState)
    return () => window.removeEventListener('page-reset', resetState)
  }, [])

  // ── OEM Search — navigate to detail page ──
  const handleOemSearch = useCallback(() => {
    const q = oemQuery.trim()
    if (!q) { setOemError('Lütfen OEM numarası girin'); return }
    if (q.length < 3) { setOemError('En az 3 karakter girin'); return }
    setOemError('')
    router.push(`/parca/${encodeURIComponent(q)}`)
  }, [oemQuery, router])

  // ── VIN handlers ──
  const loadCategories = useCallback(async (brandSlug: string, genSlug: string, genName: string) => {
    setLoadingParts(true)
    setApiCategories([])
    setApiNodes([])
    setApiParts([])
    setSelectedCat(null)
    setSelectedNode(null)
    setPartsPage(1)
    setNodeSearch('')
    try {
      const res = await fetchVehicleCategories(brandSlug, genSlug)
      setApiCategories(res.categories)
      setTotalApiParts(res.total_parts)
      setSelectedGen({ slug: genSlug, name: genName })
      setPartsView('categories')
    } catch {
      // silently fail — WhatsApp CTA remains visible
    } finally {
      setLoadingParts(false)
    }
  }, [])

  const handleSearch = useCallback(async () => {
    setError('')
    setVehicleInfo(null)
    setMissingModel(false)
    setBrandModels([])
    setSelectedModelImage('')
    setSelectedGen(null)
    setApiCategories([])
    setApiNodes([])
    setApiParts([])
    setSelectedCat(null)
    setSelectedNode(null)
    setPartsView('categories')
    setTotalApiParts(0)
    setPartsPage(1)
    setNodeSearch('')
    setGenerations([])

    if (!vin.trim()) { setError('Lutfen sase numarasi girin'); return }
    if (!validateVINUtil(vin.trim())) { setError('Gecersiz VIN. 17 karakter, I/O/Q haric.'); return }
    setIsSearching(true)
    const result = await decodeVIN(vin.trim())
    setIsSearching(false)
    if (result.error || !result.data) { setError(result.error || 'Bulunamadi.'); return }

    const data = result.data

    if (!data.model) {
      setVehicleInfo(data)
      setMissingModel(true)
      try {
        const treeRes = await fetch('/data/vehicle-tree.json')
        const tree = await treeRes.json()
        const models = findBrandModels(tree, data.make)
        setBrandModels(models)
      } catch { /* ignore */ }
      setTimeout(() => modelSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      return
    }

    setVehicleInfo(data)

    const gens = data.generations ?? []
    const brandSlug = data.brandSlug

    if (brandSlug && gens.length === 1) {
      const g = gens[0]
      setGenerations(gens)
      await loadCategories(brandSlug, g.generation_slug, g.generation_name)
    } else if (brandSlug && gens.length > 1) {
      setGenerations(gens)
      setPartsView('generations')
    } else if (!brandSlug && data.model) {
      setGenerations([])
    }
  }, [vin, loadCategories])

  const handleModelSelect = useCallback((modelName: string, image?: string) => {
    if (!vehicleInfo) return
    const updated = { ...vehicleInfo, model: modelName }
    setVehicleInfo(updated)
    setMissingModel(false)
    setModelSearch('')
    if (image) setSelectedModelImage(image)
    setSelectedGen(null)
    setApiCategories([])
    setPartsView('categories')
  }, [vehicleInfo])

  const handleGenSelect = useCallback(async (gen: VehicleGeneration) => {
    if (!vehicleInfo?.brandSlug) return
    await loadCategories(vehicleInfo.brandSlug, gen.generation_slug, gen.generation_name)
  }, [vehicleInfo, loadCategories])

  const handleCatSelect = useCallback(async (catId: string) => {
    if (!vehicleInfo?.brandSlug || !selectedGen) return
    setLoadingParts(true)
    setApiNodes([])
    setApiParts([])
    setSelectedNode(null)
    setPartsPage(1)
    setNodeSearch('')
    setSelectedCat(catId)
    try {
      const res = await fetchVehicleNodes(vehicleInfo.brandSlug, selectedGen.slug, catId)
      setApiNodes(res.nodes)
      setPartsView('nodes')
    } catch {
      // silently fail
    } finally {
      setLoadingParts(false)
    }
  }, [vehicleInfo, selectedGen])

  const handleNodeSelect = useCallback(async (nodeName: string) => {
    if (!vehicleInfo?.brandSlug || !selectedGen) return
    setLoadingParts(true)
    setApiParts([])
    setPartsPage(1)
    setSelectedNode(nodeName)
    try {
      const res = await fetchVehicleParts(vehicleInfo.brandSlug, selectedGen.slug, nodeName)
      setApiParts(res.parts)
      setPartsView('parts')
    } catch {
      // silently fail
    } finally {
      setLoadingParts(false)
    }
  }, [vehicleInfo, selectedGen])

  const handleCopyOem = useCallback((oem: string) => {
    navigator.clipboard.writeText(oem).catch(() => {})
    setCopiedOem(oem)
    setTimeout(() => setCopiedOem(null), 2000)
  }, [])

  const whatsappBase = useCallback((extra: string) => {
    const msg = vehicleInfo
      ? `Merhaba, ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year} aracim icin parca ariyorum.\nSase: ${vin}\n${extra}`
      : `Merhaba, parca ariyorum.\n${extra}`
    window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
  }, [vehicleInfo, vin])


  const vehicleFields = useMemo(() => vehicleInfo ? [
    { l: 'Marka', v: vehicleInfo.make }, { l: 'Model', v: vehicleInfo.model },
    { l: 'Yıl', v: vehicleInfo.year }, { l: 'Kasa', v: vehicleInfo.bodyType },
    { l: 'Motor', v: [vehicleInfo.displacementL && `${vehicleInfo.displacementL}L`, vehicleInfo.engineCylinders && `${vehicleInfo.engineCylinders} Sil.`].filter(Boolean).join(' ') },
    { l: 'Yakıt', v: translateFuelType(vehicleInfo.fuelType) },
    { l: 'Güç', v: vehicleInfo.engineHP ? `${vehicleInfo.engineHP} HP` : '' },
    { l: 'Şanzıman', v: translateTransmission(vehicleInfo.transmissionType) },
  ].filter(f => f.v) : [], [vehicleInfo])

  const selectedCatLabel = useMemo(() => {
    if (!selectedCat) return null
    const cat = apiCategories.find(c => c.id === selectedCat)
    return cat?.name_tr ?? selectedCat
  }, [selectedCat, apiCategories])

  const filteredNodes = useMemo(() => {
    if (!nodeSearch) return apiNodes
    const q = nodeSearch.toLowerCase()
    return apiNodes.filter(n => n.label.toLowerCase().includes(q) || n.name.toLowerCase().includes(q))
  }, [apiNodes, nodeSearch])

  const visibleParts = useMemo(() => apiParts.slice(0, partsPage * PARTS_PER_PAGE), [apiParts, partsPage])
  const remainingParts = apiParts.length - visibleParts.length

  return (
    <>
      {/* ═══ HERO — Light Theme ═══ */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 pt-10 pb-14 md:pt-16 md:pb-20">
          {/* Motto */}
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-block px-3 py-1 bg-primary-500/10 text-primary-600 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 border border-primary-500/20">
              Yedek &amp; Çıkma Parça Platformu
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Doğru Parçayı <span className="text-primary-500">Hızla Bulun</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto">
              Şase numarası veya OEM parça numarası ile aracınıza uyumlu parçaları anında listeleyin.
            </p>
          </div>

          {/* ── Search Card ── */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-5 md:p-6">

              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                <button
                  onClick={() => setActiveTab('vin')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'vin'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  Şase (VIN) ile Ara
                </button>
                <button
                  onClick={() => setActiveTab('oem')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'oem'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  OEM Numarası ile Ara
                </button>
              </div>

              {/* ── VIN Tab ── */}
              {activeTab === 'vin' && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={vin}
                        onChange={(e) => setVin(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Şase (VIN) numaranızı girin"
                        maxLength={17}
                        className="w-full pl-12 pr-16 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 focus:bg-white transition-all font-mono text-sm md:text-base tracking-wider"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-mono tabular-nums">
                        {vin.length}/17
                      </span>
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-5 md:px-7 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
                    >
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                      <span className="hidden md:inline">Sorgula</span>
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-red-600 text-xs">{error}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-2 mt-4 text-[11px] text-gray-400">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>VIN numarası ruhsatınızda, ön camın sol alt köşesinde veya kapı çerçevesinde bulunur.</span>
                  </div>
                </>
              )}

              {/* ── OEM Tab ── */}
              {activeTab === 'oem' && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={oemQuery}
                        onChange={(e) => setOemQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleOemSearch()}
                        placeholder="Örn: 8E0407151, 1K0615301"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 focus:bg-white transition-all text-sm md:text-base"
                      />
                    </div>
                    <button
                      onClick={handleOemSearch}
                      className="px-5 md:px-7 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
                    >
                      <Search className="w-5 h-5" />
                      <span className="hidden md:inline">Ara</span>
                    </button>
                  </div>

                  {oemError && (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-red-600 text-xs">{oemError}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-2 mt-4 text-[11px] text-gray-400">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>OEM numarası parça üzerindeki etikette veya araç kataloğunda bulunur.</span>
                  </div>
                </>
              )}

              {/* Divider + CTAs */}
              <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">veya</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => whatsappBase('Yardımcı olur musunuz?')}
                  className="flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-600 border border-green-200 hover:border-green-600 text-green-700 hover:text-white rounded-xl transition-all text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp ile Sor
                </button>
                <Link
                  href="/ai-asistan"
                  className="flex items-center justify-center gap-2 py-3 bg-purple-50 hover:bg-purple-600 border border-purple-200 hover:border-purple-600 text-purple-700 hover:text-white rounded-xl transition-all text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Asistan ile Sor
                </Link>
              </div>
            </div>

            {/* Trust Strip */}
            <div className="flex justify-center items-center gap-6 md:gap-10 mt-6 text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs">5.000+ Müşteri</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <span className="text-xs">10.000+ Parça</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs">50+ Marka</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══ SEARCH RESULTS ═══ */}
      {vehicleInfo && (
        <section className="py-10 md:py-14 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto animate-fadeIn">

              {/* ── Vehicle Card ── */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
                <div className={`px-6 py-3 ${missingModel ? 'bg-amber-50 border-b border-amber-200' : 'bg-green-50 border-b border-green-200'}`}>
                  <div className="flex items-center gap-2">
                    {missingModel ? (
                      <><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-amber-700 text-sm font-medium">Marka bulundu — model bilgisi eksik</span></>
                    ) : (
                      <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-green-700 text-sm font-medium">Araç bilgileri bulundu</span></>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                      {selectedModelImage ? (
                        <div className="w-40 h-28 md:w-48 md:h-32 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedModelImage} alt={vehicleInfo.model} className="w-full h-full object-contain p-2" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                          <BrandLogo brand={vehicleInfo.make} size={56} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        {vehicleInfo.make} {vehicleInfo.model ? cleanModelName(vehicleInfo.model) : <span className="text-gray-400 italic font-normal text-xl">Model seçilmedi</span>}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {[vehicleInfo.year, vehicleInfo.series, vehicleInfo.bodyType].filter(Boolean).join(' · ')}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {!missingModel && (
                          <button
                            onClick={() => whatsappBase('Bu araç için parça talebi oluşturmak istiyorum.')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp ile Talep Et
                          </button>
                        )}
                        <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">VIN</span>
                          <span className="text-gray-900 font-mono text-xs tracking-wider">{vin}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Model Selection Panel */}
                  {missingModel && brandModels.length > 0 && (
                    <div ref={modelSelectRef} className="mb-6 p-4 md:p-5 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
                      <p className="text-amber-700 text-sm font-medium mb-1">Aracınızın modelini seçin</p>
                      <p className="text-gray-500 text-xs mb-3">NHTSA veritabanında bu VIN için model bilgisi bulunamadı.</p>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Model ara..."
                          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors" />
                      </div>
                      <div className="max-h-[420px] overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                          {brandModels.filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase())).map((m, i) => {
                            const year = parseModelYear(m.name)
                            return (
                              <button key={i} onClick={() => handleModelSelect(m.name, m.image)}
                                className="group relative rounded-lg overflow-hidden bg-white border border-gray-200 hover:border-primary-500/40 hover:shadow-md transition-all duration-200 text-left">
                                <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={m.image} alt={m.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                  {year > 0 && <span className="absolute top-1 right-1 text-[8px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600">{year}</span>}
                                  <span className="absolute top-1 left-1 text-[8px] font-medium text-gray-500 bg-white/80 backdrop-blur-sm px-1 py-0.5 rounded">{m.bodyType}</span>
                                </div>
                                <div className="px-2 py-1.5">
                                  <p className="text-[11px] text-gray-600 group-hover:text-gray-900 transition-colors duration-200 leading-tight line-clamp-1 font-medium">{cleanModelName(m.name)}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        {brandModels.filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase())).length === 0 && (
                          <p className="text-gray-500 text-xs text-center py-6">Sonuç bulunamadı</p>
                        )}
                      </div>
                    </div>
                  )}

                  {missingModel && brandModels.length === 0 && (
                    <div ref={modelSelectRef} className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
                      <p className="text-amber-700 text-sm font-medium mb-1">Model bilgisi bulunamadı</p>
                      <p className="text-gray-500 text-xs mb-3">Bu marka için veritabanımızda model listesi bulunmuyor.</p>
                      <button onClick={() => whatsappBase('Bu VIN için model bilgisi bulunamadı. Yardımcı olur musunuz?')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors">
                        <MessageCircle className="w-4 h-4" />WhatsApp ile Sor
                      </button>
                    </div>
                  )}

                  {/* Vehicle Specs Grid */}
                  {vehicleFields.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
                      {vehicleFields.map((f) => (
                        <div key={f.l} className="bg-white px-4 py-3.5">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">{f.l}</p>
                          <p className="text-gray-900 text-sm font-semibold">{f.v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Compatible Parts (API-driven) ── */}
              {!missingModel && (
                <div>
                  {loadingParts && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                      <span className="ml-3 text-gray-500 text-sm">Parçalar yükleniyor...</span>
                    </div>
                  )}

                  {/* Generation Picker */}
                  {!loadingParts && partsView === 'generations' && generations.length > 1 && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{generations.length} eşleşme bulundu — Aracınızı seçin</h3>
                          <p className="text-gray-500 text-xs">Doğru nesil/dönem seçimi daha iyi parça listesi sağlar</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {generations.map((gen) => (
                          <button
                            key={gen.generation_slug}
                            onClick={() => handleGenSelect(gen)}
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

                  {/* Categories View */}
                  {!loadingParts && partsView === 'categories' && apiCategories.length > 0 && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Uyumlu Parçalar</h3>
                            <p className="text-gray-500 text-xs">
                              {selectedGen?.name && <span className="text-primary-600 font-medium">{selectedGen.name} · </span>}
                              {apiCategories.length} kategori, {totalApiParts.toLocaleString('tr-TR')} parça
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {apiCategories.map((cat) => {
                          const color = getCategoryColor(cat.id)
                          return (
                            <button
                              key={cat.id}
                              onClick={() => handleCatSelect(cat.id)}
                              className="group relative bg-white border border-gray-200 hover:border-primary-400 rounded-xl p-5 text-left transition-all duration-200 overflow-hidden hover:shadow-md"
                            >
                              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-200`} />
                              <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <CategoryIcon id={cat.id} className="text-white" size={20} stroke={2} />
                                  </div>
                                  <span className="text-[11px] tabular-nums px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
                                    {cat.total_parts.toLocaleString('tr-TR')}
                                  </span>
                                </div>
                                <p className="text-gray-900 font-semibold text-sm group-hover:text-primary-600 transition-colors leading-snug">{cat.name_tr}</p>
                                <p className="text-gray-400 text-xs mt-1">{cat.node_count} alt grup</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nodes View */}
                  {!loadingParts && partsView === 'nodes' && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center gap-2 mb-5">
                        <button
                          onClick={() => { setPartsView('categories'); setSelectedCat(null); setApiNodes([]) }}
                          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Kategoriler
                        </button>
                        {selectedCatLabel && (
                          <>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-900 text-sm font-medium">{selectedCatLabel}</span>
                          </>
                        )}
                      </div>

                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={nodeSearch}
                          onChange={(e) => setNodeSearch(e.target.value)}
                          placeholder="Alt grup ara..."
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                        />
                      </div>

                      {filteredNodes.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-10">Sonuç bulunamadı</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {filteredNodes.map((node) => (
                            <button
                              key={node.name}
                              onClick={() => handleNodeSelect(node.name)}
                              className="group bg-white border border-gray-200 hover:border-primary-400 hover:shadow-md rounded-xl p-4 text-left transition-all duration-200"
                            >
                              <p className="text-gray-900 font-medium text-sm group-hover:text-primary-600 transition-colors mb-1.5 leading-snug">{node.label}</p>
                              <div className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-500 text-xs tabular-nums">{node.part_count.toLocaleString('tr-TR')} parça</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Parts View */}
                  {!loadingParts && partsView === 'parts' && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center gap-2 mb-5 flex-wrap">
                        <button
                          onClick={() => { setPartsView('categories'); setSelectedCat(null); setSelectedNode(null); setApiNodes([]); setApiParts([]) }}
                          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Kategoriler
                        </button>
                        {selectedCatLabel && (
                          <>
                            <span className="text-gray-300">/</span>
                            <button
                              onClick={() => { setPartsView('nodes'); setSelectedNode(null); setApiParts([]) }}
                              className="text-gray-500 hover:text-gray-900 text-sm transition-colors"
                            >
                              {selectedCatLabel}
                            </button>
                          </>
                        )}
                        {selectedNode && (
                          <>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-900 text-sm font-medium">
                              {apiNodes.find(n => n.name === selectedNode)?.label ?? selectedNode}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-500 text-sm">
                          <span className="text-gray-900 font-semibold tabular-nums">{apiParts.length}</span> parça bulundu
                        </p>
                      </div>

                      {apiParts.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                          <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Bu alt grup için parça bulunamadı.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {visibleParts.map((part, idx) => (
                              <div
                                key={`${part.oem_number}-${idx}`}
                                className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs text-primary-600 bg-primary-50 border border-primary-200 rounded-md px-2 py-1 truncate max-w-[calc(100%-2rem)]">
                                    {part.oem_number}
                                  </span>
                                  <button
                                    onClick={() => handleCopyOem(part.oem_number)}
                                    title="Kopyala"
                                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                                  >
                                    {copiedOem === part.oem_number ? (
                                      <Check className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    )}
                                  </button>
                                </div>

                                <p className="text-gray-900 font-semibold text-sm leading-snug flex-1">{part.name}</p>

                                <button
                                  onClick={() => whatsappBase(`OEM No: ${part.oem_number}\nParça: ${part.name}\nAraç: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nŞase: ${vin}`)}
                                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 hover:border-green-600 rounded-lg transition-all text-xs font-semibold"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Fiyat Sor
                                </button>
                              </div>
                            ))}
                          </div>

                          {remainingParts > 0 && (
                            <button
                              onClick={() => setPartsPage(p => p + 1)}
                              className="mt-6 w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                              Daha Fazla Göster
                              <span className="text-xs text-gray-400">({remainingParts} parça daha)</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* No API data fallback */}
                  {!loadingParts && partsView === 'categories' && apiCategories.length === 0 && !missingModel && vehicleInfo.model && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Wrench className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-1 text-sm">Bu araç için veritabanımızda parça bulunamadı.</p>
                      <p className="text-gray-400 text-xs mb-4">WhatsApp üzerinden tüm parçaları talep edebilirsiniz.</p>
                      <button
                        onClick={() => whatsappBase('Bu araç için uyumlu parça arıyorum. Yardımcı olur musunuz?')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp ile Talep Et
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom CTA */}
              <div className="mt-8 bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-gray-900 font-bold text-base mb-1">Aradığınız parça listede yok mu?</h4>
                  <p className="text-gray-500 text-sm">Şase numaranızla birlikte WhatsApp&apos;tan talep gönderin, size en uygun parçayı bulalım.</p>
                </div>
                <button
                  onClick={() => whatsappBase('Listede olmayan bir parça arıyorum. Yardımcı olur musunuz?')}
                  className="flex-shrink-0 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp ile Talep Oluştur
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
