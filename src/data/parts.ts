export interface Part {
  id: string
  name: string
  category: string
  categoryName: string
  description: string
  brands: string[]
  image?: string
}

export interface Category {
  id: string
  name: string
  description: string
  icon: string
  partCount: number
}

export const categories: Category[] = [
  {
    id: 'motor',
    name: 'Motor Parcalari',
    description: 'Motor blogu, silindir kapagi, piston, supap, krank mili ve tum motor ic parcalari',
    icon: 'Settings',
    partCount: 45
  },
  {
    id: 'sanziman',
    name: 'Sanziman Parcalari',
    description: 'Manuel ve otomatik sanziman, diferansiyel, sanziman ic parcalari, kavrama seti',
    icon: 'Settings',
    partCount: 32
  },
  {
    id: 'suspansiyon',
    name: 'Suspansiyon Parcalari',
    description: 'Amortisor, rotil, rot kolu, salincak, bilyali yastak, viraj demiri',
    icon: 'Car',
    partCount: 38
  },
  {
    id: 'fren',
    name: 'Fren Sistemi',
    description: 'Fren diski, fren balatasi, fren kaliperi, ABS sensoru, fren hortumu',
    icon: 'Disc',
    partCount: 28
  },
  {
    id: 'kaporta',
    name: 'Kaporta Parcalari',
    description: 'Kaput, bagaj, camurluk, kapi, tampon, panjur, ayna',
    icon: 'Car',
    partCount: 52
  },
  {
    id: 'aydinlatma',
    name: 'Aydinlatma',
    description: 'Far, stop lambasi, sinyal, sis fari, xenon, LED aydinlatma',
    icon: 'Lightbulb',
    partCount: 35
  },
  {
    id: 'elektrik',
    name: 'Elektrik Aksam',
    description: 'Alternator, mars motoru, aku, sigorta kutusu, kablo tesisati',
    icon: 'Battery',
    partCount: 25
  },
  {
    id: 'sogutma',
    name: 'Sogutma Sistemi',
    description: 'Radyator, su pompasi, termostat, radyator hortumu, fan motoru',
    icon: 'Thermometer',
    partCount: 18
  },
  {
    id: 'egzoz',
    name: 'Egzoz Sistemi',
    description: 'Egzoz manifoldu, katalitik konvertor, egzoz borusu, susturucu',
    icon: 'Wind',
    partCount: 15
  },
  {
    id: 'direksiyon',
    name: 'Direksiyon Sistemi',
    description: 'Direksiyon kutusu, direksiyon pompasi, rot, rotil, kremayer',
    icon: 'Wrench',
    partCount: 22
  },
  {
    id: 'ic-aksesuar',
    name: 'Ic Aksesuar',
    description: 'Gosterge paneli, koltuk, konsol, kalorifer, klima unitesi',
    icon: 'Layout',
    partCount: 30
  },
  {
    id: 'cam',
    name: 'Cam ve Ayna',
    description: 'On cam, arka cam, yan cam, dikiz aynasi, yan ayna',
    icon: 'Square',
    partCount: 20
  }
]

export const parts: Part[] = [
  // Motor Parcalari
  { id: 'motor-blogu', name: 'Motor Blogu', category: 'motor', categoryName: 'Motor Parcalari', description: 'Komple motor blogu, silindir blogu', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Renault', 'Fiat', 'Toyota', 'Hyundai', 'Kia'] },
  { id: 'silindir-kapagi', name: 'Silindir Kapagi', category: 'motor', categoryName: 'Motor Parcalari', description: 'Silindir kapagi, supap kapagi', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Opel', 'Peugeot'] },
  { id: 'krank-mili', name: 'Krank Mili', category: 'motor', categoryName: 'Motor Parcalari', description: 'Krank saft, krank mili', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'] },
  { id: 'piston', name: 'Piston', category: 'motor', categoryName: 'Motor Parcalari', description: 'Piston ve segman seti', brands: ['Tum Markalar'] },
  { id: 'supap', name: 'Supap', category: 'motor', categoryName: 'Motor Parcalari', description: 'Emme ve egzoz supabi', brands: ['Tum Markalar'] },
  { id: 'eksantrik-mili', name: 'Eksantrik Mili', category: 'motor', categoryName: 'Motor Parcalari', description: 'Kam mili, eksantrik saft', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota'] },
  { id: 'yagli-karter', name: 'Yagli Karter', category: 'motor', categoryName: 'Motor Parcalari', description: 'Motor karti, yag karteri', brands: ['Tum Markalar'] },
  { id: 'motor-kulagi', name: 'Motor Kulagi', category: 'motor', categoryName: 'Motor Parcalari', description: 'Motor baglanti kulagi, motor takozu', brands: ['Tum Markalar'] },
  { id: 'yag-pompasi', name: 'Yag Pompasi', category: 'motor', categoryName: 'Motor Parcalari', description: 'Motor yag pompasi', brands: ['Tum Markalar'] },
  { id: 'triger-seti', name: 'Triger Seti', category: 'motor', categoryName: 'Motor Parcalari', description: 'Triger kayisi, triger kasnak, gergi rulman', brands: ['Tum Markalar'] },

  // Sanziman Parcalari
  { id: 'sanziman-komple', name: 'Sanziman Komple', category: 'sanziman', categoryName: 'Sanziman Parcalari', description: 'Manuel veya otomatik sanziman', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford'] },
  { id: 'kavrama-seti', name: 'Kavrama Seti', category: 'sanziman', categoryName: 'Sanziman Parcalari', description: 'Debriyaj baski, balata, rulman', brands: ['Tum Markalar'] },
  { id: 'sanziman-dislisi', name: 'Sanziman Dislisi', category: 'sanziman', categoryName: 'Sanziman Parcalari', description: 'Vites dislileri, senkromec', brands: ['Volkswagen', 'BMW', 'Mercedes'] },
  { id: 'diferansiyel', name: 'Diferansiyel', category: 'sanziman', categoryName: 'Sanziman Parcalari', description: 'On ve arka diferansiyel', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'] },
  { id: 'aks', name: 'Aks', category: 'sanziman', categoryName: 'Sanziman Parcalari', description: 'On ve arka aks, aks kafasi', brands: ['Tum Markalar'] },

  // Suspansiyon Parcalari
  { id: 'on-amortisor', name: 'On Amortisor', category: 'suspansiyon', categoryName: 'Suspansiyon Parcalari', description: 'On amortisor, amortisör', brands: ['Tum Markalar'] },
  { id: 'arka-amortisor', name: 'Arka Amortisor', category: 'suspansiyon', categoryName: 'Suspansiyon Parcalari', description: 'Arka amortisor', brands: ['Tum Markalar'] },
  { id: 'rotil', name: 'Rotil', category: 'suspansiyon', categoryName: 'Suspansiyon Parcalari', description: 'Rot basi, rotil', brands: ['Tum Markalar'] },
  { id: 'rot-kolu', name: 'Rot Kolu', category: 'suspansiyon', categoryName: 'Suspansiyon Parcalari', description: 'Rot kolu, rot', brands: ['Tum Markalar'] },
  { id: 'salincak', name: 'Salincak', category: 'suspansiyon', categoryName: 'Suspansiyon Parcalari', description: 'On ve arka salincak', brands: ['Tum Markalar'] },
  { id: 'viraj-demiri', name: 'Viraj Demiri', category: 'suspansiyon', categoryName: 'Suspansiyon Parcalari', description: 'Viraj cubugu, stabilizer', brands: ['Tum Markalar'] },
  { id: 'teker-poryasi', name: 'Teker Poryasi', category: 'suspansiyon', categoryName: 'Suspansiyon Parcalari', description: 'Porya, teker yatagi', brands: ['Tum Markalar'] },

  // Fren Sistemi
  { id: 'on-fren-diski', name: 'On Fren Diski', category: 'fren', categoryName: 'Fren Sistemi', description: 'On fren diski', brands: ['Tum Markalar'] },
  { id: 'arka-fren-diski', name: 'Arka Fren Diski', category: 'fren', categoryName: 'Fren Sistemi', description: 'Arka fren diski', brands: ['Tum Markalar'] },
  { id: 'fren-balatasi', name: 'Fren Balatasi', category: 'fren', categoryName: 'Fren Sistemi', description: 'On ve arka fren balatasi', brands: ['Tum Markalar'] },
  { id: 'fren-kaliperi', name: 'Fren Kaliperi', category: 'fren', categoryName: 'Fren Sistemi', description: 'Fren kaliperi, etrier', brands: ['Tum Markalar'] },
  { id: 'abs-beyni', name: 'ABS Beyni', category: 'fren', categoryName: 'Fren Sistemi', description: 'ABS kontrol unitesi', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi'] },
  { id: 'abs-sensoru', name: 'ABS Sensoru', category: 'fren', categoryName: 'Fren Sistemi', description: 'ABS hiz sensoru', brands: ['Tum Markalar'] },

  // Kaporta Parcalari
  { id: 'on-kaput', name: 'On Kaput', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Motor kaputu', brands: ['Tum Markalar'] },
  { id: 'bagaj-kapagi', name: 'Bagaj Kapagi', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Bagaj kapagi', brands: ['Tum Markalar'] },
  { id: 'on-camurluk', name: 'On Camurluk', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Sag ve sol on camurluk', brands: ['Tum Markalar'] },
  { id: 'arka-camurluk', name: 'Arka Camurluk', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Sag ve sol arka camurluk', brands: ['Tum Markalar'] },
  { id: 'on-kapi', name: 'On Kapi', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Sag ve sol on kapi', brands: ['Tum Markalar'] },
  { id: 'arka-kapi', name: 'Arka Kapi', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Sag ve sol arka kapi', brands: ['Tum Markalar'] },
  { id: 'on-tampon', name: 'On Tampon', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'On tampon', brands: ['Tum Markalar'] },
  { id: 'arka-tampon', name: 'Arka Tampon', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Arka tampon', brands: ['Tum Markalar'] },
  { id: 'panjur', name: 'Panjur', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'On panjur, izgara', brands: ['Tum Markalar'] },
  { id: 'dis-ayna', name: 'Dis Ayna', category: 'kaporta', categoryName: 'Kaporta Parcalari', description: 'Sag ve sol yan ayna', brands: ['Tum Markalar'] },

  // Aydinlatma
  { id: 'on-far', name: 'On Far', category: 'aydinlatma', categoryName: 'Aydinlatma', description: 'Sag ve sol on far takimi', brands: ['Tum Markalar'] },
  { id: 'arka-stop', name: 'Arka Stop', category: 'aydinlatma', categoryName: 'Aydinlatma', description: 'Sag ve sol arka stop lambasi', brands: ['Tum Markalar'] },
  { id: 'sis-fari', name: 'Sis Fari', category: 'aydinlatma', categoryName: 'Aydinlatma', description: 'On sis fari', brands: ['Tum Markalar'] },
  { id: 'sinyal-lambasi', name: 'Sinyal Lambasi', category: 'aydinlatma', categoryName: 'Aydinlatma', description: 'Sinyal lambasi, flas', brands: ['Tum Markalar'] },
  { id: 'xenon-beyni', name: 'Xenon Beyni', category: 'aydinlatma', categoryName: 'Aydinlatma', description: 'Xenon balast, xenon beyni', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'] },

  // Elektrik Aksam
  { id: 'alternator', name: 'Alternator', category: 'elektrik', categoryName: 'Elektrik Aksam', description: 'Sarj dinamosu', brands: ['Tum Markalar'] },
  { id: 'mars-motoru', name: 'Mars Motoru', category: 'elektrik', categoryName: 'Elektrik Aksam', description: 'Marş motoru, starter', brands: ['Tum Markalar'] },
  { id: 'beyin', name: 'Motor Beyni', category: 'elektrik', categoryName: 'Elektrik Aksam', description: 'ECU, motor kontrol unitesi', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford'] },
  { id: 'sigorta-kutusu', name: 'Sigorta Kutusu', category: 'elektrik', categoryName: 'Elektrik Aksam', description: 'Sigorta kutusu, rele kutusu', brands: ['Tum Markalar'] },
  { id: 'kablo-tesisati', name: 'Kablo Tesisati', category: 'elektrik', categoryName: 'Elektrik Aksam', description: 'Motor kablosu, govde kablosu', brands: ['Tum Markalar'] },

  // Sogutma Sistemi
  { id: 'radyator', name: 'Radyator', category: 'sogutma', categoryName: 'Sogutma Sistemi', description: 'Su radyatoru', brands: ['Tum Markalar'] },
  { id: 'su-pompasi', name: 'Su Pompasi', category: 'sogutma', categoryName: 'Sogutma Sistemi', description: 'Devirdaim pompasi', brands: ['Tum Markalar'] },
  { id: 'termostat', name: 'Termostat', category: 'sogutma', categoryName: 'Sogutma Sistemi', description: 'Termostat, termostat yuvasi', brands: ['Tum Markalar'] },
  { id: 'fan-motoru', name: 'Fan Motoru', category: 'sogutma', categoryName: 'Sogutma Sistemi', description: 'Radyator fan motoru', brands: ['Tum Markalar'] },
  { id: 'klima-radyatoru', name: 'Klima Radyatoru', category: 'sogutma', categoryName: 'Sogutma Sistemi', description: 'Kondenser, klima radyatoru', brands: ['Tum Markalar'] },

  // Egzoz Sistemi
  { id: 'egzoz-manifoldu', name: 'Egzoz Manifoldu', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Eksoz manifoltu', brands: ['Tum Markalar'] },
  { id: 'katalitik-konvertor', name: 'Katalitik Konvertor', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Katalizor', brands: ['Tum Markalar'] },
  { id: 'susturucu', name: 'Susturucu', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Orta ve arka susturucu', brands: ['Tum Markalar'] },
  { id: 'egzoz-borusu', name: 'Egzoz Borusu', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Egzoz ara boru', brands: ['Tum Markalar'] },

  // Direksiyon Sistemi
  { id: 'direksiyon-kutusu', name: 'Direksiyon Kutusu', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Kremayer, direksiyon kutusu', brands: ['Tum Markalar'] },
  { id: 'direksiyon-pompasi', name: 'Direksiyon Pompasi', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Hidrolik direksiyon pompasi', brands: ['Tum Markalar'] },
  { id: 'direksiyon-simidi', name: 'Direksiyon Simidi', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Direksiyon simidi, airbag', brands: ['Tum Markalar'] },
  { id: 'direksiyon-kolonu', name: 'Direksiyon Kolonu', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Direksiyon mili', brands: ['Tum Markalar'] },
]

export const getPartsByCategory = (categoryId: string): Part[] => {
  return parts.filter(part => part.category === categoryId)
}

export const getCategoryById = (categoryId: string): Category | undefined => {
  return categories.find(cat => cat.id === categoryId)
}

export const searchParts = (query: string): Part[] => {
  const lowerQuery = query.toLowerCase()
  return parts.filter(part =>
    part.name.toLowerCase().includes(lowerQuery) ||
    part.description.toLowerCase().includes(lowerQuery) ||
    part.categoryName.toLowerCase().includes(lowerQuery)
  )
}
