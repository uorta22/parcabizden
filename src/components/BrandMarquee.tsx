'use client'

import { memo } from 'react'
import Image from 'next/image'

const popularBrands = [
  { name: 'Volkswagen', file: 'volkswagen.png' },
  { name: 'BMW', file: 'bmw.png' },
  { name: 'Mercedes-Benz', file: 'mercedes-benz.png' },
  { name: 'Audi', file: 'audi.png' },
  { name: 'Toyota', file: 'toyota.png' },
  { name: 'Ford', file: 'ford.png' },
  { name: 'Renault', file: 'renault.png' },
  { name: 'Fiat', file: 'fiat.png' },
  { name: 'Hyundai', file: 'hyundai.png' },
  { name: 'Kia', file: 'kia.png' },
  { name: 'Peugeot', file: 'peugeot.png' },
  { name: 'Opel', file: 'opel.png' },
  { name: 'Honda', file: 'honda.png' },
  { name: 'Nissan', file: 'nissan.png' },
  { name: 'Skoda', file: 'skoda.png' },
  { name: 'Mazda', file: 'mazda.png' },
  { name: 'Citroen', file: 'citroen.png' },
  { name: 'Volvo', file: 'volvo.png' },
  { name: 'Seat', file: 'seat.png' },
  { name: 'Dacia', file: 'dacia.png' },
  { name: 'Mitsubishi', file: 'mitsubishi.png' },
  { name: 'Subaru', file: 'subaru.png' },
  { name: 'Suzuki', file: 'suzuki.png' },
  { name: 'Chevrolet', file: 'chevrolet.png' },
  { name: 'Jaguar', file: 'jaguar.png' },
  { name: 'Alfa Romeo', file: 'alfa-romeo.png' },
  { name: 'Lexus', file: 'lexus.png' },
  { name: 'Porsche', file: 'porsche.png' },
  { name: 'Tesla', file: 'tesla.png' },
  { name: 'Land Rover', file: 'land-rover.png' },
  { name: 'Jeep', file: 'jeep.png' },
  { name: 'Mini', file: 'mini.png' },
  { name: 'Cupra', file: 'cupra.png' },
  { name: 'Genesis', file: 'genesis.jpg' },
  { name: 'Ferrari', file: 'ferrari.png' },
  { name: 'Lamborghini', file: 'lamborghini.png' },
  { name: 'Maserati', file: 'maserati.png' },
  { name: 'Bentley', file: 'bentley.png' },
  { name: 'Rolls-Royce', file: 'rolls-royce.png' },
  { name: 'Bugatti', file: 'bugatti.png' },
]

function BrandMarquee() {
  return (
    <div className="relative overflow-hidden py-4">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/80 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/80 to-transparent z-10" />

      <div className="marquee-container">
        <div className="marquee-track">
          {/* First set */}
          {popularBrands.map((brand) => (
            <div
              key={brand.name}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg mx-2 hover:bg-white/10 transition-colors"
            >
              <Image
                src={`/brands/${brand.file}`}
                alt={brand.name}
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="text-gray-300 text-xs font-medium whitespace-nowrap">{brand.name}</span>
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {popularBrands.map((brand) => (
            <div
              key={`dup-${brand.name}`}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg mx-2 hover:bg-white/10 transition-colors"
            >
              <Image
                src={`/brands/${brand.file}`}
                alt={brand.name}
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="text-gray-300 text-xs font-medium whitespace-nowrap">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(BrandMarquee)
