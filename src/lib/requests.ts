/**
 * Talep API client — üyeliksiz/üyeli alıcı parça talebi oluşturma.
 *
 * Backend sözleşmesi: POST {API_BASE}/?action=request_create,
 * application/x-www-form-urlencoded, X-Requested-With: XMLHttpRequest.
 * Giriş varsa Authorization: Bearer <token> eklenir (opsiyonel).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface RequestItemInput {
  part_label: string
  quantity?: number
  oem_number?: string
  category_id?: number
  note?: string
}

export interface CreateRequestInput {
  contact_phone: string
  city_id?: number
  manufacturer_id?: number
  model_id?: number
  vehicle_id?: number
  vehicle_label?: string
  vin?: string
  engine_number?: string
  budget_max?: string
  items: RequestItemInput[]
}

export interface CreatedRequest {
  id: number
  access_token: string
  dispatched_to: number
}

export async function createRequest(input: CreateRequestInput): Promise<CreatedRequest> {
  const params = new URLSearchParams()
  params.set('contact_phone', input.contact_phone)
  if (input.city_id) params.set('city_id', String(input.city_id))
  if (input.manufacturer_id) params.set('manufacturer_id', String(input.manufacturer_id))
  if (input.model_id) params.set('model_id', String(input.model_id))
  if (input.vehicle_id) params.set('vehicle_id', String(input.vehicle_id))
  if (input.vehicle_label) params.set('vehicle_label', input.vehicle_label)
  if (input.vin) params.set('vin', input.vin)
  if (input.engine_number) params.set('engine_number', input.engine_number)
  if (input.budget_max) params.set('budget_max', input.budget_max)

  input.items.forEach((item, idx) => {
    params.set(`items[${idx}][part_label]`, item.part_label)
    if (item.quantity !== undefined) params.set(`items[${idx}][quantity]`, String(item.quantity))
    if (item.oem_number) params.set(`items[${idx}][oem_number]`, item.oem_number)
    if (item.category_id) params.set(`items[${idx}][category_id]`, String(item.category_id))
    if (item.note) params.set(`items[${idx}][note]`, item.note)
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}/?action=request_create`, {
    method: 'POST',
    headers,
    body: params.toString(),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.error) {
    throw new Error((data && data.error) || 'Talep gönderilemedi')
  }
  return data.request as CreatedRequest
}
