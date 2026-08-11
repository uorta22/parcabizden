/**
 * Parça kategorileri — tek kaynak.
 *
 * Önceden kategori listesi TecDoc'tan (catalog_part_vehicles JOIN
 * catalog_categories) araç bazlı geliyordu: 7,9 GiB'lık tabloyu sırf ilan
 * formundaki bir select için ayakta tutuyorduk ve anasayfadaki kategori
 * chip'leriyle satıcının seçtiği kategori birbirini tutmuyordu.
 *
 * Pazaryeri modelinde kategori sabit ve küçük bir taksonomi: satıcı buradan
 * seçer, alıcı aynı listeden filtreler, anasayfa chip'leri aynı slug'a gider.
 * Kataloğa bağımlılık yok.
 *
 * Slug'lar veritabanına yazılıyor (listings.category_slug) — mevcut bir
 * slug'ı DEĞİŞTİRME, yayındaki ilanlar kategorisiz kalır. Yeni kategori
 * eklemek serbest.
 */

export type PartCategory = {
  slug: string
  label: string
}

export type PartCategoryGroup = {
  slug: string
  title: string
  items: PartCategory[]
}

export const PART_CATEGORY_GROUPS: PartCategoryGroup[] = [
  {
    slug: 'fren-debriyaj',
    title: 'Fren ve Debriyaj',
    items: [
      { slug: 'fren-diski', label: 'Fren Diski' },
      { slug: 'fren-balatasi', label: 'Fren Balatası' },
      { slug: 'fren-kaliperi', label: 'Fren Kaliperi' },
      { slug: 'fren-hortumu', label: 'Fren Hortumları' },
      { slug: 'debriyaj-seti', label: 'Debriyaj Seti' },
      { slug: 'debriyaj-pompasi', label: 'Debriyaj Pompası' },
    ],
  },
  {
    slug: 'motor-yakit',
    title: 'Motor ve Yakıt',
    items: [
      { slug: 'triger-kayisi', label: 'Triger Kayışı' },
      { slug: 'conta-seti', label: 'Conta Setleri' },
      { slug: 'yag-filtresi', label: 'Yağ Filtresi' },
      { slug: 'yakit-filtresi', label: 'Yakıt Filtresi' },
      { slug: 'hava-filtresi', label: 'Hava Filtresi' },
      { slug: 'buji-bobin', label: 'Buji ve Bobin' },
      { slug: 'turbo', label: 'Turbo' },
      { slug: 'enjektor', label: 'Enjektör' },
      { slug: 'motor-komple', label: 'Komple Motor' },
    ],
  },
  {
    slug: 'suspansiyon-direksiyon',
    title: 'Süspansiyon ve Direksiyon',
    items: [
      { slug: 'amortisor', label: 'Amortisör' },
      { slug: 'helezon-yay', label: 'Yay (Helezon)' },
      { slug: 'salincak', label: 'Salıncak Takımı' },
      { slug: 'rotil-rot', label: 'Rotil ve Rot' },
      { slug: 'tekerlek-yatagi', label: 'Tekerlek Yatağı' },
      { slug: 'direksiyon-mili', label: 'Direksiyon Mili' },
    ],
  },
  {
    slug: 'elektrik-aydinlatma',
    title: 'Elektrik ve Aydınlatma',
    items: [
      { slug: 'aku', label: 'Akü' },
      { slug: 'mars-motoru', label: 'Marş Motoru' },
      { slug: 'alternator', label: 'Alternatör' },
      { slug: 'far-sis', label: 'Far ve Sis' },
      { slug: 'ampul-led', label: 'Ampul ve LED' },
      { slug: 'abs-esp-sensoru', label: 'ABS / ESP Sensörleri' },
      { slug: 'beyin-modul', label: 'Beyin ve Modül' },
    ],
  },
  {
    slug: 'kaporta-trim',
    title: 'Kaporta ve Trim',
    items: [
      { slug: 'tampon-izgara', label: 'Tampon ve Izgara' },
      { slug: 'camurluk', label: 'Çamurluk' },
      { slug: 'kaput', label: 'Kaput' },
      { slug: 'kapi', label: 'Kapı' },
      { slug: 'ayna-cam', label: 'Ayna ve Cam' },
      { slug: 'silecek', label: 'Silecek Sistemi' },
    ],
  },
  {
    slug: 'sanziman-aktarma',
    title: 'Şanzıman ve Aktarma',
    items: [
      { slug: 'sanziman-komple', label: 'Komple Şanzıman' },
      { slug: 'aks-mili', label: 'Aks Mili' },
      { slug: 'diferansiyel', label: 'Diferansiyel' },
      { slug: 'sanziman-parcasi', label: 'Şanzıman Parçası' },
    ],
  },
  {
    slug: 'ic-donanim',
    title: 'İç Donanım',
    items: [
      { slug: 'koltuk', label: 'Koltuk' },
      { slug: 'torpido', label: 'Torpido' },
      { slug: 'multimedya', label: 'Multimedya ve Ekran' },
      { slug: 'klima-kalorifer', label: 'Klima ve Kalorifer' },
      { slug: 'diger', label: 'Diğer' },
    ],
  },
]

export const PART_CATEGORIES: PartCategory[] = PART_CATEGORY_GROUPS.flatMap(g => g.items)

const LABEL_BY_SLUG = new Map(PART_CATEGORIES.map(c => [c.slug, c.label]))

/** Bilinmeyen slug'da null döner — silinmiş kategorili eski ilan sayfayı kırmasın. */
export function partCategoryLabel(slug: string | null | undefined): string | null {
  if (!slug) return null
  return LABEL_BY_SLUG.get(slug) ?? null
}

export function isPartCategorySlug(slug: string): boolean {
  return LABEL_BY_SLUG.has(slug)
}
