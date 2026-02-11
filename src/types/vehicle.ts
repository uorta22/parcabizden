export interface VehicleInfo {
  make: string
  model: string
  year: string
  series: string
  bodyType: string
  engineCylinders: string
  engineHP: string
  displacementL: string
  fuelType: string
  transmissionType: string
  driveType: string
  plantCountry: string
  doors: string
  vin: string
}

export interface NHTSAResult {
  Make: string
  Model: string
  ModelYear: string
  Series: string
  BodyClass: string
  EngineCylinders: string
  EngineHP: string
  DisplacementL: string
  FuelTypePrimary: string
  TransmissionStyle: string
  DriveType: string
  PlantCountry: string
  Doors: string
  ErrorCode: string
  ErrorText: string
  [key: string]: string
}

export interface NHTSAResponse {
  Count: number
  Message: string
  SearchCriteria: string
  Results: NHTSAResult[]
}

export interface VINDecodeAPIResponse {
  success: boolean
  data?: VehicleInfo
  error?: string
}
