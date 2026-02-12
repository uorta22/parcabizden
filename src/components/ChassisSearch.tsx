'use client'

import { useState } from 'react'
import { Search, AlertCircle, CheckCircle, MessageCircle, Info, ChevronDown, ChevronRight, Wrench } from 'lucide-react'
import type { VehicleInfo, NHTSAResponse } from '@/types/vehicle'
import type { Part } from '@/data/parts'
import { getCompatibleParts, groupPartsByCategory, getCategoryById } from '@/data/parts'
import { BrandLogo } from '@/components/BrandLogos'

function translateFuelType(fuel: string): string {
  const map: Record<string, string> = {
    'gasoline': 'Benzin',
    'diesel': 'Dizel',
    'electric': 'Elektrik',
    'hybrid': 'Hibrit',
    'plug-in hybrid': 'Plug-in Hibrit',
    'compressed natural gas (cng)': 'Dogalgaz (CNG)',
    'liquefied petroleum gas (lpg)': 'LPG',
  }
  return map[fuel.toLowerCase()] || fuel
}

function translateTransmission(trans: string): string {
  if (!trans) return ''
  if (trans.toLowerCase().includes('automatic')) return 'Otomatik'
  if (trans.toLowerCase().includes('manual')) return 'Manuel'
  if (trans.toLowerCase().includes('cvt')) return 'CVT'
  return trans
}

function formatEngine(info: VehicleInfo): string {
  const parts: string[] = []
  if (info.displacementL) parts.push(`${info.displacementL}L`)
  if (info.engineCylinders) parts.push(`${info.engineCylinders} Silindir`)
  return parts.join(' ')
}

function formatMake(make: string): string {
  const upper = make.toUpperCase().trim()
  const knownBrands: Record<string, string> = {
    'BMW': 'BMW', 'MG': 'MG', 'BYD': 'BYD', 'DS': 'DS',
    'MERCEDES-BENZ': 'Mercedes-Benz', 'LAND ROVER': 'Land Rover',
  }
  if (knownBrands[upper]) return knownBrands[upper]
  return make.charAt(0).toUpperCase() + make.slice(1).toLowerCase()
}

function clean(val: string | undefined): string {
  if (!val || val === 'Not Applicable' || val === 'null') return ''
  return val.trim()
}

async function decodeVIN(vin: string): Promise<{ data?: VehicleInfo; error?: string }> {
  const response = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
  )

  if (!response.ok) {
    return { error: 'NHTSA API ile baglanti kurulamadi. Lutfen tekrar deneyin.' }
  }

  const nhtsaData: NHTSAResponse = await response.json()

  if (!nhtsaData.Results || nhtsaData.Results.length === 0) {
    return { error: 'NHTSA API sonuc dondurmedi.' }
  }

  const result = nhtsaData.Results[0]
  const errorCodes = (result.ErrorCode || '').split(',').map(c => c.trim())
  const isFatalError = errorCodes.includes('5')

  if (isFatalError || !result.Make) {
    return { error: 'Bu VIN numarasi icin arac bilgisi bulunamadi. Lutfen VIN numarasini kontrol edin.' }
  }

  const vehicleInfo: VehicleInfo = {
    make: formatMake(clean(result.Make)),
    model: clean(result.Model),
    year: clean(result.ModelYear),
    series: clean(result.Series),
    bodyType: clean(result.BodyClass),
    engineCylinders: clean(result.EngineCylinders),
    engineHP: clean(result.EngineHP),
    displacementL: clean(result.DisplacementL),
    fuelType: clean(result.FuelTypePrimary),
    transmissionType: clean(result.TransmissionStyle),
    driveType: clean(result.DriveType),
    plantCountry: clean(result.PlantCountry),
    doors: clean(result.Doors),
    vin: vin.toUpperCase(),
  }

  return { data: vehicleInfo }
}

export default function ChassisSearch() {
  const [chassisNumber, setChassisNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [compatibleParts, setCompatibleParts] = useState<Record<string, Part[]>>({})
  const [error, setError] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  const validateChassis = (vin: string): boolean => {
    if (vin.length !== 17) return false
    if (/[IOQ]/i.test(vin)) return false
    if (!/^[A-HJ-NPR-Z0-9]+$/i.test(vin)) return false
    return true
  }

  const handleSearch = async () => {
    setError('')
    setVehicleInfo(null)
    setCompatibleParts({})
    setOpenCategories(new Set())

    if (!chassisNumber.trim()) {
      setError('Lutfen sase numarasi girin')
      return
    }

    if (!validateChassis(chassisNumber.trim())) {
      setError('Gecersiz sase numarasi. Sase numarasi 17 karakter olmali ve I, O, Q harfleri icermemelidir.')
      return
    }

    setIsSearching(true)

    try {
      const result = await decodeVIN(chassisNumber.trim())

      if (result.error || !result.data) {
        setError(result.error || 'Arac bilgisi bulunamadi.')
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
      setError('Bir hata olustu. Lutfen tekrar deneyin.')
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
    const message = `Merhaba, sase numarasi ile parca sorgulama yapmak istiyorum.\n\nSase No: ${chassisNumber}\n${vehicleInfo ? `Marka: ${vehicleInfo.make}\nModel: ${vehicleInfo.model}\nYil: ${vehicleInfo.year}` : ''}\n\nAradigim parca: `
    window.open(`https://wa.me/905001234567?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handlePartWhatsApp = (part: Part) => {
    const message = `Merhaba, asagidaki parca icin fiyat bilgisi almak istiyorum.\n\nParca: ${part.name}\nKategori: ${part.categoryName}\n${vehicleInfo ? `Arac: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nSase No: ${chassisNumber}` : ''}`
    window.open(`https://wa.me/905001234567?text=${encodeURIComponent(message)}`, '_blank')
  }

  const totalParts = Object.values(compatibleParts).reduce((sum, parts) => sum + parts.length, 0)

  const vehicleFields = vehicleInfo ? [
    { label: 'Marka', value: vehicleInfo.make },
    { label: 'Model', value: vehicleInfo.model },
    { label: 'Model Yili', value: vehicleInfo.year },
    { label: 'Kasa Tipi', value: vehicleInfo.bodyType },
    { label: 'Motor', value: formatEngine(vehicleInfo) },
    { label: 'Yakit Tipi', value: translateFuelType(vehicleInfo.fuelType) },
    { label: 'Beygir Gucu', value: vehicleInfo.engineHP ? `${vehicleInfo.engineHP} HP` : '' },
    { label: 'Sanziman', value: translateTransmission(vehicleInfo.transmissionType) },
    { label: 'Cekis', value: vehicleInfo.driveType },
    { label: 'Kapi Sayisi', value: vehicleInfo.doors },
    { label: 'Uretim Ulkesi', value: vehicleInfo.plantCountry },
  ].filter(f => f.value) : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 md:p-8">
        {/* Search Input */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Sase numarasini girin (17 karakter)"
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
            Sase numarasi (VIN) arac ruhsatinizda, on camin sol alt kosesinde veya surucu kapisi cercevesinde bulunur.
            17 karakterden olusur ve I, O, Q harflerini icermez.
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
              <span className="text-green-500 font-medium">Arac bilgileri bulundu</span>
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
                  <p className="text-gray-500 text-xs mb-1">Sase Numarasi</p>
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
                    Uyumlu Parcalar
                  </h3>
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-500 rounded-full text-sm font-medium">
                    {totalParts} parca
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
                  Bu arac icin veri tabanımızda spesifik parca bulunamadi.
                </p>
                <p className="text-gray-500 text-sm">
                  Ancak tum parcalarimizi WhatsApp uzerinden talep edebilirsiniz.
                </p>
              </div>
            )}

            {/* WhatsApp CTA */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-2">Tum Parcalar Icin Talep Olusturun</h4>
              <p className="text-gray-400 text-sm mb-4">
                Aradiginiz parca listede yok mu? WhatsApp uzerinden sase numaranizla birlikte talep gonderin, size en uygun parcayi bulalim.
              </p>
              <button
                onClick={handleWhatsAppRequest}
                className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Parca Talep Et
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
