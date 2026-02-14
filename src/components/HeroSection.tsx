'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, MessageCircle, Sparkles, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Wrench, Info, Car } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogos'
import type { VehicleInfo } from '@/types/vehicle'
import { getCompatibleParts, groupPartsByCategory, getCategoryById } from '@/data/parts'
import type { Part } from '@/data/parts'
import { siteConfig } from '@/lib/config'
import { validateVIN as validateVINUtil, decodeVIN, translateFuelType, translateTransmission } from '@/lib/vehicle'

export default function HeroSection() {
  const [vin, setVin] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [parts, setParts] = useState<Record<string, Part[]>>({})
  const [error, setError] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())
  const [showAI, setShowAI] = useState(false)
  const [aiQuery, setAiQuery] = useState('')

  const handleSearch = useCallback(async () => {
    setError(''); setVehicleInfo(null); setParts({}); setOpenCats(new Set())
    if (!vin.trim()) { setError('Lütfen şase numarası girin'); return }
    if (!validateVINUtil(vin.trim())) { setError('Geçersiz VIN. 17 karakter, I/O/Q hariç.'); return }
    setIsSearching(true)
    const result = await decodeVIN(vin.trim())
    setIsSearching(false)
    if (result.error || !result.data) { setError(result.error || 'Bulunamadı.'); return }
    setVehicleInfo(result.data)
    const filtered = getCompatibleParts(result.data.make, result.data.fuelType, result.data.transmissionType)
    const grouped = groupPartsByCategory(filtered)
    setParts(grouped)
    const first = Object.keys(grouped)[0]
    if (first) setOpenCats(new Set([first]))
  }, [vin])

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

  const totalParts = Object.values(parts).reduce((s, p) => s + p.length, 0)

  const vehicleFields = useMemo(() => vehicleInfo ? [
    { l: 'Marka', v: vehicleInfo.make }, { l: 'Model', v: vehicleInfo.model },
    { l: 'Yıl', v: vehicleInfo.year }, { l: 'Kasa', v: vehicleInfo.bodyType },
    { l: 'Motor', v: [vehicleInfo.displacementL && `${vehicleInfo.displacementL}L`, vehicleInfo.engineCylinders && `${vehicleInfo.engineCylinders} Sil.`].filter(Boolean).join(' ') },
    { l: 'Yakıt', v: translateFuelType(vehicleInfo.fuelType) },
    { l: 'Güç', v: vehicleInfo.engineHP ? `${vehicleInfo.engineHP} HP` : '' },
    { l: 'Şanzıman', v: translateTransmission(vehicleInfo.transmissionType) },
  ].filter(f => f.v) : [], [vehicleInfo])

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
            <div className="max-w-4xl mx-auto animate-fadeIn">
              {/* Vehicle Card */}
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 md:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 text-sm font-medium">Araç bilgileri bulundu</span>
                </div>

                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-dark-600">
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center p-1.5 flex-shrink-0">
                    <BrandLogo brand={vehicleInfo.make} size={40} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{vehicleInfo.make} {vehicleInfo.model}</h3>
                    <p className="text-gray-400 text-sm">{vehicleInfo.year}{vehicleInfo.series ? ` | ${vehicleInfo.series}` : ''}</p>
                  </div>
                  <button
                    onClick={() => whatsappBase('Bu araç için parça talebi oluşturmak istiyorum.')}
                    className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Parça Talep Et
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vehicleFields.map((f) => (
                    <div key={f.l} className="bg-dark-900/50 rounded-lg px-3 py-2.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{f.l}</p>
                      <p className="text-white text-sm font-medium">{f.v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-dark-900/50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Şase Numarası</p>
                  <p className="text-white font-mono text-sm tracking-wider">{vin}</p>
                </div>

                {/* Mobile WhatsApp CTA */}
                <button
                  onClick={() => whatsappBase('Bu araç için parça talebi oluşturmak istiyorum.')}
                  className="md:hidden flex items-center justify-center gap-2 w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp ile Parça Talep Et
                </button>
              </div>

              {/* Compatible Parts */}
              {totalParts > 0 ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Wrench className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-white">Uyumlu Parçalar</h3>
                    <span className="px-2.5 py-0.5 bg-primary-500/15 text-primary-500 rounded-full text-xs font-semibold">{totalParts}</span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(parts).map(([catId, catParts]) => {
                      const cat = getCategoryById(catId)
                      const isOpen = openCats.has(catId)
                      return (
                        <div key={catId} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenCats(prev => { const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n })}
                            className="w-full flex items-center justify-between p-4 hover:bg-dark-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-white font-semibold text-sm">{cat?.name || catId}</span>
                              <span className="px-2 py-0.5 bg-dark-600 text-gray-400 rounded-full text-[11px]">{catParts.length}</span>
                            </div>
                            {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </button>
                          {isOpen && (
                            <div className="border-t border-dark-700 p-4">
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {catParts.map((part) => (
                                  <div key={part.id} className="bg-dark-900 border border-dark-600 rounded-lg p-4 hover:border-primary-500/30 transition-all group">
                                    <h4 className="text-white font-semibold text-sm mb-1 group-hover:text-primary-500 transition-colors">{part.name}</h4>
                                    <p className="text-gray-500 text-xs mb-3">{part.description}</p>
                                    <button
                                      onClick={() => {
                                        const msg = `Parça: ${part.name}\nKategori: ${part.categoryName}\nAraç: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nŞase: ${vin}`
                                        whatsappBase(msg)
                                      }}
                                      className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-green-600/15 hover:bg-green-600 text-green-400 hover:text-white rounded-lg transition-all text-xs font-medium"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      Fiyat Sor
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
                  <p className="text-gray-400 mb-1 text-sm">Bu araç için spesifik parça bulunamadı.</p>
                  <p className="text-gray-600 text-xs">WhatsApp üzerinden tüm parçaları talep edebilirsiniz.</p>
                </div>
              )}

              {/* Bottom CTA */}
              <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-xl p-5">
                <h4 className="text-white font-semibold text-sm mb-1">Aradığınız parça listede yok mu?</h4>
                <p className="text-gray-400 text-xs mb-3">Şase numaranızla birlikte WhatsApp&apos;tan talep gönderin, size en uygun parçayı bulalım.</p>
                <button
                  onClick={() => whatsappBase('Listede olmayan bir parça arıyorum. Yardımcı olur musunuz?')}
                  className="w-full md:w-auto px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
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
