import { NextRequest, NextResponse } from 'next/server'
import type { NHTSAResponse, VehicleInfo, VINDecodeAPIResponse } from '@/types/vehicle'

export async function GET(request: NextRequest) {
  const vin = request.nextUrl.searchParams.get('vin')

  if (!vin || vin.length !== 17 || /[IOQ]/i.test(vin) || !/^[A-HJ-NPR-Z0-9]+$/i.test(vin)) {
    return NextResponse.json<VINDecodeAPIResponse>(
      { success: false, error: 'Gecersiz VIN formati' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { next: { revalidate: 86400 } }
    )

    if (!response.ok) {
      throw new Error(`NHTSA API responded with ${response.status}`)
    }

    const nhtsaData: NHTSAResponse = await response.json()

    if (!nhtsaData.Results || nhtsaData.Results.length === 0) {
      return NextResponse.json<VINDecodeAPIResponse>(
        { success: false, error: 'NHTSA API sonuc dondurmedi' },
        { status: 404 }
      )
    }

    const result = nhtsaData.Results[0]

    // NHTSA ErrorCode: 0=success, 1=check digit warning (data still valid), 5=invalid VIN
    const errorCodes = (result.ErrorCode || '').split(',').map(c => c.trim())
    const isFatalError = errorCodes.includes('5')

    if (isFatalError || !result.Make) {
      return NextResponse.json<VINDecodeAPIResponse>(
        { success: false, error: 'Bu VIN numarasi icin arac bilgisi bulunamadi. Lutfen VIN numarasini kontrol edin.' },
        { status: 404 }
      )
    }

    const clean = (val: string | undefined): string => {
      if (!val || val === 'Not Applicable' || val === 'null') return ''
      return val.trim()
    }

    // NHTSA returns "OPEL", "BMW", "MERCEDES-BENZ" etc. - normalize to title case
    const formatMake = (make: string): string => {
      const upper = make.toUpperCase().trim()
      // Keep well-known abbreviations as-is
      const knownBrands: Record<string, string> = {
        'BMW': 'BMW', 'MG': 'MG', 'BYD': 'BYD', 'DS': 'DS',
        'MERCEDES-BENZ': 'Mercedes-Benz', 'LAND ROVER': 'Land Rover',
      }
      if (knownBrands[upper]) return knownBrands[upper]
      // Title case: "VOLKSWAGEN" → "Volkswagen", "OPEL" → "Opel"
      return make.charAt(0).toUpperCase() + make.slice(1).toLowerCase()
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

    return NextResponse.json<VINDecodeAPIResponse>({ success: true, data: vehicleInfo })

  } catch (error) {
    console.error('VIN decode error:', error)
    return NextResponse.json<VINDecodeAPIResponse>(
      { success: false, error: 'Arac bilgisi sorgulanirken bir hata olustu. Lutfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
