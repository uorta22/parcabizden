// Araç parça kategorileri — tek kaynak, tüm sayfalar buradan okur
export const VEHICLE_CATEGORIES: { id: string; name_tr: string }[] = [
  { id: 'engine', name_tr: 'Motor' },
  { id: 'turbo_intake', name_tr: 'Turbo & Emme' },
  { id: 'fuel', name_tr: 'Yakıt Sistemi' },
  { id: 'exhaust', name_tr: 'Egzoz' },
  { id: 'transmission', name_tr: 'Şanzıman' },
  { id: 'brake', name_tr: 'Fren' },
  { id: 'suspension', name_tr: 'Süspansiyon' },
  { id: 'wheel_tyre', name_tr: 'Jant & Lastik' },
  { id: 'body_exterior', name_tr: 'Kaporta & Dış' },
  { id: 'glass_mirror', name_tr: 'Cam & Ayna' },
  { id: 'lighting', name_tr: 'Aydınlatma' },
  { id: 'electrical', name_tr: 'Elektrik' },
  { id: 'climate', name_tr: 'Klima & Isıtma' },
  { id: 'interior', name_tr: 'İç Aksam' },
  { id: 'audio_media', name_tr: 'Ses & Medya' },
  { id: 'tow_transport', name_tr: 'Çeki & Taşıma' },
  { id: 'other', name_tr: 'Diğer' },
]

// ID → Türkçe isim lookup
export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  VEHICLE_CATEGORIES.map(c => [c.id, c.name_tr])
)
