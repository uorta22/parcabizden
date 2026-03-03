export interface ShopProduct {
  id: number | string
  name: string
  slug: string
  oem_number?: string
  brand_name?: string
  brand_logo?: string
  category: string
  price?: number
  discount_price?: number
  images: string[]
  thumbnail?: string
  specs: Record<string, string>
  description: string
  compatible_vehicles?: { brand: string; brand_slug: string; models: string[] }[]
  in_stock: boolean
  is_consumable: boolean
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export interface CartItem {
  product_id: string
  product_name: string
  product_slug: string
  product_image?: string
  quantity: number
  unit_price: number
  has_price: boolean
}
