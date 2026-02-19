'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, MessageCircle, Sparkles, AlertCircle, CheckCircle, Wrench, Info, Car, Loader2, Copy, Check, Package, ChevronLeft } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogos'
import type { VehicleInfo, VehicleGeneration } from '@/types/vehicle'
import { siteConfig } from '@/lib/config'
import { validateVIN as validateVINUtil, decodeVIN, translateFuelType, translateTransmission, parseModelYear, cleanModelName } from '@/lib/vehicle'
import { fetchVehicleCategories, fetchVehicleNodes, fetchVehicleParts } from '@/lib/api'
import type { VehicleCategory, VehicleNode, VehiclePart } from '@/lib/api'

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

const CATEGORY_STYLE_MAP: Record<string, { color: string; icon: string }> = {
  engine:        { color: 'from-red-500 to-orange-500',    icon: '🔧' },
  turbo_intake:  { color: 'from-sky-500 to-blue-500',      icon: '💨' },
  fuel:          { color: 'from-amber-500 to-yellow-500',  icon: '⛽' },
  exhaust:       { color: 'from-gray-500 to-slate-500',    icon: '🏭' },
  transmission:  { color: 'from-blue-500 to-cyan-500',     icon: '⚙️' },
  brake:         { color: 'from-purple-500 to-pink-500',   icon: '🛑' },
  suspension:    { color: 'from-green-500 to-emerald-500', icon: '🔩' },
  wheel_tyre:    { color: 'from-gray-600 to-gray-500',     icon: '🛞' },
  body_exterior: { color: 'from-yellow-500 to-orange-500', icon: '🚗' },
  glass_mirror:  { color: 'from-teal-500 to-cyan-500',     icon: '🪞' },
  lighting:      { color: 'from-amber-400 to-yellow-500',  icon: '💡' },
  electrical:    { color: 'from-cyan-500 to-blue-500',     icon: '⚡' },
  climate:       { color: 'from-indigo-500 to-blue-500',   icon: '❄️' },
  interior:      { color: 'from-violet-500 to-purple-500', icon: '💺' },
  audio_media:   { color: 'from-pink-500 to-rose-500',     icon: '🔊' },
  tow_transport: { color: 'from-stone-500 to-gray-500',    icon: '🪝' },
  other:         { color: 'from-gray-500 to-gray-600',     icon: '📦' },
}

function getCategoryStyle(id: string) {
  return CATEGORY_STYLE_MAP[id] ?? CATEGORY_STYLE_MAP['other']
}

export default function HeroSection() {
  const [vin, setVin] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [error, setError] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [missingModel, setMissingModel] = useState(false)
  const [brandModels, setBrandModels] = useState<BrandModelItem[]>([])
  const [modelSearch, setModelSearch] = useState('')
  const [selectedModelImage, setSelectedModelImage] = useState('')
  const modelSelectRef = useRef<HTMLDivElement>(null)

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
  // Generations from VIN decode
  const [generations, setGenerations] = useState<VehicleGeneration[]>([])

  useEffect(() => {
    const resetState = () => {
      setVin('')
      setIsSearching(false)
      setVehicleInfo(null)
      setError('')
      setShowAI(false)
      setAiQuery('')
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
    }
    window.addEventListener('page-reset', resetState)
    return () => window.removeEventListener('page-reset', resetState)
  }, [])

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

    if (!vin.trim()) { setError('Lütfen şase numarası girin'); return }
    if (!validateVINUtil(vin.trim())) { setError('Geçersiz VIN. 17 karakter, I/O/Q hariç.'); return }
    setIsSearching(true)
    const result = await decodeVIN(vin.trim())
    setIsSearching(false)
    if (result.error || !result.data) { setError(result.error || 'Bulunamadı.'); return }

    const data = result.data

    // Case: no model in NHTSA response
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
      // Auto-select the single generation
      const g = gens[0]
      setGenerations(gens)
      await loadCategories(brandSlug, g.generation_slug, g.generation_name)
    } else if (brandSlug && gens.length > 1) {
      setGenerations(gens)
      setPartsView('generations')
    } else if (!brandSlug && data.model) {
      // Has model but no brandSlug — show WhatsApp CTA (no drill-down possible)
      setGenerations([])
    }
    // No brandSlug and no model is handled above by the missingModel branch
  }, [vin, loadCategories])

  const handleModelSelect = useCallback((modelName: string, image?: string) => {
    if (!vehicleInfo) return
    const updated = { ...vehicleInfo, model: modelName }
    setVehicleInfo(updated)
    setMissingModel(false)
    setModelSearch('')
    if (image) setSelectedModelImage(image)
    // Model selected from vehicle-tree.json but no generations available — show WhatsApp CTA
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
      ? `Merhaba, ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year} aracım için parça arıyorum.\nŞase: ${vin}\n${extra}`
      : `Merhaba, parça arıyorum.\n${extra}`
    window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
  }, [vehicleInfo, vin])

  const handleAISend = useCallback(() => {
    if (!aiQuery.trim()) return
    const msg = `Merhaba, AI asistanınız aracılığıyla sormak istiyorum:\n\n${aiQuery}${vehicleInfo ? `\n\nAraç: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nŞase: ${vin}` : ''}`
    window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
    setShowAI(false)
    setAiQuery('')
  }, [aiQuery, vehicleInfo, vin])

  const vehicleFields = useMemo(() => vehicleInfo ? [
    { l: 'Marka', v: vehicleInfo.make }, { l: 'Model', v: vehicleInfo.model },
    { l: 'Yıl', v: vehicleInfo.year }, { l: 'Kasa', v: vehicleInfo.bodyType },
    { l: 'Motor', v: [vehicleInfo.displacementL && `${vehicleInfo.displacementL}L`, vehicleInfo.engineCylinders && `${vehicleInfo.engineCylinders} Sil.`].filter(Boolean).join(' ') },
    { l: 'Yakıt', v: translateFuelType(vehicleInfo.fuelType) },
    { l: 'Güç', v: vehicleInfo.engineHP ? `${vehicleInfo.engineHP} HP` : '' },
    { l: 'Şanzıman', v: translateTransmission(vehicleInfo.transmissionType) },
  ].filter(f => f.v) : [], [vehicleInfo])

  // Breadcrumb label for current selected category
  const selectedCatLabel = useMemo(() => {
    if (!selectedCat) return null
    const cat = apiCategories.find(c => c.id === selectedCat)
    return cat?.name_tr ?? selectedCat
  }, [selectedCat, apiCategories])

  // Filtered nodes by search
  const filteredNodes = useMemo(() => {
    if (!nodeSearch) return apiNodes
    const q = nodeSearch.toLowerCase()
    return apiNodes.filter(n => n.label.toLowerCase().includes(q) || n.name.toLowerCase().includes(q))
  }, [apiNodes, nodeSearch])

  // Paginated parts
  const visibleParts = useMemo(() => apiParts.slice(0, partsPage * PARTS_PER_PAGE), [apiParts, partsPage])
  const remainingParts = apiParts.length - visibleParts.length

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Video Background */}
        <video autoPlay muted loop playsInline poster="/grid.svg" className="absolute inset-0 w-full h-full object-cover">
          <source src="https://videos.pexels.com/video-files/3173312/3173312-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-secondary-900/40 to-dark-900" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/80 via-dark-900/50 to-dark-900" />

        <div className="relative z-10 container mx-auto px-4 pt-10 pb-14 md:pt-16 md:pb-20">
          {/* Motto */}
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-block px-3 py-1 bg-primary-500/10 text-primary-500 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 border border-primary-500/20">
              Yedek &amp; Çıkma Parça Platformu
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Doğru Parçayı <span className="text-primary-500">Hızla Bulun</span>
            </h1>
            <p className="text-sm md:text-base text-gray-400 max-w-lg mx-auto">
              Şase numaranızı girin, aracınıza uyumlu parçaları anında listeleyin.
            </p>
          </div>

          {/* ── Search Card ── */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-dark-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6">
              {/* VIN Input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Şase (VIN) numaranızı girin"
                    maxLength={17}
                    className="w-full pl-12 pr-16 py-3.5 bg-dark-900/80 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all font-mono text-sm md:text-base tracking-wider"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-gray-600 font-mono tabular-nums">
                    {vin.length}/17
                  </span>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-5 md:px-7 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/40 text-dark-900 font-bold rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span className="hidden md:inline">Sorgula</span>
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {/* Divider + CTAs */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-gray-600 uppercase tracking-wider">veya</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => whatsappBase('Yardımcı olur musunuz?')}
                  className="flex items-center justify-center gap-2 py-3 bg-green-600/15 hover:bg-green-600 border border-green-500/30 hover:border-green-600 text-green-400 hover:text-white rounded-xl transition-all text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp ile Sor
                </button>
                <button
                  onClick={() => setShowAI(true)}
                  className="flex items-center justify-center gap-2 py-3 bg-purple-600/15 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-600 text-purple-400 hover:text-white rounded-xl transition-all text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Asistan ile Sor
                </button>
              </div>

              {/* VIN Help */}
              <div className="flex items-start gap-2 mt-4 text-[11px] text-gray-600">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>VIN numarası ruhsatınızda, ön camın sol alt köşesinde veya kapı çerçevesinde bulunur.</span>
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

      {/* ═══ AI MODAL ═══ */}
      {showAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAI(false)} />
          <div className="relative bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-700 bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Parça Asistanı</h3>
                <p className="text-gray-500 text-xs">Aradığınız parçayı tarif edin</p>
              </div>
              <button onClick={() => setShowAI(false)} className="ml-auto text-gray-500 hover:text-white text-xl leading-none">&times;</button>
            </div>

            {/* Quick Actions */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Hızlı Seçim</p>
              <div className="flex flex-wrap gap-2">
                {['Motor parçası arıyorum', 'Kaporta parçası lazım', 'Far/Stop lamba arıyorum', 'Fren sistemi parçası'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setAiQuery(q)}
                    className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg text-xs text-gray-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-5">
              {vehicleInfo && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-dark-900/50 rounded-lg border border-dark-700">
                  <Car className="w-4 h-4 text-primary-500" />
                  <span className="text-xs text-gray-400">
                    {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year}
                  </span>
                </div>
              )}
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Hangi parçayı arıyorsunuz? Detaylı tarif edin..."
                rows={3}
                className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              <button
                onClick={handleAISend}
                disabled={!aiQuery.trim()}
                className="w-full mt-3 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/30 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp ile Gönder
              </button>
              <p className="text-center text-[10px] text-gray-600 mt-2">
                AI destekli otomatik yanıt sistemi yakında aktif olacak
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SEARCH RESULTS ═══ */}
      {vehicleInfo && (
        <section className="py-10 md:py-14 bg-dark-900">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto animate-fadeIn">

              {/* ── Vehicle Card ── */}
              <div className="bg-gradient-to-br from-dark-800 to-dark-800/80 border border-dark-700 rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-black/20">
                {/* Status Bar */}
                <div className={`px-6 py-3 ${missingModel ? 'bg-amber-500/[0.06] border-b border-amber-500/10' : 'bg-green-500/[0.06] border-b border-green-500/10'}`}>
                  <div className="flex items-center gap-2">
                    {missingModel ? (
                      <><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-amber-400 text-sm font-medium">Marka bulundu — model bilgisi eksik</span></>
                    ) : (
                      <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-400 text-sm font-medium">Araç bilgileri bulundu</span></>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  {/* Vehicle Header - Image + Info + CTA */}
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    {/* Left: Vehicle Image or Brand Logo */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                      {selectedModelImage ? (
                        <div className="w-40 h-28 md:w-48 md:h-32 rounded-2xl bg-gradient-to-b from-dark-900/80 to-dark-900 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedModelImage} alt={vehicleInfo.model} className="w-full h-full object-contain p-2" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                          <BrandLogo brand={vehicleInfo.make} size={56} />
                        </div>
                      )}
                    </div>

                    {/* Right: Title + Quick Info */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        {vehicleInfo.make} {vehicleInfo.model ? cleanModelName(vehicleInfo.model) : <span className="text-gray-600 italic font-normal text-xl">Model seçilmedi</span>}
                      </h3>
                      <p className="text-gray-400 mb-4">
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
                        <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-dark-900/60 border border-white/[0.06] rounded-xl">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">VIN</span>
                          <span className="text-white font-mono text-xs tracking-wider">{vin}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Model Selection Panel */}
                  {missingModel && brandModels.length > 0 && (
                    <div ref={modelSelectRef} className="mb-6 p-4 md:p-5 bg-amber-500/[0.04] border border-amber-500/15 rounded-xl animate-fadeIn">
                      <p className="text-amber-400 text-sm font-medium mb-1">Aracınızın modelini seçin</p>
                      <p className="text-gray-500 text-xs mb-3">NHTSA veritabanında bu VIN için model bilgisi bulunamadı.</p>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Model ara..."
                          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors" />
                      </div>
                      <div className="max-h-[420px] overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                          {brandModels.filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase())).map((m, i) => {
                            const year = parseModelYear(m.name)
                            return (
                              <button key={i} onClick={() => handleModelSelect(m.name, m.image)}
                                className="group relative rounded-lg overflow-hidden bg-dark-900 border border-dark-600 hover:border-primary-500/40 hover:shadow-[0_4px_16px_rgba(234,179,8,0.08)] transition-all duration-200 text-left">
                                <div className="relative aspect-[4/3] bg-gradient-to-b from-dark-800/60 to-dark-900/80 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={m.image} alt={m.name} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                  {year > 0 && <span className="absolute top-1 right-1 text-[8px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-dark-900/70 backdrop-blur-sm border border-white/[0.08] text-gray-400">{year}</span>}
                                  <span className="absolute top-1 left-1 text-[8px] font-medium text-gray-500 bg-dark-900/80 backdrop-blur-sm px-1 py-0.5 rounded">{m.bodyType}</span>
                                </div>
                                <div className="px-2 py-1.5">
                                  <p className="text-[11px] text-gray-400 group-hover:text-white transition-colors duration-200 leading-tight line-clamp-1 font-medium">{cleanModelName(m.name)}</p>
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
                    <div ref={modelSelectRef} className="mb-6 p-4 bg-amber-500/[0.04] border border-amber-500/15 rounded-xl animate-fadeIn">
                      <p className="text-amber-400 text-sm font-medium mb-1">Model bilgisi bulunamadı</p>
                      <p className="text-gray-500 text-xs mb-3">Bu marka için veritabanımızda model listesi bulunmuyor.</p>
                      <button onClick={() => whatsappBase('Bu VIN için model bilgisi bulunamadı. Yardımcı olur musunuz?')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors">
                        <MessageCircle className="w-4 h-4" />WhatsApp ile Sor
                      </button>
                    </div>
                  )}

                  {/* Vehicle Specs Grid */}
                  {vehicleFields.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.06]">
                      {vehicleFields.map((f) => (
                        <div key={f.l} className="bg-dark-800 px-4 py-3.5">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">{f.l}</p>
                          <p className="text-white text-sm font-semibold">{f.v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Compatible Parts (API-driven) ── */}
              {!missingModel && (
                <div>
                  {/* Loading spinner */}
                  {loadingParts && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                      <span className="ml-3 text-gray-400 text-sm">Parçalar yükleniyor...</span>
                    </div>
                  )}

                  {/* Generation Picker */}
                  {!loadingParts && partsView === 'generations' && generations.length > 1 && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{generations.length} eşleşme bulundu — Aracınızı seçin</h3>
                          <p className="text-gray-500 text-xs">Doğru nesil/dönem seçimi daha iyi parça listesi sağlar</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {generations.map((gen) => (
                          <button
                            key={gen.generation_slug}
                            onClick={() => handleGenSelect(gen)}
                            className="group bg-dark-800 border border-dark-700 hover:border-primary-500/40 hover:shadow-[0_4px_20px_rgba(234,179,8,0.06)] rounded-xl p-5 text-left transition-all duration-200"
                          >
                            <p className="text-white font-semibold text-sm group-hover:text-primary-500 transition-colors mb-2 leading-snug">{gen.generation_name}</p>
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-gray-500" />
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
                          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Uyumlu Parçalar</h3>
                            <p className="text-gray-500 text-xs">
                              {selectedGen?.name && <span className="text-primary-500 font-medium">{selectedGen.name} · </span>}
                              {apiCategories.length} kategori, {totalApiParts.toLocaleString('tr-TR')} parça
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {apiCategories.map((cat) => {
                          const style = getCategoryStyle(cat.id)
                          return (
                            <button
                              key={cat.id}
                              onClick={() => handleCatSelect(cat.id)}
                              className="group relative bg-dark-800 border border-dark-700 hover:border-white/20 rounded-xl p-5 text-left transition-all duration-200 overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                            >
                              <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-200`} />
                              <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                  <span className="text-2xl leading-none">{style.icon}</span>
                                  <span className="text-[11px] tabular-nums px-2 py-0.5 rounded-md bg-white/[0.05] text-gray-400 border border-white/[0.06]">
                                    {cat.total_parts.toLocaleString('tr-TR')}
                                  </span>
                                </div>
                                <p className="text-white font-semibold text-sm group-hover:text-white transition-colors leading-snug">{cat.name_tr}</p>
                                <p className="text-gray-500 text-xs mt-1">{cat.node_count} alt grup</p>
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
                      {/* Breadcrumb + back */}
                      <div className="flex items-center gap-2 mb-5">
                        <button
                          onClick={() => { setPartsView('categories'); setSelectedCat(null); setApiNodes([]) }}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Kategoriler
                        </button>
                        {selectedCatLabel && (
                          <>
                            <span className="text-gray-600">/</span>
                            <span className="text-white text-sm font-medium">{selectedCatLabel}</span>
                          </>
                        )}
                      </div>

                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={nodeSearch}
                          onChange={(e) => setNodeSearch(e.target.value)}
                          placeholder="Alt grup ara..."
                          className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
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
                              className="group bg-dark-800 border border-dark-700 hover:border-primary-500/40 hover:shadow-[0_4px_20px_rgba(234,179,8,0.06)] rounded-xl p-4 text-left transition-all duration-200"
                            >
                              <p className="text-white font-medium text-sm group-hover:text-primary-500 transition-colors mb-1.5 leading-snug">{node.label}</p>
                              <div className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-gray-500" />
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
                      {/* Breadcrumb + back */}
                      <div className="flex items-center gap-2 mb-5 flex-wrap">
                        <button
                          onClick={() => { setPartsView('categories'); setSelectedCat(null); setSelectedNode(null); setApiNodes([]); setApiParts([]) }}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Kategoriler
                        </button>
                        {selectedCatLabel && (
                          <>
                            <span className="text-gray-600">/</span>
                            <button
                              onClick={() => { setPartsView('nodes'); setSelectedNode(null); setApiParts([]) }}
                              className="text-gray-400 hover:text-white text-sm transition-colors"
                            >
                              {selectedCatLabel}
                            </button>
                          </>
                        )}
                        {selectedNode && (
                          <>
                            <span className="text-gray-600">/</span>
                            <span className="text-white text-sm font-medium">
                              {apiNodes.find(n => n.name === selectedNode)?.label ?? selectedNode}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Parts header */}
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-sm">
                          <span className="text-white font-semibold tabular-nums">{apiParts.length}</span> parça bulundu
                        </p>
                      </div>

                      {apiParts.length === 0 ? (
                        <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
                          <Package className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">Bu alt grup için parça bulunamadı.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {visibleParts.map((part, idx) => (
                              <div
                                key={`${part.oem_number}-${idx}`}
                                className="group bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] rounded-xl p-4 hover:border-primary-500/25 hover:shadow-[0_4px_16px_rgba(234,179,8,0.04)] transition-all duration-200 flex flex-col gap-3"
                              >
                                {/* OEM Badge */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-md px-2 py-1 truncate max-w-[calc(100%-2rem)]">
                                    {part.oem_number}
                                  </span>
                                  <button
                                    onClick={() => handleCopyOem(part.oem_number)}
                                    title="Kopyala"
                                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
                                  >
                                    {copiedOem === part.oem_number ? (
                                      <Check className="w-3.5 h-3.5 text-green-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                                    )}
                                  </button>
                                </div>

                                {/* Part name */}
                                <p className="text-white font-semibold text-sm leading-snug flex-1">{part.name}</p>

                                {/* WhatsApp CTA */}
                                <button
                                  onClick={() => whatsappBase(`OEM No: ${part.oem_number}\nParça: ${part.name}\nAraç: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nŞase: ${vin}`)}
                                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 rounded-lg transition-all text-xs font-semibold"
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
                              className="mt-6 w-full py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-gray-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                              Daha Fazla Göster
                              <span className="text-xs text-gray-500">({remainingParts} parça daha)</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* No API data + no loading: WhatsApp CTA fallback */}
                  {!loadingParts && partsView === 'categories' && apiCategories.length === 0 && !missingModel && vehicleInfo.model && (
                    <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                        <Wrench className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-gray-400 mb-1 text-sm">Bu araç için veritabanımızda parça bulunamadı.</p>
                      <p className="text-gray-600 text-xs mb-4">WhatsApp üzerinden tüm parçaları talep edebilirsiniz.</p>
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
              <div className="mt-8 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-white font-bold text-base mb-1">Aradığınız parça listede yok mu?</h4>
                  <p className="text-gray-400 text-sm">Şase numaranızla birlikte WhatsApp&apos;tan talep gönderin, size en uygun parçayı bulalım.</p>
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
