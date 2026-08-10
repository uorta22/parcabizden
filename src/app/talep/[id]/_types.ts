/**
 * Talep detayı tipleri — php-backend/requests.php (handle_request_detail) ve
 * offers.php (handle_offer_decide) sözleşmesiyle birebir eşleşir.
 */

export interface RequestItemRow {
  id: number
  request_id: number
  category_id: number | null
  part_label: string
  oem_number: string | null
  quantity: number
  note: string | null
  status: 'open' | 'fulfilled'
}

export type OfferConditionType = 'cikma' | 'sifir' | 'yenilenmis'
export type OfferShippingPayer = 'buyer' | 'seller' | 'negotiable'
export type OfferStatus = 'sent' | 'seen' | 'accepted' | 'rejected' | 'withdrawn'

export interface OfferRow {
  id: number
  request_item_id: number
  price: string
  condition_type: OfferConditionType
  warranty_days: number
  ships_in_days: number | null
  shipping_payer: OfferShippingPayer
  note: string | null
  status: OfferStatus
  created_at: string
  seller_name: string
  seller_slug: string
  median_response_minutes: number | null
  city_name: string | null
}

export interface RequestDetail {
  id: number
  contact_phone: string
  vehicle_id: number | null
  model_id: number | null
  manufacturer_id: number | null
  vehicle_label: string | null
  vin: string | null
  engine_number: string | null
  city_id: number | null
  budget_max: string | null
  status: 'open' | 'closed'
  created_at: string
  expires_at: string
  closed_at: string | null
  items: RequestItemRow[]
  offers: OfferRow[]
}
