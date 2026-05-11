// AUTO-GENERATED from Supabase MCP — `generate_typescript_types`.
// Tekrar üretmek: Supabase MCP üzerinden `generate_typescript_types` ya da
//   npx supabase gen types typescript --project-id elbsbbjlvkjkizpaimlk

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          district: string
          full_name: string
          id: number
          is_default: boolean
          phone: string
          postal_code: string | null
          title: string
          user_id: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at'>> & {
          address_line1: string
          city: string
          district: string
          full_name: string
          phone: string
          title: string
          user_id: string
        }
        Update: Partial<Database['public']['Tables']['addresses']['Row']>
      }
      chat_messages: {
        Row: { id: number; user_id: string | null; session_id: string; role: string; body: string; created_at: string }
        Insert: { session_id: string; role: string; body: string; user_id?: string | null; created_at?: string; id?: number }
        Update: Partial<Database['public']['Tables']['chat_messages']['Row']>
      }
      favorites: {
        Row: { id: number; user_id: string; product_oem: string; created_at: string }
        Insert: { user_id: string; product_oem: string; created_at?: string; id?: number }
        Update: Partial<Database['public']['Tables']['favorites']['Row']>
      }
      garage: {
        Row: {
          id: number; user_id: string
          manufacturer_id: number | null; model_id: number | null; vehicle_id_ktype: number | null
          brand_name: string | null; model_name: string | null; generation_name: string | null
          year: number | null; nickname: string | null; plaka: string | null; sase_no: string | null
          current_km: number | null; km_updated_at: string | null; notes: string | null
          created_at: string
        }
        Insert: { user_id: string } & Partial<Omit<Database['public']['Tables']['garage']['Row'], 'id' | 'user_id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['garage']['Row']>
      }
      vehicle_maintenance: {
        Row: {
          id: number; garage_id: number; user_id: string
          maintenance_type: string
          last_km: number | null; last_date: string | null
          next_km: number | null; next_date: string | null
          notes: string | null; created_at: string
        }
        Insert: { garage_id: number; user_id: string; maintenance_type: string } & Partial<Omit<Database['public']['Tables']['vehicle_maintenance']['Row'], 'id' | 'garage_id' | 'user_id' | 'maintenance_type' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['vehicle_maintenance']['Row']>
      }
      orders: {
        Row: {
          id: number; user_id: string; order_no: string
          status: Database['public']['Enums']['order_status']
          total_price: number; address_id: number | null; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: { user_id: string; order_no: string } & Partial<Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'user_id' | 'order_no' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
      order_items: {
        Row: {
          id: number; order_id: number
          product_oem: string | null; product_name: string; supplier_name: string | null
          quantity: number; unit_price: number | null; has_price: boolean
        }
        Insert: { order_id: number; product_name: string } & Partial<Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'order_id' | 'product_name'>>
        Update: Partial<Database['public']['Tables']['order_items']['Row']>
      }
      profiles: {
        Row: {
          id: string; email: string; name: string | null; phone: string | null; gsm: string | null
          tc_no: string | null; is_admin: boolean; created_at: string; updated_at: string
        }
        Insert: { id: string; email: string } & Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'email'>>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      reviews: {
        Row: {
          id: number; user_id: string; product_oem: string; rating: number
          title: string | null; body: string | null; is_approved: boolean; created_at: string
        }
        Insert: { user_id: string; product_oem: string; rating: number } & Partial<Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'user_id' | 'product_oem' | 'rating' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
      }
    }
    Enums: {
      order_status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
    }
  }
}
