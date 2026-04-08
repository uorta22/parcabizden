import type { VehicleInfo, NHTSAResponse } from '@/types/vehicle'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

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

export function parseModelYear(name: string): number {
  const match = name.match(/\((?:\d{2}\.)?(\d{4})->/)
  return match ? parseInt(match[1], 10) : 0
}

export function cleanModelName(name: string): string {
  return name.replace(/\((?:\d{2}\.)?\d{4}->\)\s*$/, '').trim()
}

export function validateVIN(vin: string): boolean {
  return vin.length === 17 && !/[IOQ]/i.test(vin) && /^[A-HJ-NPR-Z0-9]+$/i.test(vin)
}

// WMI → pozisyon 4 karakter → model adı (PHP deploy olmasa bile frontend'de çalışır)
const WMI_MODEL_CODES: Record<string, Record<string, string>> = {
  'W0L': { P:'Astra', T:'Astra', C:'Corsa', D:'Corsa', E:'Corsa', Z:'Zafira', X:'Insignia', M:'Meriva', B:'Mokka', A:'Agila', F:'Frontera', V:'Vivaro', '0':'Combo' },
  'W0V': { P:'Astra', C:'Corsa', Z:'Zafira', X:'Insignia' },
  'WBA': { F:'5 Series', G:'5 Series', H:'1 Series', K:'3 Series', E:'3 Series', N:'3 Series', W:'7 Series', D:'3 Series', T:'2 Series', S:'6 Series', U:'X3', Y:'X5' },
  'WBS': { F:'M5', K:'M3', G:'M5', B:'M2', D:'M4' },
  'WBY': { '1':'i3', '2':'i3', '3':'i4', '4':'i4', '8':'iX' },
  'WVW': { F:'Golf', Z:'Passat', G:'Golf', H:'Polo', B:'Golf', A:'Golf', Y:'Passat', E:'Bora', K:'Touareg', N:'Tiguan', C:'Caddy' },
  'WDB': { C:'C-Class', E:'E-Class', S:'S-Class', G:'G-Class', V:'V-Class', A:'A-Class', B:'B-Class' },
  'WDD': { C:'C-Class', E:'E-Class', S:'S-Class', G:'G-Class', A:'A-Class', B:'B-Class', N:'GLA', X:'GLE' },
  'W1K': { C:'C-Class', E:'E-Class', A:'A-Class', B:'B-Class' },
  'WAU': { A:'A4', B:'A3', C:'A6', H:'A8', F:'A5', G:'A7', K:'Q5', N:'Q3', T:'TT', V:'Q7', Z:'Q2' },
  'WUA': { Z:'R8', T:'TT', B:'A3', S:'S3' },
  'TMB': { A:'Octavia', B:'Fabia', C:'Superb', H:'Kodiaq', E:'Rapid', F:'Scala', G:'Kamiq' },
  'VSS': { Z:'Ibiza', B:'Leon', C:'Toledo', D:'Arona', E:'Ateca' },
  'VF1': { B:'Clio', C:'Megane', D:'Laguna', E:'Espace', K:'Kadjar', H:'Captur', S:'Scenic', T:'Talisman' },
  'VF3': { A:'206', B:'207', C:'208', D:'307', E:'308', F:'407', H:'3008', K:'2008', L:'508' },
  'VF7': { A:'Xsara', B:'C3', C:'C4', D:'C5', H:'C3 Aircross', K:'C5 Aircross' },
  'ZFA': { A:'Punto', B:'Bravo', C:'500', E:'Tipo', K:'Stilo' },
  'JTD': { B:'Camry', E:'Corolla', F:'Hilux', G:'Land Cruiser', H:'Yaris', K:'RAV4', N:'C-HR' },
  'JHM': { B:'Civic', C:'Accord', E:'CR-V', F:'Jazz', G:'HR-V' },
  'KMH': { C:'i20', D:'i30', E:'Elantra', F:'Sonata', G:'Tucson', J:'Santa Fe', N:'IONIQ' },
  'KNA': { C:'Ceed', D:'Sportage', F:'Sorento', G:'Stonic', H:'Niro' },
  'JN1': { A:'Micra', B:'Note', C:'Juke', E:'Qashqai', F:'X-Trail', H:'Almera' },
  'SAL': { D:'Discovery', H:'Range Rover', J:'Freelander', L:'Defender', N:'Range Rover Sport' },
  'YV1': { B:'S40', C:'V40', D:'S60', F:'V60', H:'V70', J:'S80', K:'XC60', L:'XC90' },
  'UU1': { S:'Sandero', L:'Logan', H:'Duster', K:'Duster' },
  'WF0': { N:'Focus', G:'Fiesta', F:'Focus', T:'Transit', R:'Mondeo', Y:'Ka' },
}

export function guessModelFromVIN(vin: string): string {
  const wmi = vin.slice(0, 3).toUpperCase()
  const pos4 = vin[3]?.toUpperCase() ?? ''
  return WMI_MODEL_CODES[wmi]?.[pos4] ?? ''
}

export async function decodeVIN(vin: string): Promise<{ data?: VehicleInfo; error?: string }> {
  try {
    // 1. Önce kendi PHP API'mizi çağır (NHTSA + WMI + VIN Pattern Matching)
    const apiRes = await fetch(`${API_BASE}/?action=vin_decode&vin=${vin}`)

    if (apiRes.ok) {
      const apiData = await apiRes.json()

      if (apiData.error) {
        return { error: apiData.error }
      }

      // API'den gelen NHTSA verisi varsa kullan
      const nhtsa = apiData.nhtsa
      const make = apiData.make || ''
      const model = apiData.model || ''
      const year = apiData.year ? String(apiData.year) : ''

      // Generation eşleşmesi varsa, model adını generation'dan al
      let resolvedModel = model
      if (!resolvedModel && apiData.generations && apiData.generations.length > 0) {
        resolvedModel = apiData.generations[0].generation_name || ''
      }
      // Hala boşsa VIN'den pos4 tablosuyla türet (PHP deploy bağımsız fallback)
      if (!resolvedModel) {
        resolvedModel = guessModelFromVIN(vin)
      }

      const vehicleInfo: VehicleInfo = {
        make: formatMake(make),
        model: resolvedModel,
        year: year,
        series: '',
        bodyType: nhtsa?.body || '',
        engineCylinders: '',
        engineHP: '',
        displacementL: '',
        fuelType: nhtsa?.fuel || '',
        transmissionType: '',
        driveType: nhtsa?.drive || '',
        plantCountry: nhtsa?.plant_country || '',
        doors: '',
        vin: vin.toUpperCase(),
        brandSlug: apiData.brand_slug,
        generations: apiData.generations || [],
        platformCode: apiData.platform_code || null,
        matched: apiData.matched || false,
      }

      // Motor bilgisini parse et
      if (nhtsa?.engine) {
        const engineMatch = nhtsa.engine.match(/^([\d.]+)L\s*(\d+)\s*cyl$/)
        if (engineMatch) {
          vehicleInfo.displacementL = engineMatch[1]
          vehicleInfo.engineCylinders = engineMatch[2]
        }
      }

      // Eğer araç bulundu ama model yoksa ve generation da yoksa
      if (!vehicleInfo.model && (!apiData.generations || apiData.generations.length === 0)) {
        return { data: vehicleInfo }
      }

      return { data: vehicleInfo }
    }

    // 2. PHP API başarısız olursa, doğrudan NHTSA'ya sor (fallback)
    return await decodeVINFromNHTSA(vin)

  } catch {
    // 3. Her şey başarısız olursa NHTSA fallback
    return await decodeVINFromNHTSA(vin)
  }
}

// NHTSA doğrudan çağrı (fallback)
async function decodeVINFromNHTSA(vin: string): Promise<{ data?: VehicleInfo; error?: string }> {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
    )

    if (!response.ok) {
      return { error: 'API ile bağlantı kurulamadı. Lütfen tekrar deneyin.' }
    }

    const nhtsaData: NHTSAResponse = await response.json()

    if (!nhtsaData.Results || nhtsaData.Results.length === 0) {
      return { error: 'API sonuç döndürmedi.' }
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
