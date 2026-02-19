'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, AlertCircle, CheckCircle, MessageCircle, Info, Wrench,
  ChevronRight, ChevronLeft, Package, Loader2, Copy, Check,
} from 'lucide-react'
import type { VehicleInfo, VehicleGeneration } from '@/types/vehicle'
import type { VehicleCategory, VehicleNode, VehiclePart } from '@/lib/api'
import { fetchVehicleCategories, fetchVehicleNodes, fetchVehicleParts } from '@/lib/api'
import { BrandLogo } from '@/components/BrandLogos'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'
import { validateVIN, decodeVIN, translateFuelType, translateTransmission, formatEngine, parseModelYear, cleanModelName } from '@/lib/vehicle'

// ── Types ──────────────────────────────────────────────────────────────────────

interface BrandModel {
  name: string
  bodyType: string
  image: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function findBrandModels(
  tree: Record<string, { body_types: Record<string, { name: string; image: string }[]> }>,
  make: string,
): BrandModel[] {
  const normalizedMake = make.toLowerCase().replace(/[- ]/g, '')
  for (const [brandName, brandData] of Object.entries(tree)) {
    const normalizedBrand = brandName.toLowerCase().replace(/[- ]/g, '')
    if (
      normalizedBrand === normalizedMake ||
      normalizedMake.includes(normalizedBrand) ||
      normalizedBrand.includes(normalizedMake)
    ) {
      const models: BrandModel[] = []
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

// ── Category style map (matches parcalar/page.tsx) ────────────────────────────

const catStyleMap: Record<string, { color: string; icon: string }> = {
  engine:       { color: 'from-red-500 to-orange-500',    icon: '🔧' },
  turbo_intake: { color: 'from-sky-500 to-blue-500',      icon: '💨' },
  fuel:         { color: 'from-amber-500 to-yellow-500',  icon: '⛽' },
  exhaust:      { color: 'from-gray-500 to-slate-500',    icon: '🏭' },
  transmission: { color: 'from-blue-500 to-cyan-500',     icon: '⚙️' },
  brake:        { color: 'from-purple-500 to-pink-500',   icon: '🛑' },
  suspension:   { color: 'from-green-500 to-emerald-500', icon: '🔩' },
  wheel_tyre:   { color: 'from-gray-600 to-gray-500',     icon: '🛞' },
  body_exterior:{ color: 'from-yellow-500 to-orange-500', icon: '🚗' },
  glass_mirror: { color: 'from-teal-500 to-cyan-500',     icon: '🪞' },
  lighting:     { color: 'from-amber-400 to-yellow-500',  icon: '💡' },
  electrical:   { color: 'from-cyan-500 to-blue-500',     icon: '⚡' },
  climate:      { color: 'from-indigo-500 to-blue-500',   icon: '❄️' },
  interior:     { color: 'from-violet-500 to-purple-500', icon: '💺' },
  audio_media:  { color: 'from-pink-500 to-rose-500',     icon: '🔊' },
  tow_transport:{ color: 'from-stone-500 to-gray-500',    icon: '🪝' },
  other:        { color: 'from-gray-500 to-gray-600',     icon: '📦' },
}

const PARTS_PER_PAGE = 20

// ── OEM Copy Badge ─────────────────────────────────────────────────────────────

function OemBadge({ oem }: { oem: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(oem)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-dark-900/60 border border-white/[0.06] rounded-md text-xs font-mono text-gray-400 hover:text-white hover:border-primary-500/30 transition-all"
      title="Kopyala"
    >
      <span className="tracking-wider">{oem}</span>
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

type PartsView = 'generations' | 'categories' | 'nodes' | 'parts'

export default function ChassisSearch() {
  // ── Search / vehicle state ──
  const [chassisNumber, setChassisNumber]         = useState('')
  const [isSearching, setIsSearching]             = useState(false)
  const [vehicleInfo, setVehicleInfo]             = useState<VehicleInfo | null>(null)
  const [error, setError]                         = useState('')
  const [missingModel, setMissingModel]           = useState(false)
  const [brandModels, setBrandModels]             = useState<BrandModel[]>([])
  const [modelSearch, setModelSearch]             = useState('')
  const [selectedModelImage, setSelectedModelImage] = useState('')

  // ── API drill-down state ──
  const [partsView, setPartsView]         = useState<PartsView>('categories')
  const [selectedGen, setSelectedGen]     = useState<{ slug: string; name: string } | null>(null)
  const [brandSlug, setBrandSlug]         = useState<string>('')
  const [apiCategories, setApiCategories] = useState<VehicleCategory[]>([])
  const [apiNodes, setApiNodes]           = useState<VehicleNode[]>([])
  const [apiParts, setApiParts]           = useState<VehiclePart[]>([])
  const [selectedCat, setSelectedCat]     = useState<VehicleCategory | null>(null)
  const [selectedNode, setSelectedNode]   = useState<VehicleNode | null>(null)
  const [loadingParts, setLoadingParts]   = useState(false)
  const [partsError, setPartsError]       = useState('')
  const [totalApiParts, setTotalApiParts] = useState(0)
  const [partsPage, setPartsPage]         = useState(1)
  const [nodeSearch, setNodeSearch]       = useState('')

  // ── API data available? (brandSlug present and generation resolved) ──
  const [apiAvailable, setApiAvailable] = useState(false)

  const modelSelectRef = useRef<HTMLDivElement>(null)

  // ── Reset on page-reset event ──────────────────────────────────────────────
  useEffect(() => {
    const resetState = () => {
      setChassisNumber('')
      setIsSearching(false)
      setVehicleInfo(null)
      setError('')
      setMissingModel(false)
      setBrandModels([])
      setModelSearch('')
      setSelectedModelImage('')
      resetApiState()
    }
    window.addEventListener('page-reset', resetState)
    return () => window.removeEventListener('page-reset', resetState)
  }, [])

  // ── Helper: reset all API drill-down state ─────────────────────────────────
  const resetApiState = () => {
    setPartsView('categories')
    setSelectedGen(null)
    setBrandSlug('')
    setApiCategories([])
    setApiNodes([])
    setApiParts([])
    setSelectedCat(null)
    setSelectedNode(null)
    setLoadingParts(false)
    setPartsError('')
    setTotalApiParts(0)
    setPartsPage(1)
    setNodeSearch('')
    setApiAvailable(false)
  }

  // ── Load categories from API ───────────────────────────────────────────────
  const loadCategories = useCallback(async (bSlug: string, gSlug: string) => {
    setLoadingParts(true)
    setPartsError('')
    setApiCategories([])
    try {
      const data = await fetchVehicleCategories(bSlug, gSlug)
      setApiCategories(data.categories)
      setTotalApiParts(data.total_parts)
      setApiAvailable(true)
      setPartsView('categories')
    } catch (e: unknown) {
      setPartsError(e instanceof Error ? e.message : 'Kategoriler yüklenemedi')
      setApiAvailable(false)
    } finally {
      setLoadingParts(false)
    }
  }, [])

  // ── Generation selected ───────────────────────────────────────────────────
  const handleGenerationSelect = useCallback(
    async (gen: VehicleGeneration, bSlug: string) => {
      setSelectedGen({ slug: gen.generation_slug, name: gen.generation_name })
      setBrandSlug(bSlug)
      await loadCategories(bSlug, gen.generation_slug)
    },
    [loadCategories],
  )

  // ── Category clicked ──────────────────────────────────────────────────────
  const handleCategoryClick = useCallback(
    async (cat: VehicleCategory) => {
      if (!selectedGen) return
      setSelectedCat(cat)
      setPartsView('nodes')
      setLoadingParts(true)
      setPartsError('')
      setNodeSearch('')
      setApiNodes([])
      try {
        const data = await fetchVehicleNodes(brandSlug, selectedGen.slug, cat.id)
        setApiNodes(data.nodes)
      } catch (e: unknown) {
        setPartsError(e instanceof Error ? e.message : 'Gruplar yüklenemedi')
      } finally {
        setLoadingParts(false)
      }
    },
    [brandSlug, selectedGen],
  )

  // ── Node clicked ──────────────────────────────────────────────────────────
  const handleNodeClick = useCallback(
    async (node: VehicleNode) => {
      if (!selectedGen) return
      setSelectedNode(node)
      setPartsView('parts')
      setLoadingParts(true)
      setPartsError('')
      setApiParts([])
      setPartsPage(1)
      try {
        const data = await fetchVehicleParts(brandSlug, selectedGen.slug, node.name)
        setApiParts(data.parts || [])
      } catch {
        setApiParts([])
      } finally {
        setLoadingParts(false)
      }
    },
    [brandSlug, selectedGen],
  )

  // ── Navigate back in drill-down ───────────────────────────────────────────
  const goBack = () => {
    if (partsView === 'parts') {
      setPartsView('nodes')
      setApiParts([])
      setSelectedNode(null)
    } else if (partsView === 'nodes') {
      setPartsView('categories')
      setApiNodes([])
      setSelectedCat(null)
    } else if (partsView === 'categories' && vehicleInfo?.generations && vehicleInfo.generations.length > 1) {
      setPartsView('generations')
      setApiCategories([])
      setSelectedGen(null)
      setApiAvailable(false)
    }
  }

  // ── Model select (when NHTSA missing model) ───────────────────────────────
  const handleModelSelect = (modelName: string, image?: string) => {
    if (!vehicleInfo) return
    const updated = { ...vehicleInfo, model: modelName }
    setVehicleInfo(updated)
    setMissingModel(false)
    setModelSearch('')
    if (image) setSelectedModelImage(image)

    // After model select, if no API data available show WhatsApp CTA (no brandSlug)
    // If brandSlug exists, try API — but at this point the vehicle had no generations
    // so nothing to load. apiAvailable stays false, showing WhatsApp CTA section.
  }

  // ── Main search handler ───────────────────────────────────────────────────
  const handleSearch = async () => {
    setError('')
    setVehicleInfo(null)
    setMissingModel(false)
    setBrandModels([])
    setSelectedModelImage('')
    resetApiState()

    if (!chassisNumber.trim()) {
      setError('Lütfen şase numarası girin')
      return
    }

    if (!validateVIN(chassisNumber.trim())) {
      setError(
        'Geçersiz şase numarası. Şase numarası 17 karakter olmalı ve I, O, Q harfleri içermemelidir.',
      )
      return
    }

    setIsSearching(true)

    try {
      const result = await decodeVIN(chassisNumber.trim())

      if (result.error || !result.data) {
        setError(result.error || 'Araç bilgisi bulunamadı.')
        return
      }

      const info = result.data
      setVehicleInfo(info)

      const generations = info.generations ?? []
      const bSlug = info.brandSlug ?? ''

      if (generations.length > 1) {
        // Show generation picker
        setBrandSlug(bSlug)
        setPartsView('generations')
        // apiAvailable will be set true after user picks a generation
      } else if (generations.length === 1) {
        // Auto-select the single generation
        setBrandSlug(bSlug)
        setSelectedGen({ slug: generations[0].generation_slug, name: generations[0].generation_name })
        await loadCategories(bSlug, generations[0].generation_slug)
      } else if (!info.model) {
        // No model, no generations — show model picker from vehicle-tree.json
        setMissingModel(true)
        try {
          const treeRes = await fetch('/data/vehicle-tree.json')
          const tree = await treeRes.json()
          const models = findBrandModels(tree, info.make)
          setBrandModels(models)
        } catch { /* ignore */ }
        setTimeout(
          () => modelSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          100,
        )
      } else {
        // Model exists but no brandSlug / generations → show WhatsApp CTA
        // apiAvailable stays false
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSearching(false)
    }
  }

  // ── WhatsApp helpers ──────────────────────────────────────────────────────
  const handleWhatsAppRequest = () => {
    const message =
      `Merhaba, şase numarası ile parça sorgulamak istiyorum.\n\nŞase No: ${chassisNumber}` +
      (vehicleInfo
        ? `\nMarka: ${vehicleInfo.make}\nModel: ${vehicleInfo.model}\nYıl: ${vehicleInfo.year}`
        : '') +
      '\n\nAradığım parça: '
    window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handlePartWhatsApp = (part: VehiclePart) => {
    const message =
      `Merhaba, aşağıdaki parça için fiyat bilgisi almak istiyorum.\n\nParça: ${part.name}\nOEM No: ${part.oem_number}` +
      (vehicleInfo
        ? `\nAraç: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nŞase No: ${chassisNumber}`
        : '')
    window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const whatsappCtaText =
    `Merhaba, ${vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model}` : 'aracım'} için parça arıyorum.` +
    (selectedCat ? `\nKategori: ${selectedCat.name_tr}` : '') +
    (selectedNode ? `\nGrup: ${selectedNode.label}` : '')

  // ── Derived values ────────────────────────────────────────────────────────
  const vehicleFields = vehicleInfo
    ? [
        { label: 'Marka',          value: vehicleInfo.make },
        { label: 'Model',          value: vehicleInfo.model },
        { label: 'Model Yılı',     value: vehicleInfo.year },
        { label: 'Kasa Tipi',      value: vehicleInfo.bodyType },
        { label: 'Motor',          value: formatEngine(vehicleInfo) },
        { label: 'Yakıt Tipi',     value: translateFuelType(vehicleInfo.fuelType) },
        { label: 'Beygir Gücü',    value: vehicleInfo.engineHP ? `${vehicleInfo.engineHP} HP` : '' },
        { label: 'Şanzıman',       value: translateTransmission(vehicleInfo.transmissionType) },
        { label: 'Çekiş',          value: vehicleInfo.driveType },
        { label: 'Kapı Sayısı',    value: vehicleInfo.doors },
        { label: 'Üretim Ülkesi',  value: vehicleInfo.plantCountry },
      ].filter(f => f.value)
    : []

  const filteredNodes = apiNodes.filter(
    n => !nodeSearch || n.label.toLowerCase().includes(nodeSearch.toLowerCase()),
  )
  const paginatedParts   = apiParts.slice(0, partsPage * PARTS_PER_PAGE)
  const remainingParts   = apiParts.length - paginatedParts.length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 md:p-8">

        {/* ── Search Input ── */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <label htmlFor="vin-input" className="sr-only">Şase Numarası (VIN)</label>
            <input
              id="vin-input"
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Şase numarasını girin (17 karakter)"
              maxLength={17}
              className="w-full px-4 py-4 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors font-mono text-lg tracking-wider"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {chassisNumber.length}/17
            </span>
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-8 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-dark-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sorgulanıyor...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Sorgula
              </>
            )}
          </button>
        </div>

        {/* ── Info Box ── */}
        <div className="flex items-start gap-3 p-4 bg-secondary-900/50 rounded-lg mb-6">
          <Info className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            Şase numarası (VIN) araç ruhsatınızda, ön camın sol alt köşesinde veya sürücü kapısı
            çerçevesinde bulunur. 17 karakterden oluşur ve I, O, Q harflerini içermez.
          </p>
        </div>

        {/* ── Error Message ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Vehicle Info Result ── */}
        {vehicleInfo && (
          <div className="animate-fadeIn">

            {/* ── Vehicle Card ── */}
            <div className="bg-gradient-to-br from-dark-800 to-dark-800/80 border border-dark-700 rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-black/20">
              {/* Status Bar */}
              <div
                className={`px-6 py-3 ${
                  missingModel
                    ? 'bg-amber-500/[0.06] border-b border-amber-500/10'
                    : 'bg-green-500/[0.06] border-b border-green-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {missingModel ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-400 text-sm font-medium">
                        Marka bulundu — model bilgisi eksik
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-400 text-sm font-medium">
                        Araç bilgileri bulundu
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Vehicle Header — Image + Info + CTA */}
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  {/* Left: Vehicle Image or Brand Logo */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    {selectedModelImage ? (
                      <div className="w-40 h-28 md:w-48 md:h-32 rounded-2xl bg-gradient-to-b from-dark-900/80 to-dark-900 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedModelImage}
                          alt={vehicleInfo.model}
                          className="w-full h-full object-contain p-2"
                        />
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
                      {vehicleInfo.make}{' '}
                      {vehicleInfo.model ? (
                        cleanModelName(vehicleInfo.model)
                      ) : (
                        <span className="text-gray-600 italic font-normal text-xl">
                          Model seçilmedi
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {[vehicleInfo.year, vehicleInfo.series, vehicleInfo.bodyType]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {!missingModel && (
                        <button
                          onClick={handleWhatsAppRequest}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp ile Talep Et
                        </button>
                      )}
                      <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-dark-900/60 border border-white/[0.06] rounded-xl">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">VIN</span>
                        <span className="text-white font-mono text-xs tracking-wider">{chassisNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Model Selection Panel (NHTSA missing model) ── */}
                {missingModel && brandModels.length > 0 && (
                  <div
                    ref={modelSelectRef}
                    className="mb-6 p-4 md:p-5 bg-amber-500/[0.04] border border-amber-500/15 rounded-xl animate-fadeIn"
                  >
                    <p className="text-amber-400 text-sm font-medium mb-1">Aracınızın modelini seçin</p>
                    <p className="text-gray-500 text-xs mb-3">
                      NHTSA veritabanında bu VIN için model bilgisi bulunamadı.
                    </p>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Model ara..."
                        className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        {brandModels
                          .filter(
                            m =>
                              !modelSearch ||
                              m.name.toLowerCase().includes(modelSearch.toLowerCase()),
                          )
                          .map((m, i) => {
                            const year = parseModelYear(m.name)
                            return (
                              <button
                                key={i}
                                onClick={() => handleModelSelect(m.name, m.image)}
                                className="group relative rounded-lg overflow-hidden bg-dark-900 border border-dark-600 hover:border-primary-500/40 hover:shadow-[0_4px_16px_rgba(234,179,8,0.08)] transition-all duration-200 text-left"
                              >
                                <div className="relative aspect-[4/3] bg-gradient-to-b from-dark-800/60 to-dark-900/80 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.image}
                                    alt={m.name}
                                    className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                  {year > 0 && (
                                    <span className="absolute top-1 right-1 text-[8px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-dark-900/70 backdrop-blur-sm border border-white/[0.08] text-gray-400">
                                      {year}
                                    </span>
                                  )}
                                  <span className="absolute top-1 left-1 text-[8px] font-medium text-gray-500 bg-dark-900/80 backdrop-blur-sm px-1 py-0.5 rounded">
                                    {m.bodyType}
                                  </span>
                                </div>
                                <div className="px-2 py-1.5">
                                  <p className="text-[11px] text-gray-400 group-hover:text-white transition-colors duration-200 leading-tight line-clamp-1 font-medium">
                                    {cleanModelName(m.name)}
                                  </p>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                      {brandModels.filter(
                        m =>
                          !modelSearch ||
                          m.name.toLowerCase().includes(modelSearch.toLowerCase()),
                      ).length === 0 && (
                        <p className="text-gray-500 text-xs text-center py-6">Sonuç bulunamadı</p>
                      )}
                    </div>
                  </div>
                )}

                {missingModel && brandModels.length === 0 && (
                  <div
                    ref={modelSelectRef}
                    className="mb-6 p-4 bg-amber-500/[0.04] border border-amber-500/15 rounded-xl animate-fadeIn"
                  >
                    <p className="text-amber-400 text-sm font-medium mb-1">
                      Model bilgisi bulunamadı
                    </p>
                    <p className="text-gray-500 text-xs mb-3">
                      Bu marka için veritabanımızda model listesi bulunmuyor.
                    </p>
                    <button
                      onClick={handleWhatsAppRequest}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp ile Sor
                    </button>
                  </div>
                )}

                {/* ── Vehicle Specs Grid ── */}
                {vehicleFields.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.06]">
                    {vehicleFields.map((field) => (
                      <div key={field.label} className="bg-dark-800 px-4 py-3.5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">
                          {field.label}
                        </p>
                        <p className="text-white text-sm font-semibold">{field.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Parts Section ── */}
            {!missingModel && (
              <div>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Uyumlu Parçalar</h3>
                      {apiAvailable && totalApiParts > 0 && (
                        <p className="text-gray-500 text-xs">
                          {apiCategories.length} kategori · {totalApiParts.toLocaleString('tr-TR')} parça
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── No API Data: WhatsApp CTA ── */}
                {!apiAvailable && !loadingParts && (
                  <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                      <Wrench className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-400 mb-1 text-sm">
                      Bu araç için katalog verisi henüz sistemimizde yok.
                    </p>
                    <p className="text-gray-600 text-xs mb-4">
                      WhatsApp üzerinden tüm parçaları talep edebilirsiniz.
                    </p>
                    <button
                      onClick={handleWhatsAppRequest}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp ile Talep Et
                    </button>
                  </div>
                )}

                {/* ── Loading Indicator ── */}
                {loadingParts && (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                )}

                {/* ── API Error ── */}
                {partsError && !loadingParts && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{partsError}</p>
                  </div>
                )}

                {/* ── DRILL-DOWN UI ── */}
                {apiAvailable && !loadingParts && !partsError && (
                  <>
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-5 flex-wrap">
                      <button
                        onClick={() => {
                          setPartsView('categories')
                          setSelectedCat(null)
                          setSelectedNode(null)
                          setApiNodes([])
                          setApiParts([])
                        }}
                        className={`transition-colors ${
                          partsView === 'categories'
                            ? 'text-white font-medium'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Kategoriler
                      </button>
                      {selectedCat && (
                        <>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                          <button
                            onClick={() => {
                              setPartsView('nodes')
                              setSelectedNode(null)
                              setApiParts([])
                            }}
                            className={`transition-colors ${
                              partsView === 'nodes'
                                ? 'text-white font-medium'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
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

                    {/* ── GENERATION PICKER ── */}
                    {partsView === 'generations' && (
                      <div>
                        <p className="text-gray-400 text-sm mb-5">
                          {(vehicleInfo.generations ?? []).length} nesil eşleşme bulundu. Aracınızın nesline göre seçin:
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(vehicleInfo.generations ?? []).map((gen) => (
                            <button
                              key={gen.generation_slug}
                              onClick={() => handleGenerationSelect(gen, brandSlug)}
                              className="group bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500/40 hover:shadow-[0_4px_20px_rgba(234,179,8,0.06)] transition-all text-left"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-semibold text-sm group-hover:text-primary-500 transition-colors">
                                  {gen.generation_name}
                                </h4>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-500 transition-colors" />
                              </div>
                              <p className="text-gray-500 text-xs">
                                {gen.part_count.toLocaleString('tr-TR')} parça
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── CATEGORIES VIEW ── */}
                    {partsView === 'categories' && (
                      <>
                        {/* Back to generations if multiple */}
                        {(vehicleInfo.generations ?? []).length > 1 && selectedGen && (
                          <button
                            onClick={() => {
                              setPartsView('generations')
                              setApiCategories([])
                              setSelectedGen(null)
                              setApiAvailable(false)
                            }}
                            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" /> Nesillere Dön
                          </button>
                        )}
                        {selectedGen && (
                          <p className="text-xs text-gray-500 mb-4">
                            Nesil: <span className="text-gray-300">{selectedGen.name}</span>
                          </p>
                        )}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {apiCategories.map((cat) => {
                            const style = catStyleMap[cat.id] || catStyleMap.other
                            return (
                              <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className="group bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500/40 hover:shadow-[0_4px_20px_rgba(234,179,8,0.04)] transition-all text-left"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-11 h-11 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-lg`}
                                  >
                                    {cat.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-primary-500 transition-colors">
                                      {cat.name_tr}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500 text-xs">
                                        {cat.total_parts.toLocaleString('tr-TR')} parça
                                      </span>
                                      <span className="text-gray-600 text-xs">
                                        {cat.node_count} grup
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* ── NODES VIEW ── */}
                    {partsView === 'nodes' && (
                      <div>
                        <button
                          onClick={goBack}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" /> Kategorilere Dön
                        </button>

                        {apiNodes.length > 10 && (
                          <div className="relative mb-5">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              type="text"
                              value={nodeSearch}
                              onChange={(e) => setNodeSearch(e.target.value)}
                              placeholder="Grup ara..."
                              className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                            />
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredNodes.map((node) => (
                            <button
                              key={node.name}
                              onClick={() => handleNodeClick(node)}
                              className="group bg-dark-800 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 hover:shadow-[0_4px_16px_rgba(234,179,8,0.04)] transition-all text-left flex items-center gap-3"
                            >
                              <div className="w-9 h-9 rounded-lg bg-white/[0.04] group-hover:bg-primary-500/10 flex items-center justify-center flex-shrink-0 transition-colors">
                                <Package className="w-4 h-4 text-gray-500 group-hover:text-primary-500 transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 group-hover:text-white font-medium transition-colors truncate">
                                  {node.label}
                                </p>
                                <p className="text-xs text-gray-600">{node.part_count} parça</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
                            </button>
                          ))}
                        </div>

                        {filteredNodes.length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-10">
                            Sonuç bulunamadı
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── PARTS VIEW ── */}
                    {partsView === 'parts' && (
                      <div>
                        <button
                          onClick={goBack}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          {selectedCat?.name_tr || 'Geri'}
                        </button>

                        {apiParts.length > 0 ? (
                          <>
                            <p className="text-xs text-gray-500 mb-4">
                              {apiParts.length} parça listeleniyor
                            </p>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {paginatedParts.map((part, i) => (
                                <div
                                  key={`${part.oem_number}-${i}`}
                                  className="group bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] rounded-xl p-4 hover:border-primary-500/25 hover:shadow-[0_4px_16px_rgba(234,179,8,0.04)] transition-all duration-200"
                                >
                                  <h4 className="text-white font-semibold text-sm mb-2 group-hover:text-primary-500 transition-colors leading-snug">
                                    {part.name}
                                  </h4>
                                  <div className="mb-3">
                                    <OemBadge oem={part.oem_number} />
                                  </div>
                                  <button
                                    onClick={() => handlePartWhatsApp(part)}
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
                                onClick={() => setPartsPage((p) => p + 1)}
                                className="mt-4 w-full py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-gray-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                              >
                                Daha Fazla Göster
                                <span className="text-xs text-gray-500">
                                  ({remainingParts} parça daha)
                                </span>
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
                            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                              <Package className="w-6 h-6 text-gray-600" />
                            </div>
                            <p className="text-gray-400 mb-1 text-sm">
                              Bu grup için parça detayları yüklenemedi.
                            </p>
                            <p className="text-gray-600 text-xs mb-4">
                              WhatsApp üzerinden bu gruptaki parçaları talep edebilirsiniz.
                            </p>
                            <button
                              onClick={() => {
                                const msg = `Merhaba, ${vehicleInfo.make} ${vehicleInfo.model} için "${selectedNode?.label}" grubundaki parçalar hakkında bilgi almak istiyorum.`
                                window.open(
                                  `https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(msg)}`,
                                  '_blank',
                                )
                              }}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp ile Talep Et
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Bottom CTA ── */}
            <div className="mt-8 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-white font-bold text-base mb-1">
                  Aradığınız parça listede yok mu?
                </h4>
                <p className="text-gray-400 text-sm">
                  Şase numaranızla birlikte WhatsApp&apos;tan talep gönderin, size en uygun parçayı
                  bulalım.
                </p>
              </div>
              <a
                href={getWhatsAppUrl(whatsappCtaText)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Talep Oluştur
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
