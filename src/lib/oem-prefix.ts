// OEM parça numarası prefix'inden marka tahmini
// Sadece güvenilir pattern'ler — yanlış tahmin yapmaktansa tahmin yapmamak tercih edilir

interface OemBrandGuess {
  brand: string
  brandSlug: string
  confidence: 'high' | 'medium'
}

// VW Group prefix haritası — rakam+harf+rakam formatı (ör: 3C0, 1K0, 8E0)
// Bu format VW Group'a özgü ve çok güvenilir
const VW_GROUP_PREFIX: Record<string, [string, string]> = {
  // Volkswagen
  '1C': ['Volkswagen', 'volkswagen'],   // New Beetle
  '1H': ['Volkswagen', 'volkswagen'],   // Golf III
  '1J': ['Volkswagen', 'volkswagen'],   // Golf IV, Bora
  '1K': ['Volkswagen', 'volkswagen'],   // Golf V, Jetta
  '1T': ['Volkswagen', 'volkswagen'],   // Touran
  '2D': ['Volkswagen', 'volkswagen'],   // LT
  '2E': ['Volkswagen', 'volkswagen'],   // Crafter
  '2G': ['Volkswagen', 'volkswagen'],   // Crafter
  '2H': ['Volkswagen', 'volkswagen'],   // Amarok
  '2K': ['Volkswagen', 'volkswagen'],   // Caddy
  '3B': ['Volkswagen', 'volkswagen'],   // Passat B5
  '3C': ['Volkswagen', 'volkswagen'],   // Passat B6/B7
  '3D': ['Volkswagen', 'volkswagen'],   // Phaeton
  '3G': ['Volkswagen', 'volkswagen'],   // Passat B8
  '3Q': ['Volkswagen', 'volkswagen'],   // Tiguan II
  '5C': ['Volkswagen', 'volkswagen'],   // Beetle
  '5G': ['Volkswagen', 'volkswagen'],   // Golf VII
  '5H': ['Volkswagen', 'volkswagen'],   // Golf Sportsvan
  '5K': ['Volkswagen', 'volkswagen'],   // Golf VI
  '5M': ['Volkswagen', 'volkswagen'],   // Tiguan I
  '5N': ['Volkswagen', 'volkswagen'],   // Tiguan
  '5Q': ['Volkswagen', 'volkswagen'],   // Golf VII alt parçalar
  '5T': ['Volkswagen', 'volkswagen'],   // Touareg III
  '6C': ['Volkswagen', 'volkswagen'],   // Polo V facelift
  '6N': ['Volkswagen', 'volkswagen'],   // Polo III
  '6Q': ['Volkswagen', 'volkswagen'],   // Polo IV
  '6R': ['Volkswagen', 'volkswagen'],   // Polo V
  '6V': ['Volkswagen', 'volkswagen'],   // Polo VI
  '7C': ['Volkswagen', 'volkswagen'],   // Transporter T6.1
  '7E': ['Volkswagen', 'volkswagen'],   // Transporter T5
  '7H': ['Volkswagen', 'volkswagen'],   // Transporter T5
  '7L': ['Volkswagen', 'volkswagen'],   // Touareg I
  '7N': ['Volkswagen', 'volkswagen'],   // Sharan
  '7P': ['Volkswagen', 'volkswagen'],   // Touareg II

  // Audi
  '4A': ['Audi', 'audi'],   // A6 C4, A6 C8
  '4B': ['Audi', 'audi'],   // A6 C5
  '4D': ['Audi', 'audi'],   // A8 D2
  '4E': ['Audi', 'audi'],   // A8 D3
  '4F': ['Audi', 'audi'],   // A6 C6
  '4G': ['Audi', 'audi'],   // A6 C7
  '4H': ['Audi', 'audi'],   // A8 D4
  '4K': ['Audi', 'audi'],   // A6 C8
  '4L': ['Audi', 'audi'],   // Q7
  '4M': ['Audi', 'audi'],   // Q7/Q8
  '4N': ['Audi', 'audi'],   // A8 D5
  '4S': ['Audi', 'audi'],   // R8
  '8D': ['Audi', 'audi'],   // A4 B5
  '8E': ['Audi', 'audi'],   // A4 B6/B7
  '8H': ['Audi', 'audi'],   // A4 Cabrio
  '8J': ['Audi', 'audi'],   // TT
  '8K': ['Audi', 'audi'],   // A4 B8
  '8L': ['Audi', 'audi'],   // A3 8L
  '8N': ['Audi', 'audi'],   // TT
  '8P': ['Audi', 'audi'],   // A3
  '8R': ['Audi', 'audi'],   // Q5
  '8S': ['Audi', 'audi'],   // TT
  '8T': ['Audi', 'audi'],   // A5
  '8U': ['Audi', 'audi'],   // Q3
  '8V': ['Audi', 'audi'],   // A3
  '8W': ['Audi', 'audi'],   // A4 B9
  '8X': ['Audi', 'audi'],   // A1

  // Skoda
  '1U': ['Skoda', 'skoda'],   // Octavia I
  '1Z': ['Skoda', 'skoda'],   // Octavia II
  '3T': ['Skoda', 'skoda'],   // Superb II
  '3U': ['Skoda', 'skoda'],   // Superb I
  '3V': ['Skoda', 'skoda'],   // Superb III
  '5E': ['Skoda', 'skoda'],   // Octavia III
  '5J': ['Skoda', 'skoda'],   // Fabia II
  '5L': ['Skoda', 'skoda'],   // Yeti
  '6Y': ['Skoda', 'skoda'],   // Fabia I
  '6U': ['Skoda', 'skoda'],   // Felicia
  '6V': ['Skoda', 'skoda'],   // Roomster (dikkat: VW Polo ile çakışma - 3. karakter ayırır)

  // SEAT
  '1M': ['SEAT', 'seat'],   // Toledo/Leon
  '1P': ['SEAT', 'seat'],   // Leon II
  '1S': ['SEAT', 'seat'],   // Ibiza V
  '5F': ['SEAT', 'seat'],   // Leon III
  '6F': ['SEAT', 'seat'],   // Ibiza
  '6J': ['SEAT', 'seat'],   // Ibiza IV
  '6K': ['SEAT', 'seat'],   // Ibiza/Cordoba
  '6L': ['SEAT', 'seat'],   // Ibiza III

  // Porsche
  '9J': ['Porsche', 'porsche'],   // Cayenne
  '9P': ['Porsche', 'porsche'],   // Cayenne
  '9Y': ['Porsche', 'porsche'],   // Cayenne III
}

export function guessOemBrand(oem: string): OemBrandGuess | null {
  const clean = oem.replace(/\s+/g, '').toUpperCase()
  if (clean.length < 4) return null

  // VW Group — rakam+harf veya harf+rakam pattern
  // Format: 2 karakter prefix + rakam (ör: 3C0854327B5AP)
  if (/^[0-9][A-Z]\d|^[A-Z][0-9][A-Z]/i.test(clean)) {
    const prefix = clean.substring(0, 2)
    const match = VW_GROUP_PREFIX[prefix]
    if (match) {
      return { brand: match[0], brandSlug: match[1], confidence: 'high' }
    }
  }

  // Mercedes-Benz — A/B/Q/N + 3 rakam + boşluk + 3 rakam pattern
  // Ör: A2048200056, B66960391
  if (/^[ABQN]\d{3}\s?\d{3}/i.test(clean)) {
    return { brand: 'Mercedes-Benz', brandSlug: 'mercedes-benz', confidence: 'high' }
  }

  // Renault — 77 00/01/02/03/04/05/06/07/08/09 pattern (10 haneli)
  // Ör: 7700867685, 7701478460
  if (/^77\d{8}$/.test(clean) || /^82\d{8}$/.test(clean)) {
    return { brand: 'Renault', brandSlug: 'renault', confidence: 'high' }
  }

  // PSA (Peugeot/Citroen) — 96/98 prefix + 6 rakam
  // Ör: 9646777280
  if (/^(96|98)\d{6,}$/.test(clean)) {
    return { brand: 'Peugeot/Citroen', brandSlug: 'peugeot', confidence: 'medium' }
  }

  // Fiat — 46/71/73 prefix + 6 rakam (yıl 2000 sonrası: 55/51 prefix de var ama BMW ile çakışır)
  if (/^(46|71|73)\d{6,}$/.test(clean)) {
    return { brand: 'Fiat', brandSlug: 'fiat', confidence: 'medium' }
  }

  // Opel — 13/90/93/95 prefix + 6 rakam
  if (/^(13|90|93)\d{6,}$/.test(clean)) {
    return { brand: 'Opel', brandSlug: 'opel', confidence: 'medium' }
  }

  // Toyota — 5 rakam + tire pattern (ör: 04465-26420)
  if (/^\d{5}-\d{5}$/.test(clean.replace(/\s/g, ''))) {
    return { brand: 'Toyota', brandSlug: 'toyota', confidence: 'medium' }
  }

  // Hyundai/Kia — 5 rakam + tire + harf/rakam pattern (ör: 86350-2H000)
  if (/^\d{5}-[A-Z0-9]{5}$/i.test(clean)) {
    return { brand: 'Hyundai/Kia', brandSlug: 'hyundai', confidence: 'medium' }
  }

  return null
}
