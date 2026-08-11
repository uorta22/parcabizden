/**
 * İlan API client — satıcı ilan oluşturma.
 *
 * Backend sözleşmesi: POST {API_BASE}/?action=listing_create, multipart/form-data,
 * Authorization: Bearer <token>, X-Requested-With: XMLHttpRequest.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export type ConditionType = 'cikma' | 'sifir' | 'yenilenmis'
export type ShippingPayer = 'buyer' | 'seller' | 'negotiable'

export interface CreateListingInput {
  title: string
  part_label: string
  condition_type: ConditionType
  price?: string
  price_min?: string
  price_max?: string
  quantity?: number
  shipping_payer?: ShippingPayer
  description?: string
  manufacturer_id?: number
  model_id?: number
  vehicle_id?: number
  vehicle_label?: string
  year_from?: number
  year_to?: number
  category_slug?: string
  oem_number?: string
  images: File[]
}

export interface CreatedListing {
  id: number
  slug: string
  status: string
}

export async function createListing(input: CreateListingInput): Promise<CreatedListing> {
  const form = new FormData()
  form.set('title', input.title)
  form.set('part_label', input.part_label)
  form.set('condition_type', input.condition_type)
  if (input.price !== undefined) form.set('price', input.price)
  if (input.price_min !== undefined) form.set('price_min', input.price_min)
  if (input.price_max !== undefined) form.set('price_max', input.price_max)
  if (input.quantity !== undefined) form.set('quantity', String(input.quantity))
  if (input.shipping_payer) form.set('shipping_payer', input.shipping_payer)
  if (input.description) form.set('description', input.description)
  if (input.manufacturer_id) form.set('manufacturer_id', String(input.manufacturer_id))
  if (input.model_id) form.set('model_id', String(input.model_id))
  if (input.vehicle_id) form.set('vehicle_id', String(input.vehicle_id))
  if (input.vehicle_label) form.set('vehicle_label', input.vehicle_label)
  if (input.year_from) form.set('year_from', String(input.year_from))
  if (input.year_to) form.set('year_to', String(input.year_to))
  if (input.category_slug) form.set('category_slug', String(input.category_slug))
  if (input.oem_number) form.set('oem_number', input.oem_number)
  for (const file of input.images) form.append('images[]', file)

  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}/?action=listing_create`, {
    method: 'POST',
    headers,
    body: form,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.error) {
    throw new Error((data && data.error) || 'İlan oluşturulamadı')
  }
  return data.listing as CreatedListing
}
