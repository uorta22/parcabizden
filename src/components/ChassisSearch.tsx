'use client'

import { useState } from 'react'
import { Search, AlertCircle, CheckCircle, MessageCircle, Info, ChevronDown, ChevronRight, Wrench } from 'lucide-react'
import type { VehicleInfo } from '@/types/vehicle'
import type { Part } from '@/data/parts'
import { getCompatibleParts, groupPartsByCategory, getCategoryById } from '@/data/parts'
import { BrandLogo } from '@/components/BrandLogos'
import { siteConfig } from '@/lib/config'
import { validateVIN, decodeVIN, translateFuelType, translateTransmission, formatEngine } from '@/lib/vehicle'

export default function ChassisSearch() {
  const [chassisNumber, setChassisNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [compatibleParts, setCompatibleParts] = useState<Record<string, Part[]>>({})
  const [error, setError] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    setError('')
    setVehicleInfo(null)
    setCompatibleParts({})
    setOpenCategories(new Set())

    if (!chassisNumber.trim()) {
      setError('Lütfen şase numarası girin')
      return
    }

    if (!validateVIN(chassisNumber.trim())) {
      setError('Geçersiz şase numarası. Şase numarası 17 karakter olmalı ve I, O, Q harfleri içermemelidir.')
      return
    }

    setIsSearching(true)

    try {
      const result = await decodeVIN(chassisNumber.trim())

      if (result.error || !result.data) {
        setError(result.error || 'Araç bilgisi bulunamadı.')
        return
      }

      setVehicleInfo(result.data)

      const filtered = getCompatibleParts(
        result.data.make,
        result.data.fuelType,
        result.data.transmissionType
      )
      const grouped = groupPartsByCategory(filtered)
      setCompatibleParts(grouped)

      const firstCategory = Object.keys(grouped)[0]
      if (firstCategory) {
        setOpenCategories(new Set([firstCategory]))
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSearching(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handleWhatsAppRequest = () => {
    const message = `Merhaba, şase numarası ile parça sorgulamak istiyorum.\n\nŞase No: ${chassisNumber}\n${vehicleInfo ? `Marka: ${vehicleInfo.make}\nModel: ${vehicleInfo.model}\nYıl: ${vehicleInfo.year}` : ''}\n\nAradığım parça: `
    window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handlePartWhatsApp = (part: Part) => {
    const message = `Merhaba, aşağıdaki parça için fiyat bilgisi almak istiyorum.\n\nParça: ${part.name}\nKategori: ${part.categoryName}\n${vehicleInfo ? `Araç: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nŞase No: ${chassisNumber}` : ''}`
    window.open(`https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const totalParts = Object.values(compatibleParts).reduce((sum, parts) => sum + parts.length, 0)

  const vehicleFields = vehicleInfo ? [
    { label: 'Marka', value: vehicleInfo.make },
    { label: 'Model', value: vehicleInfo.model },
    { label: 'Model Yılı', value: vehicleInfo.year },
    { label: 'Kasa Tipi', value: vehicleInfo.bodyType },
    { label: 'Motor', value: formatEngine(vehicleInfo) },
    { label: 'Yakıt Tipi', value: translateFuelType(vehicleInfo.fuelType) },
    { label: 'Beygir Gücü', value: vehicleInfo.engineHP ? `${vehicleInfo.engineHP} HP` : '' },
    { label: 'Şanzıman', value: translateTransmission(vehicleInfo.transmissionType) },
    { label: 'Çekiş', value: vehicleInfo.driveType },
    { label: 'Kapı Sayısı', value: vehicleInfo.doors },
    { label: 'Üretim Ülkesi', value: vehicleInfo.plantCountry },
  ].filter(f => f.value) : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 md:p-8">
        {/* Search Input */}
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
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
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

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-secondary-900/50 rounded-lg mb-6">
          <Info className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            Şase numarası (VIN) araç ruhsatınızda, ön camın sol alt köşesinde veya sürücü kapısı çerçevesinde bulunur.
            17 karakterden oluşur ve I, O, Q harflerini içermez.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Vehicle Info Result */}
        {vehicleInfo && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium">Araç bilgileri bulundu</span>
            </div>

            {/* Vehicle Info Card */}
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-600">
                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center p-1.5">
                  <BrandLogo brand={vehicleInfo.make} size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {vehicleInfo.make} {vehicleInfo.model}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {vehicleInfo.year}{vehicleInfo.series ? ` | ${vehicleInfo.series}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicleFields.map((field) => (
                  <div key={field.label}>
                    <p className="text-gray-500 text-xs mb-1">{field.label}</p>
                    <p className="text-white font-medium text-sm">{field.value}</p>
                  </div>
                ))}
                <div className="col-span-2 md:col-span-3">
                  <p className="text-gray-500 text-xs mb-1">Şase Numarası</p>
                  <p className="text-white font-mono tracking-wider text-sm">{chassisNumber}</p>
                </div>
              </div>
            </div>

            {/* Compatible Parts Section */}
            {totalParts > 0 ? (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wrench className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-bold text-white">
                    Uyumlu Parçalar
                  </h3>
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-500 rounded-full text-sm font-medium">
                    {totalParts} parça
                  </span>
                </div>

                <div className="space-y-3">
                  {Object.entries(compatibleParts).map(([categoryId, categoryParts]) => {
                    const category = getCategoryById(categoryId)
                    const isOpen = openCategories.has(categoryId)

                    return (
                      <div key={categoryId} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryId)}
                          className="w-full flex items-center justify-between p-4 hover:bg-dark-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-white font-semibold">
                              {category?.name || categoryId}
                            </span>
                            <span className="px-2 py-0.5 bg-dark-600 text-gray-400 rounded-full text-xs">
                              {categoryParts.length}
                            </span>
                          </div>
                          {isOpen ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {/* Parts Grid */}
                        {isOpen && (
                          <div className="border-t border-dark-700 p-4">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {categoryParts.map((part) => (
                                <div
                                  key={part.id}
                                  className="bg-dark-900 border border-dark-600 rounded-lg p-4 hover:border-primary-500/30 transition-all group"
                                >
                                  <h4 className="text-white font-semibold mb-1 group-hover:text-primary-500 transition-colors">
                                    {part.name}
                                  </h4>
                                  <p className="text-gray-400 text-xs mb-3">
                                    {part.description}
                                  </p>
                                  <button
                                    onClick={() => handlePartWhatsApp(part)}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white rounded-lg transition-all text-sm font-medium"
                                  >
                                    <MessageCircle className="w-4 h-4" />
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
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-6 text-center">
                <p className="text-gray-400 mb-2">
                  Bu araç için veri tabanımızda spesifik parça bulunamadı.
                </p>
                <p className="text-gray-500 text-sm">
                  Ancak tüm parçalarımızı WhatsApp üzerinden talep edebilirsiniz.
                </p>
              </div>
            )}

            {/* WhatsApp CTA */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-2">Tüm Parçalar İçin Talep Oluşturun</h4>
              <p className="text-gray-400 text-sm mb-4">
                Aradığınız parça listede yok mu? WhatsApp üzerinden şase numaranızla birlikte talep gönderin, size en uygun parçayı bulalım.
              </p>
              <button
                onClick={handleWhatsAppRequest}
                className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Parça Talep Et
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
