// ═══ Akıllı Parça Arama — Keyword matching engine ═══

/** Türkçe parça adları → İngilizce node_name_en eşlemeleri */
export const PART_KEYWORDS: Record<string, string[]> = {
  // Motor
  'klima kompresörü': ['compressor'],
  'klima': ['compressor', 'condenser', 'evaporator', 'air conditioning'],
  'kompresör': ['compressor'],
  'radyatör': ['radiator'],
  'fan': ['fan', 'cooling fan'],
  'turbo': ['turbocharger', 'turbo'],
  'enjektör': ['injector', 'nozzle'],
  'buji': ['spark plug'],
  'supap': ['valve'],
  'piston': ['piston'],
  'krank': ['crankshaft'],
  'eksantrik': ['camshaft'],
  'yağ pompası': ['oil pump'],
  'su pompası': ['water pump'],
  'termostat': ['thermostat'],
  'alternatör': ['alternator', 'generator'],
  'marş motoru': ['starter', 'starter motor'],
  'marş': ['starter'],
  'kayış': ['belt', 'timing belt', 'v-belt'],
  'triger': ['timing'],
  'conta': ['gasket', 'seal'],
  'motor kulağı': ['engine mount', 'mounting'],
  'motor takozu': ['engine mount'],
  'egzoz': ['exhaust', 'muffler'],
  'katalitik': ['catalytic', 'catalyst'],
  'egr': ['egr'],
  'hava filtresi': ['air filter'],
  'yağ filtresi': ['oil filter'],
  'yakıt filtresi': ['fuel filter'],
  'filtre': ['filter'],

  // Fren
  'fren diski': ['brake disc', 'brake rotor'],
  'fren balata': ['brake pad'],
  'balata': ['brake pad', 'pad'],
  'fren kaliperi': ['brake caliper', 'caliper'],
  'fren': ['brake'],
  'el freni': ['parking brake', 'handbrake'],
  'abs': ['abs'],

  // Süspansiyon
  'amortisör': ['shock absorber', 'strut', 'damper'],
  'yay': ['spring', 'coil spring'],
  'salıncak': ['control arm', 'wishbone'],
  'rotil': ['tie rod', 'track rod'],
  'rot': ['tie rod'],
  'bijon': ['wheel bolt', 'lug'],
  'rulman': ['bearing', 'wheel bearing'],
  'aks': ['axle', 'drive shaft'],
  'şaft': ['shaft', 'drive shaft'],
  'körük': ['boot', 'bellow', 'gaiter'],

  // Kaporta / Dış
  'far': ['headlight', 'headlamp', 'head light'],
  'ön far': ['headlight', 'headlamp'],
  'sis farı': ['fog light', 'fog lamp'],
  'stop lambası': ['tail light', 'rear light', 'tail lamp'],
  'stop': ['tail light', 'rear light'],
  'sinyal': ['indicator', 'turn signal', 'blinker'],
  'ayna': ['mirror', 'side mirror', 'wing mirror'],
  'dikiz aynası': ['mirror', 'rearview'],
  'tampon': ['bumper'],
  'ön tampon': ['front bumper'],
  'arka tampon': ['rear bumper'],
  'çamurluk': ['fender', 'wing'],
  'kaput': ['hood', 'bonnet'],
  'bagaj': ['trunk', 'boot lid', 'tailgate'],
  'kapı': ['door'],
  'cam': ['glass', 'window', 'windshield'],
  'ön cam': ['windshield', 'windscreen'],
  'silecek': ['wiper', 'wiper blade'],
  'izgara': ['grille', 'grill'],
  'panel': ['panel'],
  'marşpiyel': ['sill', 'rocker panel'],

  // İç
  'gösterge': ['instrument', 'cluster', 'dashboard'],
  'direksiyon': ['steering wheel', 'steering'],
  'koltuk': ['seat'],
  'torpido': ['dashboard', 'glove box'],
  'klima paneli': ['climate control', 'heater control'],
  'cam kriko': ['window regulator', 'window lifter'],
  'cam motoru': ['window motor'],
  'kilit': ['lock', 'door lock'],
  'merkezi kilit': ['central locking'],
  'anahtar': ['key', 'ignition'],
  'kontak': ['ignition'],

  // Elektrik
  'akü': ['battery'],
  'sigorta': ['fuse'],
  'sensör': ['sensor'],
  'oksijen sensörü': ['oxygen sensor', 'lambda'],
  'abs sensörü': ['abs sensor', 'wheel speed sensor'],
  'park sensörü': ['parking sensor'],
  'beyin': ['ecu', 'control unit', 'module'],
  'motor beyni': ['engine ecu', 'engine control'],
  'bobin': ['ignition coil', 'coil'],

  // Şanzıman / Aktarma
  'şanzıman': ['transmission', 'gearbox'],
  'debriyaj': ['clutch'],
  'volan': ['flywheel'],
  'diferansiyel': ['differential'],
  'kardan': ['drive shaft', 'propshaft'],

  // Soğutma / Isıtma
  'kalorifer': ['heater', 'heater core'],
  'kalorifer motoru': ['blower motor', 'heater fan'],
  'kondenser': ['condenser'],
  'fan motoru': ['fan motor'],
}

/** Model adı → marka slug eşlemesi */
export const BRAND_KEYWORDS: Record<string, string> = {
  // Volkswagen
  'golf': 'volkswagen', 'passat': 'volkswagen', 'polo': 'volkswagen',
  'caddy': 'volkswagen', 'tiguan': 'volkswagen', 'touareg': 'volkswagen',
  'jetta': 'volkswagen', 'bora': 'volkswagen', 'transporter': 'volkswagen',
  't5': 'volkswagen', 't6': 'volkswagen', 'crafter': 'volkswagen',
  'arteon': 'volkswagen', 'taigo': 'volkswagen',

  // Audi
  'a3': 'audi', 'a4': 'audi', 'a5': 'audi', 'a6': 'audi', 'a8': 'audi',
  'q3': 'audi', 'q5': 'audi', 'q7': 'audi', 'q8': 'audi',
  'tt': 'audi', 'rs': 'audi', 's3': 'audi', 's4': 'audi',

  // BMW
  '1 serisi': 'bmw', '2 serisi': 'bmw', '3 serisi': 'bmw', '4 serisi': 'bmw',
  '5 serisi': 'bmw', '7 serisi': 'bmw', 'x1': 'bmw', 'x3': 'bmw',
  'x5': 'bmw', 'x6': 'bmw', 'x7': 'bmw',
  'e36': 'bmw', 'e46': 'bmw', 'e90': 'bmw', 'e60': 'bmw',
  'f10': 'bmw', 'f30': 'bmw', 'g20': 'bmw', 'g30': 'bmw',

  // Mercedes
  'c serisi': 'mercedes-benz', 'e serisi': 'mercedes-benz', 's serisi': 'mercedes-benz',
  'c180': 'mercedes-benz', 'c200': 'mercedes-benz', 'c220': 'mercedes-benz',
  'e200': 'mercedes-benz', 'e220': 'mercedes-benz', 'e250': 'mercedes-benz',
  'w203': 'mercedes-benz', 'w204': 'mercedes-benz', 'w205': 'mercedes-benz',
  'w211': 'mercedes-benz', 'w212': 'mercedes-benz', 'w213': 'mercedes-benz',
  'sprinter': 'mercedes-benz', 'vito': 'mercedes-benz',
  'cla': 'mercedes-benz', 'gla': 'mercedes-benz', 'glc': 'mercedes-benz',

  // Renault
  'clio': 'renault', 'megane': 'renault', 'fluence': 'renault',
  'symbol': 'renault', 'kangoo': 'renault', 'laguna': 'renault',
  'scenic': 'renault', 'captur': 'renault', 'kadjar': 'renault',
  'talisman': 'renault', 'master': 'renault',

  // Fiat
  'linea': 'fiat', 'punto': 'fiat', 'doblo': 'fiat',
  'egea': 'fiat', 'fiorino': 'fiat', 'tipo': 'fiat', 'ducato': 'fiat',
  'panda': 'fiat', 'bravo': 'fiat', '500': 'fiat',

  // Ford
  'focus': 'ford', 'fiesta': 'ford', 'mondeo': 'ford',
  'transit': 'ford', 'connect': 'ford', 'courier': 'ford',
  'kuga': 'ford', 'puma': 'ford', 'ranger': 'ford', 'custom': 'ford',

  // Opel
  'astra': 'opel', 'corsa': 'opel', 'insignia': 'opel',
  'mokka': 'opel', 'combo': 'opel', 'vectra': 'opel', 'zafira': 'opel',

  // Toyota
  'corolla': 'toyota', 'yaris': 'toyota', 'auris': 'toyota',
  'rav4': 'toyota', 'hilux': 'toyota', 'c-hr': 'toyota',
  'camry': 'toyota', 'land cruiser': 'toyota',

  // Honda
  'civic': 'honda', 'accord': 'honda', 'jazz': 'honda',
  'cr-v': 'honda', 'hr-v': 'honda',

  // Hyundai
  'i10': 'hyundai', 'i20': 'hyundai', 'i30': 'hyundai',
  'accent': 'hyundai', 'elantra': 'hyundai', 'tucson': 'hyundai',
  'kona': 'hyundai', 'santa fe': 'hyundai', 'bayon': 'hyundai',

  // Peugeot
  '206': 'peugeot', '207': 'peugeot', '208': 'peugeot',
  '301': 'peugeot', '308': 'peugeot', '3008': 'peugeot',
  '407': 'peugeot', '508': 'peugeot', '5008': 'peugeot',
  'partner': 'peugeot', 'rifter': 'peugeot',

  // Citroën
  'c3': 'citroen', 'c4': 'citroen', 'c5': 'citroen',
  'berlingo': 'citroen', 'c-elysee': 'citroen', 'nemo': 'citroen',
  'jumpy': 'citroen', 'jumper': 'citroen',

  // Dacia
  'duster': 'dacia', 'sandero': 'dacia', 'lodgy': 'dacia',
  'logan': 'dacia', 'dokker': 'dacia',

  // Škoda
  'octavia': 'skoda', 'fabia': 'skoda', 'superb': 'skoda',
  'rapid': 'skoda', 'karoq': 'skoda', 'kodiaq': 'skoda',

  // Seat
  'leon': 'seat', 'ibiza': 'seat', 'arona': 'seat',
  'ateca': 'seat', 'toledo': 'seat',

  // Volvo
  's40': 'volvo', 's60': 'volvo', 's80': 'volvo', 's90': 'volvo',
  'v40': 'volvo', 'v60': 'volvo', 'xc40': 'volvo', 'xc60': 'volvo', 'xc90': 'volvo',

  // Nissan
  'qashqai': 'nissan', 'juke': 'nissan', 'micra': 'nissan',
  'x-trail': 'nissan', 'navara': 'nissan', 'note': 'nissan',

  // Kia
  'ceed': 'kia', 'sportage': 'kia', 'rio': 'kia',
  'stonic': 'kia', 'sorento': 'kia', 'picanto': 'kia',

  // Suzuki
  'swift': 'suzuki', 'vitara': 'suzuki', 'sx4': 'suzuki', 'jimny': 'suzuki',

  // Mazda
  'mazda3': 'mazda', 'mazda6': 'mazda', 'cx-3': 'mazda',
  'cx-5': 'mazda', 'cx-30': 'mazda',

  // Marka isimleri (direkt)
  'volkswagen': 'volkswagen', 'vw': 'volkswagen',
  'audi': 'audi', 'bmw': 'bmw',
  'mercedes': 'mercedes-benz', 'mercedes-benz': 'mercedes-benz',
  'renault': 'renault', 'fiat': 'fiat', 'ford': 'ford',
  'opel': 'opel', 'toyota': 'toyota', 'honda': 'honda',
  'hyundai': 'hyundai', 'peugeot': 'peugeot',
  'citroen': 'citroen', 'citroën': 'citroen',
  'dacia': 'dacia', 'skoda': 'skoda', 'škoda': 'skoda',
  'seat': 'seat', 'volvo': 'volvo', 'nissan': 'nissan',
  'kia': 'kia', 'suzuki': 'suzuki', 'mazda': 'mazda',
  'alfa romeo': 'alfa-romeo', 'mini': 'mini',
  'porsche': 'porsche', 'jeep': 'jeep', 'land rover': 'land-rover',
  'subaru': 'subaru', 'mitsubishi': 'mitsubishi',
  'chevrolet': 'chevrolet', 'chrysler': 'chrysler',
}

export interface ParsedQuery {
  brand: string | null
  model: string | null
  parts: string[]
  rawTerms: string[]
}

/** Kullanıcı metnini parçalara ayırır */
export function parseSmartQuery(text: string): ParsedQuery {
  const normalized = text.toLowerCase().trim()
  const result: ParsedQuery = { brand: null, model: null, parts: [], rawTerms: [] }

  if (!normalized) return result

  // Try to find brand from model keywords (longer matches first)
  const sortedBrandKeys = Object.keys(BRAND_KEYWORDS).sort((a, b) => b.length - a.length)
  for (const key of sortedBrandKeys) {
    if (normalized.includes(key)) {
      result.brand = BRAND_KEYWORDS[key]
      // If the key is not the brand name itself, it's probably a model name
      if (result.brand !== key && !['vw', 'mercedes'].includes(key)) {
        result.model = key
      }
      break
    }
  }

  // Try to find part keywords (longer matches first)
  const sortedPartKeys = Object.keys(PART_KEYWORDS).sort((a, b) => b.length - a.length)
  const matchedParts = new Set<string>()

  for (const key of sortedPartKeys) {
    if (normalized.includes(key)) {
      const englishTerms = PART_KEYWORDS[key]
      for (const term of englishTerms) {
        if (!matchedParts.has(term)) {
          matchedParts.add(term)
          result.parts.push(term)
        }
      }
    }
  }

  // Build raw terms for OEM search fallback
  const words = normalized.split(/\s+/).filter(w => w.length > 1)
  result.rawTerms = words

  return result
}

/** Türkçe parça terimi → olası API kategori ID'leri */
export const PART_TO_CATEGORIES: Record<string, string[]> = {
  // Motor
  'klima kompresörü': ['climate'],
  'klima': ['climate'],
  'kompresör': ['climate', 'engine'],
  'radyatör': ['engine'],
  'fan': ['engine'],
  'turbo': ['turbo_intake'],
  'enjektör': ['fuel'],
  'buji': ['engine'],
  'supap': ['engine'],
  'piston': ['engine'],
  'krank': ['engine'],
  'eksantrik': ['engine'],
  'yağ pompası': ['engine'],
  'su pompası': ['engine'],
  'termostat': ['engine'],
  'alternatör': ['electrical'],
  'marş motoru': ['electrical'],
  'marş': ['electrical'],
  'kayış': ['engine'],
  'triger': ['engine'],
  'conta': ['engine'],
  'motor kulağı': ['engine'],
  'motor takozu': ['engine'],
  'egzoz': ['exhaust'],
  'katalitik': ['exhaust'],
  'egr': ['exhaust', 'engine'],
  'hava filtresi': ['turbo_intake'],
  'yağ filtresi': ['engine'],
  'yakıt filtresi': ['fuel'],
  'filtre': ['engine', 'fuel', 'turbo_intake'],

  // Fren
  'fren diski': ['brake'],
  'fren balata': ['brake'],
  'balata': ['brake'],
  'fren kaliperi': ['brake'],
  'fren': ['brake'],
  'el freni': ['brake'],
  'abs': ['brake'],

  // Süspansiyon
  'amortisör': ['suspension'],
  'yay': ['suspension'],
  'salıncak': ['suspension'],
  'rotil': ['suspension'],
  'rot': ['suspension'],
  'rulman': ['suspension', 'wheel_tyre'],
  'aks': ['transmission', 'suspension'],
  'şaft': ['transmission'],
  'körük': ['suspension'],

  // Kaporta
  'far': ['lighting'],
  'ön far': ['lighting'],
  'sis farı': ['lighting'],
  'stop lambası': ['lighting'],
  'stop': ['lighting'],
  'sinyal': ['lighting'],
  'ayna': ['glass_mirror'],
  'dikiz aynası': ['glass_mirror'],
  'tampon': ['body_exterior'],
  'ön tampon': ['body_exterior'],
  'arka tampon': ['body_exterior'],
  'çamurluk': ['body_exterior'],
  'kaput': ['body_exterior'],
  'bagaj': ['body_exterior'],
  'kapı': ['body_exterior'],
  'cam': ['glass_mirror'],
  'ön cam': ['glass_mirror'],
  'silecek': ['body_exterior'],
  'izgara': ['body_exterior'],
  'marşpiyel': ['body_exterior'],

  // İç
  'gösterge': ['interior'],
  'direksiyon': ['interior'],
  'koltuk': ['interior'],
  'torpido': ['interior'],
  'klima paneli': ['climate'],
  'cam kriko': ['interior'],
  'cam motoru': ['interior'],
  'kilit': ['interior'],
  'merkezi kilit': ['electrical'],
  'anahtar': ['electrical'],
  'kontak': ['electrical'],

  // Elektrik
  'akü': ['electrical'],
  'sigorta': ['electrical'],
  'sensör': ['electrical', 'engine'],
  'oksijen sensörü': ['exhaust'],
  'abs sensörü': ['brake'],
  'park sensörü': ['electrical'],
  'beyin': ['electrical'],
  'motor beyni': ['electrical'],
  'bobin': ['electrical'],

  // Şanzıman
  'şanzıman': ['transmission'],
  'debriyaj': ['transmission'],
  'volan': ['transmission'],
  'diferansiyel': ['transmission'],
  'kardan': ['transmission'],

  // Soğutma
  'kalorifer': ['climate'],
  'kalorifer motoru': ['climate'],
  'kondenser': ['climate'],
  'fan motoru': ['engine', 'climate'],
}

/** Kullanıcının parça terimlerinden hedef kategori ID'lerini çıkar */
export function getTargetCategories(rawText: string): string[] {
  const normalized = rawText.toLowerCase().trim()
  const cats = new Set<string>()

  const sortedKeys = Object.keys(PART_TO_CATEGORIES).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      for (const cat of PART_TO_CATEGORIES[key]) {
        cats.add(cat)
      }
    }
  }

  return Array.from(cats)
}

/** Popüler arama önerileri (marka + parça formatında) */
export const POPULAR_SEARCHES = [
  'Golf far',
  'BMW fren diski',
  'Passat klima',
  'Clio amortisör',
  'Focus radyatör',
  'Astra turbo',
  'Corolla tampon',
  'A4 stop lambası',
  'Megane enjektör',
  'Civic alternatör',
  'Polo ayna',
  'E46 silecek',
]
