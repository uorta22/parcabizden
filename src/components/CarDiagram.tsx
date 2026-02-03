'use client'

import { useState } from 'react'
import { MessageCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface CarPart {
  id: string
  name: string
  category: string
  description: string
  path: string
}

const carParts: CarPart[] = [
  {
    id: 'motor',
    name: 'Motor',
    category: 'motor',
    description: 'Motor blogu, silindir kapagi, krank mili, piston, supap ve tum motor ic parcalari',
    path: 'M 80 120 L 160 120 L 160 180 L 80 180 Z'
  },
  {
    id: 'sanziman',
    name: 'Sanziman',
    category: 'sanziman',
    description: 'Manuel ve otomatik sanziman, diferansiyel, sanziman ic parcalari',
    path: 'M 160 130 L 210 130 L 210 170 L 160 170 Z'
  },
  {
    id: 'on-suspansiyon',
    name: 'On Suspansiyon',
    category: 'suspansiyon',
    description: 'Amortisör, rotil, rot kolu, salincak, bilyali yastak',
    path: 'M 50 170 L 90 170 L 90 220 L 50 220 Z'
  },
  {
    id: 'arka-suspansiyon',
    name: 'Arka Suspansiyon',
    category: 'suspansiyon',
    description: 'Arka amortisör, arka dingil, arka salincak, yayli sistem',
    path: 'M 310 170 L 350 170 L 350 220 L 310 220 Z'
  },
  {
    id: 'on-fren',
    name: 'On Fren Sistemi',
    category: 'fren',
    description: 'Fren diski, fren balatasi, fren kaliperi, fren hortumu',
    path: 'M 45 185 A 25 25 0 1 1 45 186'
  },
  {
    id: 'arka-fren',
    name: 'Arka Fren Sistemi',
    category: 'fren',
    description: 'Arka fren diski/kampana, balata, el freni mekanizmasi',
    path: 'M 345 185 A 25 25 0 1 1 345 186'
  },
  {
    id: 'on-far',
    name: 'On Farlar',
    category: 'aydinlatma',
    description: 'Far takimi, xenon/led far, sis fari, sinyal lambasi',
    path: 'M 30 110 L 60 100 L 70 130 L 40 140 Z'
  },
  {
    id: 'arka-stop',
    name: 'Arka Lambalar',
    category: 'aydinlatma',
    description: 'Stop lambasi, sinyal, geri vites lambasi, reflektör',
    path: 'M 360 110 L 380 120 L 370 150 L 350 140 Z'
  },
  {
    id: 'kaput',
    name: 'Kaput',
    category: 'kaporta',
    description: 'Motor kaputu, kaput menteşesi, kaput kilidi, kaput destegi',
    path: 'M 40 70 L 170 60 L 170 110 L 40 100 Z'
  },
  {
    id: 'bagaj',
    name: 'Bagaj Kapagi',
    category: 'kaporta',
    description: 'Bagaj kapagi, bagaj menteşesi, bagaj kilidi, bagaj amortisörü',
    path: 'M 300 70 L 370 80 L 360 120 L 290 110 Z'
  },
  {
    id: 'on-camurluk',
    name: 'On Camurluk',
    category: 'kaporta',
    description: 'Sag ve sol on camurluk, camurluk davlumbazi',
    path: 'M 40 100 L 80 95 L 85 160 L 45 165 Z'
  },
  {
    id: 'kapi',
    name: 'Kapilar',
    category: 'kaporta',
    description: 'On ve arka kapi, kapi cami, kapi kolu, kapi kilidi, cam mekanizmasi',
    path: 'M 120 70 L 280 70 L 280 160 L 120 160 Z'
  },
  {
    id: 'on-tampon',
    name: 'On Tampon',
    category: 'kaporta',
    description: 'On tampon, tampon eki, panjur, sis far cercevesi',
    path: 'M 25 130 L 45 125 L 50 170 L 30 175 Z'
  },
  {
    id: 'arka-tampon',
    name: 'Arka Tampon',
    category: 'kaporta',
    description: 'Arka tampon, tampon eki, park sensörü yuvasi',
    path: 'M 355 135 L 375 140 L 370 175 L 350 170 Z'
  },
  {
    id: 'radyator',
    name: 'Sogutma Sistemi',
    category: 'sogutma',
    description: 'Radyatör, su pompasi, termostat, radyatör hortumu, fan',
    path: 'M 55 115 L 80 115 L 80 145 L 55 145 Z'
  },
  {
    id: 'egzoz',
    name: 'Egzoz Sistemi',
    category: 'egzoz',
    description: 'Egzoz manifoldu, katalitik konvertör, egzoz borusu, susturucu',
    path: 'M 210 175 L 310 180 L 310 195 L 210 190 Z'
  },
  {
    id: 'direksiyon',
    name: 'Direksiyon Sistemi',
    category: 'direksiyon',
    description: 'Direksiyon kutusu, direksiyon pompasi, rot, rotil, direksiyon simidi',
    path: 'M 140 85 L 170 85 L 170 110 L 140 110 Z'
  },
  {
    id: 'elektrik',
    name: 'Elektrik Aksam',
    category: 'elektrik',
    description: 'Akü, alternatör, marş motoru, sigorta kutusu, kablo tesisati',
    path: 'M 85 95 L 115 95 L 115 120 L 85 120 Z'
  }
]

export default function CarDiagram() {
  const [selectedPart, setSelectedPart] = useState<CarPart | null>(null)
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)

  const handlePartClick = (part: CarPart) => {
    setSelectedPart(part)
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* SVG Car Diagram */}
        <div className="relative bg-dark-800 rounded-2xl p-6 border border-dark-700">
          <h3 className="text-center text-gray-400 mb-4 text-sm">Parca secmek icin arac uzerinde tiklayin</h3>
          <svg
            viewBox="0 0 400 250"
            className="w-full h-auto"
            style={{ maxHeight: '350px' }}
          >
            {/* Car Body Outline */}
            <path
              d="M 40 160
                 L 40 100
                 Q 40 70, 70 65
                 L 120 60
                 Q 140 55, 160 55
                 L 240 55
                 Q 260 55, 280 60
                 L 330 70
                 Q 360 75, 365 100
                 L 365 160
                 Q 365 175, 350 180
                 L 310 185
                 L 310 185
                 L 90 185
                 L 50 180
                 Q 40 175, 40 160
                 Z"
              fill="#2e3f6f"
              stroke="#596995"
              strokeWidth="2"
            />

            {/* Windows */}
            <path
              d="M 125 65 L 195 62 L 195 105 L 125 105 Z"
              fill="#1a2652"
              stroke="#596995"
              strokeWidth="1"
            />
            <path
              d="M 205 62 L 275 68 L 275 105 L 205 105 Z"
              fill="#1a2652"
              stroke="#596995"
              strokeWidth="1"
            />

            {/* Wheels */}
            <circle cx="90" cy="185" r="30" fill="#1f2431" stroke="#596995" strokeWidth="2" />
            <circle cx="90" cy="185" r="20" fill="#313949" stroke="#596995" strokeWidth="1" />
            <circle cx="90" cy="185" r="8" fill="#596995" />

            <circle cx="310" cy="185" r="30" fill="#1f2431" stroke="#596995" strokeWidth="2" />
            <circle cx="310" cy="185" r="20" fill="#313949" stroke="#596995" strokeWidth="1" />
            <circle cx="310" cy="185" r="8" fill="#596995" />

            {/* Clickable Parts */}
            {carParts.map((part) => (
              <path
                key={part.id}
                d={part.path}
                className={`car-part ${selectedPart?.id === part.id ? 'selected' : ''}`}
                fill={hoveredPart === part.id || selectedPart?.id === part.id ? '#f9ac1b' : 'rgba(249, 172, 27, 0.2)'}
                stroke={hoveredPart === part.id || selectedPart?.id === part.id ? '#f9ac1b' : 'rgba(249, 172, 27, 0.5)'}
                strokeWidth="1.5"
                onClick={() => handlePartClick(part)}
                onMouseEnter={() => setHoveredPart(part.id)}
                onMouseLeave={() => setHoveredPart(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}

            {/* Hover Label */}
            {hoveredPart && (
              <text
                x="200"
                y="240"
                textAnchor="middle"
                fill="#f9ac1b"
                fontSize="12"
                fontWeight="500"
              >
                {carParts.find(p => p.id === hoveredPart)?.name}
              </text>
            )}
          </svg>
        </div>

        {/* Selected Part Info */}
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 min-h-[350px] flex flex-col">
          {selectedPart ? (
            <div className="animate-fadeIn flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-primary-500/20 text-primary-500 rounded-full text-xs font-medium uppercase">
                  {selectedPart.category}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{selectedPart.name}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">{selectedPart.description}</p>

              <div className="mt-auto space-y-3">
                <Link
                  href={`/parcalar/${selectedPart.category}`}
                  className="flex items-center justify-between w-full px-4 py-3 bg-secondary-600 hover:bg-secondary-700 rounded-lg transition-colors group"
                >
                  <span className="text-white font-medium">Tum {selectedPart.name} Parcalarini Gor</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </Link>

                <a
                  href={`https://wa.me/905001234567?text=Merhaba,%20${encodeURIComponent(selectedPart.name)}%20parcasi%20hakkinda%20bilgi%20almak%20istiyorum.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">WhatsApp ile Talep Olustur</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Parca Secin</h3>
              <p className="text-gray-400 max-w-xs">
                Soldaki arac semasinda ihtiyaciniz olan parcaya tiklayin, detaylari gorun ve hemen talep olusturun.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
