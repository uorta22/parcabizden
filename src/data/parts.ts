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
    name: 'Motor Parçaları',
    description: 'Motor bloğu, silindir kapağı, piston, supap, krank mili ve tüm motor iç parçaları',
    icon: 'Settings',
    partCount: 45
  },
  {
    id: 'sanziman',
    name: 'Şanzıman Parçaları',
    description: 'Manuel ve otomatik şanzıman, diferansiyel, şanzıman iç parçaları, kavrama seti',
    icon: 'Settings',
    partCount: 32
  },
  {
    id: 'suspansiyon',
    name: 'Süspansiyon Parçaları',
    description: 'Amortisör, rotil, rot kolu, salıncak, bilyalı yatak, viraj demiri',
    icon: 'Car',
    partCount: 38
  },
  {
    id: 'fren',
    name: 'Fren Sistemi',
    description: 'Fren diski, fren balatası, fren kaliperi, ABS sensörü, fren hortumu',
    icon: 'Disc',
    partCount: 28
  },
  {
    id: 'kaporta',
    name: 'Kaporta Parçaları',
    description: 'Kaput, bagaj, çamurluk, kapı, tampon, panjur, ayna',
    icon: 'Car',
    partCount: 52
  },
  {
    id: 'aydinlatma',
    name: 'Aydınlatma',
    description: 'Far, stop lambası, sinyal, sis farı, xenon, LED aydınlatma',
    icon: 'Lightbulb',
    partCount: 35
  },
  {
    id: 'elektrik',
    name: 'Elektrik Aksamı',
    description: 'Alternatör, marş motoru, akü, sigorta kutusu, kablo tesisatı',
    icon: 'Battery',
    partCount: 25
  },
  {
    id: 'sogutma',
    name: 'Soğutma Sistemi',
    description: 'Radyatör, su pompası, termostat, radyatör hortumu, fan motoru',
    icon: 'Thermometer',
    partCount: 18
  },
  {
    id: 'egzoz',
    name: 'Egzoz Sistemi',
    description: 'Egzoz manifoldu, katalitik konvertör, egzoz borusu, susturucu',
    icon: 'Wind',
    partCount: 15
  },
  {
    id: 'direksiyon',
    name: 'Direksiyon Sistemi',
    description: 'Direksiyon kutusu, direksiyon pompası, rot, rotil, kremayer',
    icon: 'Wrench',
    partCount: 22
  },
  {
    id: 'ic-aksesuar',
    name: 'İç Aksesuar',
    description: 'Gösterge paneli, koltuk, konsol, kalorifer, klima ünitesi',
    icon: 'Layout',
    partCount: 30
  },
  {
    id: 'cam',
    name: 'Cam ve Ayna',
    description: 'Ön cam, arka cam, yan cam, dikiz aynası, yan ayna',
    icon: 'Square',
    partCount: 20
  }
]

export const parts: Part[] = [
  // Motor Parçaları
  { id: 'motor-blogu', name: 'Motor Bloğu', category: 'motor', categoryName: 'Motor Parçaları', description: 'Komple motor bloğu, silindir bloğu', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Renault', 'Fiat', 'Toyota', 'Hyundai', 'Kia'] },
  { id: 'silindir-kapagi', name: 'Silindir Kapağı', category: 'motor', categoryName: 'Motor Parçaları', description: 'Silindir kapağı, supap kapağı', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Opel', 'Peugeot'] },
  { id: 'krank-mili', name: 'Krank Mili', category: 'motor', categoryName: 'Motor Parçaları', description: 'Krank şaft, krank mili', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'] },
  { id: 'piston', name: 'Piston', category: 'motor', categoryName: 'Motor Parçaları', description: 'Piston ve segman seti', brands: ['Tüm Markalar'] },
  { id: 'supap', name: 'Supap', category: 'motor', categoryName: 'Motor Parçaları', description: 'Emme ve egzoz supabı', brands: ['Tüm Markalar'] },
  { id: 'eksantrik-mili', name: 'Eksantrik Mili', category: 'motor', categoryName: 'Motor Parçaları', description: 'Kam mili, eksantrik şaft', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota'] },
  { id: 'yagli-karter', name: 'Yağlı Karter', category: 'motor', categoryName: 'Motor Parçaları', description: 'Motor kartı, yağ karteri', brands: ['Tüm Markalar'] },
  { id: 'motor-kulagi', name: 'Motor Kulağı', category: 'motor', categoryName: 'Motor Parçaları', description: 'Motor bağlantı kulağı, motor takozu', brands: ['Tüm Markalar'] },
  { id: 'yag-pompasi', name: 'Yağ Pompası', category: 'motor', categoryName: 'Motor Parçaları', description: 'Motor yağ pompası', brands: ['Tüm Markalar'] },
  { id: 'triger-seti', name: 'Triger Seti', category: 'motor', categoryName: 'Motor Parçaları', description: 'Triger kayışı, triger kasnak, gergi rulman', brands: ['Tüm Markalar'] },

  // Şanzıman Parçaları
  { id: 'sanziman-komple', name: 'Şanzıman Komple', category: 'sanziman', categoryName: 'Şanzıman Parçaları', description: 'Manuel veya otomatik şanzıman', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford'] },
  { id: 'kavrama-seti', name: 'Kavrama Seti', category: 'sanziman', categoryName: 'Şanzıman Parçaları', description: 'Debriyaj baskı, balata, rulman', brands: ['Tüm Markalar'] },
  { id: 'sanziman-dislisi', name: 'Şanzıman Dişlisi', category: 'sanziman', categoryName: 'Şanzıman Parçaları', description: 'Vites dişlileri, senkromec', brands: ['Volkswagen', 'BMW', 'Mercedes'] },
  { id: 'diferansiyel', name: 'Diferansiyel', category: 'sanziman', categoryName: 'Şanzıman Parçaları', description: 'Ön ve arka diferansiyel', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'] },
  { id: 'aks', name: 'Aks', category: 'sanziman', categoryName: 'Şanzıman Parçaları', description: 'Ön ve arka aks, aks kafası', brands: ['Tüm Markalar'] },

  // Süspansiyon Parçaları
  { id: 'on-amortisor', name: 'Ön Amortisör', category: 'suspansiyon', categoryName: 'Süspansiyon Parçaları', description: 'Ön amortisör', brands: ['Tüm Markalar'] },
  { id: 'arka-amortisor', name: 'Arka Amortisör', category: 'suspansiyon', categoryName: 'Süspansiyon Parçaları', description: 'Arka amortisör', brands: ['Tüm Markalar'] },
  { id: 'rotil', name: 'Rotil', category: 'suspansiyon', categoryName: 'Süspansiyon Parçaları', description: 'Rot başı, rotil', brands: ['Tüm Markalar'] },
  { id: 'rot-kolu', name: 'Rot Kolu', category: 'suspansiyon', categoryName: 'Süspansiyon Parçaları', description: 'Rot kolu, rot', brands: ['Tüm Markalar'] },
  { id: 'salincak', name: 'Salıncak', category: 'suspansiyon', categoryName: 'Süspansiyon Parçaları', description: 'Ön ve arka salıncak', brands: ['Tüm Markalar'] },
  { id: 'viraj-demiri', name: 'Viraj Demiri', category: 'suspansiyon', categoryName: 'Süspansiyon Parçaları', description: 'Viraj çubuğu, stabilizer', brands: ['Tüm Markalar'] },
  { id: 'teker-poryasi', name: 'Teker Poryası', category: 'suspansiyon', categoryName: 'Süspansiyon Parçaları', description: 'Porya, teker yatağı', brands: ['Tüm Markalar'] },

  // Fren Sistemi
  { id: 'on-fren-diski', name: 'Ön Fren Diski', category: 'fren', categoryName: 'Fren Sistemi', description: 'Ön fren diski', brands: ['Tüm Markalar'] },
  { id: 'arka-fren-diski', name: 'Arka Fren Diski', category: 'fren', categoryName: 'Fren Sistemi', description: 'Arka fren diski', brands: ['Tüm Markalar'] },
  { id: 'fren-balatasi', name: 'Fren Balatası', category: 'fren', categoryName: 'Fren Sistemi', description: 'Ön ve arka fren balatası', brands: ['Tüm Markalar'] },
  { id: 'fren-kaliperi', name: 'Fren Kaliperi', category: 'fren', categoryName: 'Fren Sistemi', description: 'Fren kaliperi, etrier', brands: ['Tüm Markalar'] },
  { id: 'abs-beyni', name: 'ABS Beyni', category: 'fren', categoryName: 'Fren Sistemi', description: 'ABS kontrol ünitesi', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi'] },
  { id: 'abs-sensoru', name: 'ABS Sensörü', category: 'fren', categoryName: 'Fren Sistemi', description: 'ABS hız sensörü', brands: ['Tüm Markalar'] },

  // Kaporta Parçaları
  { id: 'on-kaput', name: 'Ön Kaput', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Motor kaputu', brands: ['Tüm Markalar'] },
  { id: 'bagaj-kapagi', name: 'Bagaj Kapağı', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Bagaj kapağı', brands: ['Tüm Markalar'] },
  { id: 'on-camurluk', name: 'Ön Çamurluk', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Sağ ve sol ön çamurluk', brands: ['Tüm Markalar'] },
  { id: 'arka-camurluk', name: 'Arka Çamurluk', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Sağ ve sol arka çamurluk', brands: ['Tüm Markalar'] },
  { id: 'on-kapi', name: 'Ön Kapı', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Sağ ve sol ön kapı', brands: ['Tüm Markalar'] },
  { id: 'arka-kapi', name: 'Arka Kapı', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Sağ ve sol arka kapı', brands: ['Tüm Markalar'] },
  { id: 'on-tampon', name: 'Ön Tampon', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Ön tampon', brands: ['Tüm Markalar'] },
  { id: 'arka-tampon', name: 'Arka Tampon', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Arka tampon', brands: ['Tüm Markalar'] },
  { id: 'panjur', name: 'Panjur', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Ön panjur, ızgara', brands: ['Tüm Markalar'] },
  { id: 'dis-ayna', name: 'Dış Ayna', category: 'kaporta', categoryName: 'Kaporta Parçaları', description: 'Sağ ve sol yan ayna', brands: ['Tüm Markalar'] },

  // Aydınlatma
  { id: 'on-far', name: 'Ön Far', category: 'aydinlatma', categoryName: 'Aydınlatma', description: 'Sağ ve sol ön far takımı', brands: ['Tüm Markalar'] },
  { id: 'arka-stop', name: 'Arka Stop', category: 'aydinlatma', categoryName: 'Aydınlatma', description: 'Sağ ve sol arka stop lambası', brands: ['Tüm Markalar'] },
  { id: 'sis-fari', name: 'Sis Farı', category: 'aydinlatma', categoryName: 'Aydınlatma', description: 'Ön sis farı', brands: ['Tüm Markalar'] },
  { id: 'sinyal-lambasi', name: 'Sinyal Lambası', category: 'aydinlatma', categoryName: 'Aydınlatma', description: 'Sinyal lambası, flaş', brands: ['Tüm Markalar'] },
  { id: 'xenon-beyni', name: 'Xenon Beyni', category: 'aydinlatma', categoryName: 'Aydınlatma', description: 'Xenon balast, xenon beyni', brands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'] },

  // Elektrik Aksamı
  { id: 'alternator', name: 'Alternatör', category: 'elektrik', categoryName: 'Elektrik Aksamı', description: 'Şarj dinamosu', brands: ['Tüm Markalar'] },
  { id: 'mars-motoru', name: 'Marş Motoru', category: 'elektrik', categoryName: 'Elektrik Aksamı', description: 'Marş motoru, starter', brands: ['Tüm Markalar'] },
  { id: 'beyin', name: 'Motor Beyni', category: 'elektrik', categoryName: 'Elektrik Aksamı', description: 'ECU, motor kontrol ünitesi', brands: ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford'] },
  { id: 'sigorta-kutusu', name: 'Sigorta Kutusu', category: 'elektrik', categoryName: 'Elektrik Aksamı', description: 'Sigorta kutusu, röle kutusu', brands: ['Tüm Markalar'] },
  { id: 'kablo-tesisati', name: 'Kablo Tesisatı', category: 'elektrik', categoryName: 'Elektrik Aksamı', description: 'Motor kablosu, gövde kablosu', brands: ['Tüm Markalar'] },

  // Soğutma Sistemi
  { id: 'radyator', name: 'Radyatör', category: 'sogutma', categoryName: 'Soğutma Sistemi', description: 'Su radyatörü', brands: ['Tüm Markalar'] },
  { id: 'su-pompasi', name: 'Su Pompası', category: 'sogutma', categoryName: 'Soğutma Sistemi', description: 'Devirdaim pompası', brands: ['Tüm Markalar'] },
  { id: 'termostat', name: 'Termostat', category: 'sogutma', categoryName: 'Soğutma Sistemi', description: 'Termostat, termostat yuvası', brands: ['Tüm Markalar'] },
  { id: 'fan-motoru', name: 'Fan Motoru', category: 'sogutma', categoryName: 'Soğutma Sistemi', description: 'Radyatör fan motoru', brands: ['Tüm Markalar'] },
  { id: 'klima-radyatoru', name: 'Klima Radyatörü', category: 'sogutma', categoryName: 'Soğutma Sistemi', description: 'Kondenser, klima radyatörü', brands: ['Tüm Markalar'] },

  // Egzoz Sistemi
  { id: 'egzoz-manifoldu', name: 'Egzoz Manifoldu', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Egzoz manifoldu', brands: ['Tüm Markalar'] },
  { id: 'katalitik-konvertor', name: 'Katalitik Konvertör', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Katalizör', brands: ['Tüm Markalar'] },
  { id: 'susturucu', name: 'Susturucu', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Orta ve arka susturucu', brands: ['Tüm Markalar'] },
  { id: 'egzoz-borusu', name: 'Egzoz Borusu', category: 'egzoz', categoryName: 'Egzoz Sistemi', description: 'Egzoz ara boru', brands: ['Tüm Markalar'] },

  // Direksiyon Sistemi
  { id: 'direksiyon-kutusu', name: 'Direksiyon Kutusu', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Kremayer, direksiyon kutusu', brands: ['Tüm Markalar'] },
  { id: 'direksiyon-pompasi', name: 'Direksiyon Pompası', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Hidrolik direksiyon pompası', brands: ['Tüm Markalar'] },
  { id: 'direksiyon-simidi', name: 'Direksiyon Simidi', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Direksiyon simidi, airbag', brands: ['Tüm Markalar'] },
  { id: 'direksiyon-kolonu', name: 'Direksiyon Kolonu', category: 'direksiyon', categoryName: 'Direksiyon Sistemi', description: 'Direksiyon mili', brands: ['Tüm Markalar'] },
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

// --- VIN bazlı parça filtreleme ---

interface ExclusionRule {
  excludeWhenElectric?: boolean
  excludeWhenAutomatic?: boolean
}

const categoryExclusions: Record<string, ExclusionRule> = {
  'egzoz': { excludeWhenElectric: true },
}

const partExclusions: Record<string, ExclusionRule> = {
  'motor-blogu': { excludeWhenElectric: true },
  'silindir-kapagi': { excludeWhenElectric: true },
  'krank-mili': { excludeWhenElectric: true },
  'piston': { excludeWhenElectric: true },
  'supap': { excludeWhenElectric: true },
  'eksantrik-mili': { excludeWhenElectric: true },
  'yagli-karter': { excludeWhenElectric: true },
  'yag-pompasi': { excludeWhenElectric: true },
  'triger-seti': { excludeWhenElectric: true },
  'kavrama-seti': { excludeWhenAutomatic: true },
}

function normalizeMake(nhtsaMake: string): string {
  const makeMap: Record<string, string> = {
    'VOLKSWAGEN': 'Volkswagen',
    'BMW': 'BMW',
    'MERCEDES-BENZ': 'Mercedes',
    'MERCEDES BENZ': 'Mercedes',
    'AUDI': 'Audi',
    'FORD': 'Ford',
    'FORD MOTOR COMPANY': 'Ford',
    'RENAULT': 'Renault',
    'FIAT': 'Fiat',
    'TOYOTA': 'Toyota',
    'TOYOTA MOTOR CORPORATION': 'Toyota',
    'HYUNDAI': 'Hyundai',
    'KIA': 'Kia',
    'OPEL': 'Opel',
    'PEUGEOT': 'Peugeot',
    'CITROEN': 'Citroen',
    'SKODA': 'Skoda',
    'HONDA': 'Honda',
    'NISSAN': 'Nissan',
    'MAZDA': 'Mazda',
    'CHEVROLET': 'Chevrolet',
    'TOFAS': 'Tofas/Fiat',
  }

  const upper = nhtsaMake.toUpperCase().trim()
  if (makeMap[upper]) return makeMap[upper]
  for (const [key, value] of Object.entries(makeMap)) {
    if (upper.includes(key) || key.includes(upper)) return value
  }
  return nhtsaMake.charAt(0).toUpperCase() + nhtsaMake.slice(1).toLowerCase()
}

function shouldExclude(rule: ExclusionRule, isElectric: boolean, isAutomatic: boolean): boolean {
  if (rule.excludeWhenElectric && isElectric) return true
  if (rule.excludeWhenAutomatic && isAutomatic) return true
  return false
}

export const getCompatibleParts = (make: string, fuelType: string, transmissionType: string): Part[] => {
  const isElectric = fuelType.toLowerCase().includes('electric')
  const isAutomatic = transmissionType.toLowerCase().includes('automatic') ||
                      transmissionType.toLowerCase().includes('cvt')
  const normalizedMake = normalizeMake(make)

  return parts.filter(part => {
    const brandMatch = part.brands.includes('Tüm Markalar') ||
      part.brands.some(b => b.toLowerCase() === normalizedMake.toLowerCase())

    if (!brandMatch) return false

    const catRule = categoryExclusions[part.category]
    if (catRule && shouldExclude(catRule, isElectric, isAutomatic)) return false

    const partRule = partExclusions[part.id]
    if (partRule && shouldExclude(partRule, isElectric, isAutomatic)) return false

    return true
  })
}

export const groupPartsByCategory = (compatibleParts: Part[]): Record<string, Part[]> => {
  return compatibleParts.reduce((acc, part) => {
    if (!acc[part.category]) {
      acc[part.category] = []
    }
    acc[part.category].push(part)
    return acc
  }, {} as Record<string, Part[]>)
}

export const getPartById = (id: string): Part | undefined => {
  return parts.find(part => part.id === id)
}

export const getRelatedParts = (partId: string, limit = 6): Part[] => {
  const part = getPartById(partId)
  if (!part) return []
  return parts
    .filter(p => p.category === part.category && p.id !== partId)
    .slice(0, limit)
}
