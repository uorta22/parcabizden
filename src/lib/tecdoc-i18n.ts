// ═══ TecDoc attribute sözlüğü ═══
//
// Katalog verisi 7zap kaynaklı olduğu için attribute başlıkları İngilizce,
// değerlerin bir kısmı Rusça geliyor. Kalıcı çözüm veriyi kaynağında
// düzeltmek; buradaki sözlük görüntüleme katmanındaki geçici karşılıktır.
//
// Sözlükte olmayan her şey olduğu gibi gösterilir — eksik çeviri veriyi
// gizlemez, sadece çevrilmemiş bırakır.

/** Attribute grup adları. */
const GROUPS: Record<string, string> = {
  body: 'Kasa',
  engine: 'Motor',
  general: 'Genel',
  keynumber: 'Anahtar Numarası',
  technicaldata: 'Teknik Veriler',
}

/** Attribute başlıkları. */
const TITLES: Record<string, string> = {
  'body type': 'Kasa tipi',
  'bore': 'Silindir çapı',
  'capacity': 'Motor hacmi',
  'capacity (tax)': 'Motor hacmi (vergi)',
  'capacity (technic)': 'Motor hacmi (teknik)',
  'compression': 'Sıkıştırma oranı',
  'construction interval': 'Üretim aralığı',
  'cooling type': 'Soğutma tipi',
  'cylinder construction': 'Silindir yapısı',
  'drive type': 'Çekiş tipi',
  'engine code': 'Motor kodu',
  'engine construction': 'Motor yapısı',
  'engine management': 'Motor kumandası',
  'engine type': 'Motor tipi',
  'fuel mixture': 'Yakıt karışımı',
  'fuel type': 'Yakıt tipi',
  'kba-number': 'KBA numarası',
  'number of cylinders': 'Silindir sayısı',
  'number of main bearings': 'Ana yatak sayısı',
  'number of valves': 'Supap sayısı',
  'power': 'Güç',
  'stroke': 'Strok',
  'torque': 'Tork',
  'transmission type': 'Şanzıman tipi',
}

/** Rusça/İngilizce attribute değerleri. */
const VALUES: Record<string, string> = {
  // Yakıt / motor tipi
  'бензин': 'Benzin',
  'дизель': 'Dizel',
  'бензиновый двигатель': 'Benzinli motor',
  'дизельный двигатель': 'Dizel motor',
  'электро': 'Elektrik',
  'гибрид': 'Hibrit',
  // Kasa tipi
  'седан': 'Sedan',
  'хэтчбек': 'Hatchback',
  'универсал': 'Station Wagon',
  'купе': 'Coupé',
  'кабриолет': 'Cabrio',
  'внедорожник': 'SUV / Arazi',
  'фургон': 'Panelvan',
  'пикап': 'Pickup',
  // Çekiş
  'привод на передние колеса': 'Önden çekiş',
  'привод на задние колеса': 'Arkadan itiş',
  'полный привод': 'Dört çeker',
  // Soğutma
  'с водяным охлаждением': 'Su soğutmalı',
  'с воздушным охлаждением': 'Hava soğutmalı',
  // Motor kumandası
  'цепь': 'Zincir',
  'ремень': 'Kayış',
  // Yakıt karışımı / besleme
  'непосредственный впрыск': 'Direkt enjeksiyon',
  'впрыскивание во впускной коллектор/карбюратор': 'Emme manifoldu enjeksiyonu / Karbüratör',
  'распределенный впрыск': 'Çok noktalı enjeksiyon',
}

function lookup(map: Record<string, string>, raw: string | null): string {
  if (!raw) return ''
  const key = raw.trim().toLowerCase()
  return map[key] ?? raw
}

/** Attribute grup adını Türkçeleştirir; bilinmiyorsa olduğu gibi döner. */
export function trGroup(group: string | null): string {
  return lookup(GROUPS, group)
}

/** Attribute başlığını Türkçeleştirir; bilinmiyorsa olduğu gibi döner. */
export function trTitle(title: string | null): string {
  return lookup(TITLES, title)
}

/** Attribute değerini Türkçeleştirir; bilinmiyorsa olduğu gibi döner. */
export function trValue(value: string | null): string {
  return lookup(VALUES, value)
}
