export interface MaintenanceType {
  key: string
  label: string
  defaultIntervalKm: number
  defaultIntervalMonths: number
}

export const MAINTENANCE_TYPES: MaintenanceType[] = [
  { key: 'yag-degisimi', label: 'Yag Degisimi', defaultIntervalKm: 10000, defaultIntervalMonths: 12 },
  { key: 'fren-balatalari', label: 'Fren Balatalari', defaultIntervalKm: 30000, defaultIntervalMonths: 24 },
  { key: 'hava-filtresi', label: 'Hava Filtresi', defaultIntervalKm: 20000, defaultIntervalMonths: 12 },
  { key: 'yag-filtresi', label: 'Yag Filtresi', defaultIntervalKm: 10000, defaultIntervalMonths: 12 },
  { key: 'polen-filtresi', label: 'Polen Filtresi', defaultIntervalKm: 15000, defaultIntervalMonths: 12 },
  { key: 'yakit-filtresi', label: 'Yakit Filtresi', defaultIntervalKm: 40000, defaultIntervalMonths: 24 },
  { key: 'buji-degisimi', label: 'Buji Degisimi', defaultIntervalKm: 30000, defaultIntervalMonths: 36 },
  { key: 'lastik-rotasyonu', label: 'Lastik Rotasyonu', defaultIntervalKm: 10000, defaultIntervalMonths: 6 },
  { key: 'antifriz', label: 'Antifriz', defaultIntervalKm: 40000, defaultIntervalMonths: 24 },
  { key: 'triger-kayisi', label: 'Triger Kayisi', defaultIntervalKm: 60000, defaultIntervalMonths: 48 },
]

export type MaintenanceStatus = 'ok' | 'upcoming' | 'overdue'

export function getMaintenanceStatus(
  currentKm: number | null,
  nextKm: number | null,
  nextDate: string | null
): MaintenanceStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check overdue
  if (nextKm !== null && currentKm !== null && nextKm <= currentKm) return 'overdue'
  if (nextDate) {
    const nd = new Date(nextDate)
    nd.setHours(0, 0, 0, 0)
    if (nd <= today) return 'overdue'
  }

  // Check upcoming
  if (nextKm !== null && currentKm !== null && nextKm - currentKm <= 1000) return 'upcoming'
  if (nextDate) {
    const nd = new Date(nextDate)
    nd.setHours(0, 0, 0, 0)
    const thirtyDays = new Date(today)
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    if (nd <= thirtyDays) return 'upcoming'
  }

  return 'ok'
}

export function getStatusColor(status: MaintenanceStatus): string {
  switch (status) {
    case 'overdue': return 'bg-red-100 text-red-700'
    case 'upcoming': return 'bg-orange-100 text-orange-700'
    case 'ok': return 'bg-green-100 text-green-700'
  }
}

export function getStatusLabel(status: MaintenanceStatus): string {
  switch (status) {
    case 'overdue': return 'Gecikmi\u015f'
    case 'upcoming': return 'Yakla\u015f\u0131yor'
    case 'ok': return 'Normal'
  }
}

export function getMaintenanceTypeByKey(key: string): MaintenanceType | undefined {
  return MAINTENANCE_TYPES.find(t => t.key === key)
}

export function getMaintenanceLabel(key: string): string {
  return getMaintenanceTypeByKey(key)?.label ?? key
}

export function addMonths(date: Date, months: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}
