'use client'

import { useState } from 'react'
import { Search, AlertCircle, CheckCircle, MessageCircle, Car, Info } from 'lucide-react'

interface VehicleInfo {
  brand: string
  model: string
  year: string
  engine: string
  bodyType: string
}

export default function ChassisSearch() {
  const [chassisNumber, setChassisNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [error, setError] = useState('')

  const validateChassis = (vin: string): boolean => {
    // VIN should be exactly 17 characters
    if (vin.length !== 17) return false
    // VIN should not contain I, O, Q
    if (/[IOQ]/i.test(vin)) return false
    // VIN should be alphanumeric
    if (!/^[A-HJ-NPR-Z0-9]+$/i.test(vin)) return false
    return true
  }

  const decodeVIN = (vin: string): VehicleInfo | null => {
    // Simple VIN decoder based on WMI (World Manufacturer Identifier)
    const wmi = vin.substring(0, 3).toUpperCase()

    const manufacturers: { [key: string]: { brand: string; country: string } } = {
      'WVW': { brand: 'Volkswagen', country: 'Almanya' },
      'WBA': { brand: 'BMW', country: 'Almanya' },
      'WDB': { brand: 'Mercedes-Benz', country: 'Almanya' },
      'WAU': { brand: 'Audi', country: 'Almanya' },
      'WF0': { brand: 'Ford', country: 'Almanya' },
      'ZFA': { brand: 'Fiat', country: 'Italya' },
      'VF1': { brand: 'Renault', country: 'Fransa' },
      'VF7': { brand: 'Citroen', country: 'Fransa' },
      'VF3': { brand: 'Peugeot', country: 'Fransa' },
      'TMB': { brand: 'Skoda', country: 'Cekya' },
      'SHH': { brand: 'Honda', country: 'Ingiltere' },
      'JTD': { brand: 'Toyota', country: 'Japonya' },
      'JN1': { brand: 'Nissan', country: 'Japonya' },
      'JMZ': { brand: 'Mazda', country: 'Japonya' },
      'KMH': { brand: 'Hyundai', country: 'Kore' },
      'KNA': { brand: 'Kia', country: 'Kore' },
      'NMT': { brand: 'Toyota', country: 'Turkiye' },
      'NM4': { brand: 'Tofas/Fiat', country: 'Turkiye' },
      'NM0': { brand: 'Ford', country: 'Turkiye' },
      '1G1': { brand: 'Chevrolet', country: 'ABD' },
      '1FA': { brand: 'Ford', country: 'ABD' },
      '2HG': { brand: 'Honda', country: 'Kanada' },
    }

    // Get year from 10th character
    const yearChar = vin.charAt(9).toUpperCase()
    const yearMap: { [key: string]: string } = {
      'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014',
      'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018', 'K': '2019',
      'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024',
      'S': '2025', 'T': '2026',
      '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005',
      '6': '2006', '7': '2007', '8': '2008', '9': '2009',
    }

    const manufacturerInfo = manufacturers[wmi] || { brand: 'Bilinmeyen Marka', country: 'Bilinmiyor' }
    const year = yearMap[yearChar] || 'Bilinmiyor'

    return {
      brand: manufacturerInfo.brand,
      model: 'Model bilgisi icin bizimle iletisime gecin',
      year: year,
      engine: 'Motor bilgisi icin sase numarasini WhatsApp ile gonderin',
      bodyType: 'Arac tipi bilgisi icin sase numarasini paylasın'
    }
  }

  const handleSearch = () => {
    setError('')
    setVehicleInfo(null)

    if (!chassisNumber.trim()) {
      setError('Lutfen sase numarasi girin')
      return
    }

    if (!validateChassis(chassisNumber.trim())) {
      setError('Gecersiz sase numarasi. Sase numarasi 17 karakter olmali ve I, O, Q harfleri icermemelidir.')
      return
    }

    setIsSearching(true)

    // Simulate API call
    setTimeout(() => {
      const info = decodeVIN(chassisNumber.trim())
      setVehicleInfo(info)
      setIsSearching(false)
    }, 1500)
  }

  const handleWhatsAppRequest = () => {
    const message = `Merhaba, sase numarasi ile parca sorgulama yapmak istiyorum.\n\nSase No: ${chassisNumber}\n${vehicleInfo ? `Marka: ${vehicleInfo.brand}\nYil: ${vehicleInfo.year}` : ''}\n\nAradigim parca: `
    window.open(`https://wa.me/905001234567?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 md:p-8">
        {/* Search Input */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
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
                Araniyor...
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

            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-600">
                <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{vehicleInfo.brand}</h3>
                  <p className="text-gray-400 text-sm">Model Yili: {vehicleInfo.year}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Marka</p>
                  <p className="text-white font-medium">{vehicleInfo.brand}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Model Yili</p>
                  <p className="text-white font-medium">{vehicleInfo.year}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-sm mb-1">Sase Numarasi</p>
                  <p className="text-white font-mono tracking-wider">{chassisNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-2">Parca Talep Edin</h4>
              <p className="text-gray-400 text-sm mb-4">
                Bu arac icin ihtiyaciniz olan parcayi WhatsApp uzerinden talep edebilirsiniz.
                Sase numaraniz otomatik olarak mesaja eklenecektir.
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
