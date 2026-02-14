import type { VehicleInfo, NHTSAResponse } from '@/types/vehicle'

export function clean(val: string | undefined): string {
  if (!val || val === 'Not Applicable' || val === 'null') return ''
  return val.trim()
}

export function formatMake(make: string): string {
  const upper = make.toUpperCase().trim()
  const knownBrands: Record<string, string> = {
    'BMW': 'BMW', 'MG': 'MG', 'BYD': 'BYD', 'DS': 'DS',
    'MERCEDES-BENZ': 'Mercedes-Benz', 'LAND ROVER': 'Land Rover',
  }
  if (knownBrands[upper]) return knownBrands[upper]
  return make.charAt(0).toUpperCase() + make.slice(1).toLowerCase()
}

export function translateFuelType(fuel: string): string {
  const map: Record<string, string> = {
    'gasoline': 'Benzin',
    'diesel': 'Dizel',
    'electric': 'Elektrik',
    'hybrid': 'Hibrit',
    'plug-in hybrid': 'Plug-in Hibrit',
    'compressed natural gas (cng)': 'Doğalgaz (CNG)',
    'liquefied petroleum gas (lpg)': 'LPG',
  }
  return map[fuel.toLowerCase()] || fuel
}

export function translateTransmission(trans: string): string {
  if (!trans) return ''
  if (trans.toLowerCase().includes('automatic')) return 'Otomatik'
  if (trans.toLowerCase().includes('manual')) return 'Manuel'
  if (trans.toLowerCase().includes('cvt')) return 'CVT'
  return trans
}

export function formatEngine(info: VehicleInfo): string {
  const parts: string[] = []
  if (info.displacementL) parts.push(`${info.displacementL}L`)
  if (info.engineCylinders) parts.push(`${info.engineCylinders} Silindir`)
  return parts.join(' ')
}

export function validateVIN(vin: string): boolean {
  return vin.length === 17 && !/[IOQ]/i.test(vin) && /^[A-HJ-NPR-Z0-9]+$/i.test(vin)
}

export async function decodeVIN(vin: string): Promise<{ data?: VehicleInfo; error?: string }> {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
    )

    if (!response.ok) {
      return { error: 'NHTSA API ile bağlantı kurulamadı. Lütfen tekrar deneyin.' }
    }

    const nhtsaData: NHTSAResponse = await response.json()

    if (!nhtsaData.Results || nhtsaData.Results.length === 0) {
      return { error: 'NHTSA API sonuç döndürmedi.' }
    }

    const result = nhtsaData.Results[0]
    const errorCodes = (result.ErrorCode || '').split(',').map(c => c.trim())
    const isFatalError = errorCodes.includes('5')

    if (isFatalError || !result.Make) {
      return { error: 'Bu VIN numarası için araç bilgisi bulunamadı. Lütfen VIN numarasını kontrol edin.' }
    }

    return {
      data: {
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
    }
  } catch {
    return { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}
