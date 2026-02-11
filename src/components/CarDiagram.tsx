'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CarZone {
  id: string
  label: string
  category: string
  path: string
}

// Top-down car diagram — viewBox 0 0 400 700
// Clean sedan silhouette with well-proportioned zones
const zones: CarZone[] = [
  // ── Front bumper ──
  {
    id: 'on-tampon',
    label: 'Ön Tampon',
    category: 'sogutma',
    path: 'M 120,60 Q 200,40 280,60 L 278,90 L 122,90 Z',
  },
  // ── Headlights ──
  {
    id: 'sol-far',
    label: 'Sol Far',
    category: 'aydinlatma',
    path: 'M 100,72 L 118,60 L 120,90 L 102,90 Z',
  },
  {
    id: 'sag-far',
    label: 'Sağ Far',
    category: 'aydinlatma',
    path: 'M 282,60 L 300,72 L 298,90 L 280,90 Z',
  },
  // ── Hood (Motor) ──
  {
    id: 'kaput',
    label: 'Motor',
    category: 'motor',
    path: 'M 102,93 L 298,93 L 298,225 L 102,225 Z',
  },
  // ── Windshield ──
  {
    id: 'on-cam',
    label: 'Ön Cam',
    category: 'cam',
    path: 'M 102,228 L 298,228 L 300,300 L 100,300 Z',
  },
  // ── Roof / Interior ──
  {
    id: 'tavan',
    label: 'İç Mekan',
    category: 'ic-aksesuar',
    path: 'M 100,303 L 300,303 L 300,468 L 100,468 Z',
  },
  // ── Rear windshield ──
  {
    id: 'arka-cam',
    label: 'Arka Cam',
    category: 'cam',
    path: 'M 100,471 L 300,471 L 298,530 L 102,530 Z',
  },
  // ── Trunk ──
  {
    id: 'bagaj',
    label: 'Bagaj',
    category: 'kaporta',
    path: 'M 102,533 L 298,533 L 298,590 L 102,590 Z',
  },
  // ── Tail lights ──
  {
    id: 'sol-stop',
    label: 'Sol Stop',
    category: 'aydinlatma',
    path: 'M 102,593 L 155,593 L 155,610 L 104,610 Z',
  },
  {
    id: 'sag-stop',
    label: 'Sağ Stop',
    category: 'aydinlatma',
    path: 'M 245,593 L 298,593 L 296,610 L 245,610 Z',
  },
  // ── Rear bumper ──
  {
    id: 'arka-tampon',
    label: 'Arka Tampon',
    category: 'egzoz',
    path: 'M 104,613 L 296,613 Q 200,640 104,613 Z',
  },
  // ── Left doors ──
  {
    id: 'sol-on-kapi',
    label: 'Sol Ön Kapı',
    category: 'kaporta',
    path: 'M 60,270 L 97,270 L 97,385 L 60,385 Z',
  },
  {
    id: 'sol-arka-kapi',
    label: 'Sol Arka Kapı',
    category: 'kaporta',
    path: 'M 60,388 L 97,388 L 97,490 L 65,490 Z',
  },
  // ── Right doors ──
  {
    id: 'sag-on-kapi',
    label: 'Sağ Ön Kapı',
    category: 'kaporta',
    path: 'M 303,270 L 340,270 L 340,385 L 303,385 Z',
  },
  {
    id: 'sag-arka-kapi',
    label: 'Sağ Arka Kapı',
    category: 'kaporta',
    path: 'M 303,388 L 340,388 L 335,490 L 303,490 Z',
  },
  // ── Fenders ──
  {
    id: 'sol-on-camurluk',
    label: 'Sol Çamurluk',
    category: 'kaporta',
    path: 'M 70,93 L 99,93 L 97,267 L 60,267 Q 55,180 70,93 Z',
  },
  {
    id: 'sag-on-camurluk',
    label: 'Sağ Çamurluk',
    category: 'kaporta',
    path: 'M 301,93 L 330,93 Q 345,180 340,267 L 303,267 L 301,93 Z',
  },
  {
    id: 'sol-arka-camurluk',
    label: 'Sol Arka Çamurluk',
    category: 'kaporta',
    path: 'M 65,493 L 99,493 L 102,590 L 102,610 Q 80,580 65,493 Z',
  },
  {
    id: 'sag-arka-camurluk',
    label: 'Sağ Arka Çamurluk',
    category: 'kaporta',
    path: 'M 301,493 L 335,493 Q 320,580 298,610 L 298,590 L 301,493 Z',
  },
]

// Wheel positions
const wheels = [
  { x: 42, y: 160, label: 'Fren', cat: 'fren' },
  { x: 358, y: 160, label: 'Fren', cat: 'fren' },
  { x: 47, y: 490, label: 'Süspansiyon', cat: 'suspansiyon' },
  { x: 353, y: 490, label: 'Süspansiyon', cat: 'suspansiyon' },
]

// Zone label positions
const zoneLabelPositions: Record<string, { x: number; y: number; fontSize?: number }> = {
  'on-tampon': { x: 200, y: 78 },
  'kaput': { x: 200, y: 165 },
  'on-cam': { x: 200, y: 268 },
  'tavan': { x: 200, y: 390 },
  'arka-cam': { x: 200, y: 504 },
  'bagaj': { x: 200, y: 566 },
  'arka-tampon': { x: 200, y: 628 },
}

export default function CarDiagram() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [hoveredWheel, setHoveredWheel] = useState<number | null>(null)
  const router = useRouter()

  const hoveredData = hovered ? zones.find((z) => z.id === hovered) : null

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative bg-dark-800 rounded-2xl p-6 md:p-10 border border-dark-700">
        {/* Tooltip */}
        {(hoveredData || hoveredWheel !== null) && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-primary-500 text-dark-900 font-semibold rounded-lg text-sm shadow-lg pointer-events-none animate-fadeIn whitespace-nowrap">
            {hoveredData
              ? hoveredData.label
              : hoveredWheel !== null
                ? wheels[hoveredWheel].label
                : ''}
          </div>
        )}

        <svg
          viewBox="0 0 400 680"
          className="w-full h-auto mx-auto"
          style={{ maxWidth: '400px' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="hoverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(249,172,27,0.5)" />
              <stop offset="100%" stopColor="rgba(249,172,27,0.25)" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(148,163,184,0.15)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.05)" />
            </linearGradient>
          </defs>

          {/* Car body shadow */}
          <path
            d="M 100,60 Q 200,38 300,60
               L 330,93 Q 348,170 345,267
               L 345,490 Q 330,580 298,613
               Q 200,645 104,613
               Q 72,580 60,490
               L 55,267 Q 52,170 70,93 Z"
            fill="rgba(0,0,0,0.3)"
            transform="translate(3,4)"
          />

          {/* Car body outline */}
          <path
            d="M 100,60 Q 200,38 300,60
               L 330,93 Q 348,170 345,267
               L 345,490 Q 330,580 298,613
               Q 200,645 104,613
               Q 72,580 60,490
               L 55,267 Q 52,170 70,93 Z"
            fill="url(#bodyGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Wheels */}
          {wheels.map((w, i) => {
            const isLeft = w.x < 200
            const wHovered = hoveredWheel === i
            const wx = isLeft ? w.x - 16 : w.x - 10
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredWheel(i)}
                onMouseLeave={() => setHoveredWheel(null)}
                onClick={() => router.push(`/parcalar/${w.cat}`)}
                style={{ cursor: 'pointer' }}
              >
                {/* Tire */}
                <rect
                  x={wx}
                  y={w.y - 35}
                  width="26"
                  height="70"
                  rx="8"
                  fill={wHovered ? 'rgba(249,172,27,0.2)' : '#0f172a'}
                  stroke={wHovered ? '#f9ac1b' : '#334155'}
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Rim */}
                <rect
                  x={wx + 4}
                  y={w.y - 22}
                  width="18"
                  height="44"
                  rx="5"
                  fill="none"
                  stroke={wHovered ? '#f9ac1b' : '#475569'}
                  strokeWidth="0.8"
                  pointerEvents="none"
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Rim center line */}
                <line
                  x1={wx + 13}
                  y1={w.y - 18}
                  x2={wx + 13}
                  y2={w.y + 18}
                  stroke={wHovered ? '#f9ac1b' : '#475569'}
                  strokeWidth="0.5"
                  pointerEvents="none"
                />
              </g>
            )
          })}

          {/* Interactive zones */}
          {zones.map((zone) => {
            const isHovered = hovered === zone.id
            return (
              <path
                key={zone.id}
                d={zone.path}
                fill={isHovered ? 'url(#hoverGrad)' : 'rgba(100,116,139,0.06)'}
                stroke={isHovered ? '#f9ac1b' : 'rgba(71,85,105,0.5)'}
                strokeWidth={isHovered ? '2' : '0.5'}
                filter={isHovered ? 'url(#glow)' : undefined}
                onMouseEnter={() => setHovered(zone.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push(`/parcalar/${zone.category}`)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              />
            )
          })}

          {/* Side mirrors */}
          <ellipse cx="48" cy="280" rx="10" ry="6" fill="#334155" stroke="#475569" strokeWidth="1" />
          <ellipse cx="352" cy="280" rx="10" ry="6" fill="#334155" stroke="#475569" strokeWidth="1" />

          {/* Glass highlights */}
          <path
            d="M 110,235 L 290,235 L 293,292 L 107,292 Z"
            fill="url(#glassGrad)"
            pointerEvents="none"
          />
          <path
            d="M 107,478 L 293,478 L 290,523 L 110,523 Z"
            fill="url(#glassGrad)"
            pointerEvents="none"
          />

          {/* Center lines */}
          <line x1="200" y1="100" x2="200" y2="220" stroke="rgba(71,85,105,0.3)" strokeWidth="0.5" pointerEvents="none" />
          <line x1="200" y1="540" x2="200" y2="585" stroke="rgba(71,85,105,0.3)" strokeWidth="0.5" pointerEvents="none" />

          {/* Zone labels */}
          {Object.entries(zoneLabelPositions).map(([id, pos]) => {
            const zone = zones.find((z) => z.id === id)
            if (!zone) return null
            const isActive = hovered === id
            return (
              <text
                key={id}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                fill={isActive ? '#f9ac1b' : 'rgba(148,163,184,0.5)'}
                fontSize={pos.fontSize || 11}
                fontWeight={isActive ? '600' : '400'}
                fontFamily="system-ui, sans-serif"
                pointerEvents="none"
                style={{ transition: 'fill 0.2s ease' }}
              >
                {zone.label}
              </text>
            )
          })}

          {/* Door labels */}
          {[
            { id: 'sol-on-kapi', x: 78, y: 330, rot: -90 },
            { id: 'sag-on-kapi', x: 322, y: 330, rot: 90 },
            { id: 'sol-arka-kapi', x: 78, y: 442, rot: -90 },
            { id: 'sag-arka-kapi', x: 322, y: 442, rot: 90 },
          ].map((d) => (
            <text
              key={d.id}
              x={d.x}
              y={d.y}
              textAnchor="middle"
              fill={hovered === d.id ? '#f9ac1b' : 'rgba(148,163,184,0.35)'}
              fontSize="8"
              fontFamily="system-ui, sans-serif"
              pointerEvents="none"
              transform={`rotate(${d.rot},${d.x},${d.y})`}
              style={{ transition: 'fill 0.2s ease' }}
            >
              Kapı
            </text>
          ))}

          {/* Headlight indicators */}
          <circle cx="110" cy="70" r="3.5" fill={hovered === 'sol-far' ? '#f9ac1b' : 'rgba(226,232,240,0.25)'} pointerEvents="none" style={{ transition: 'fill 0.2s ease' }} />
          <circle cx="290" cy="70" r="3.5" fill={hovered === 'sag-far' ? '#f9ac1b' : 'rgba(226,232,240,0.25)'} pointerEvents="none" style={{ transition: 'fill 0.2s ease' }} />

          {/* Tail light indicators */}
          <circle cx="130" cy="600" r="3.5" fill={hovered === 'sol-stop' ? '#f9ac1b' : 'rgba(239,68,68,0.3)'} pointerEvents="none" style={{ transition: 'fill 0.2s ease' }} />
          <circle cx="270" cy="600" r="3.5" fill={hovered === 'sag-stop' ? '#f9ac1b' : 'rgba(239,68,68,0.3)'} pointerEvents="none" style={{ transition: 'fill 0.2s ease' }} />

          {/* Plaka area hint */}
          <rect x="170" y="595" width="60" height="12" rx="2" fill="none" stroke="rgba(71,85,105,0.3)" strokeWidth="0.5" pointerEvents="none" />
        </svg>

        <p className="text-center text-gray-500 text-xs mt-3">
          Araç üzerinde bir bölgeye tıklayın → ilgili parça kategorisine gidin
        </p>
      </div>
    </div>
  )
}
