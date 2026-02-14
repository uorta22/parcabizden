'use client'

import { memo } from 'react'
import { Trash2, Search, Calendar, Car } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { GarageVehicle } from '@/types/api'

interface GarageCardProps {
  vehicle: GarageVehicle
  onRemove: (id: number) => void
}

function GarageCard({ vehicle, onRemove }: GarageCardProps) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {vehicle.brand_logo ? (
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center p-1.5">
              <Image
                src={`/brands/${vehicle.brand_logo}`}
                alt={vehicle.brand_name}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Car className="w-6 h-6 text-primary-500" />
            </div>
          )}
          <div>
            <h3 className="text-white font-semibold group-hover:text-primary-500 transition-colors">
              {vehicle.brand_name} {vehicle.model_name}
            </h3>
            {vehicle.nickname && (
              <p className="text-primary-500 text-xs font-medium">{vehicle.nickname}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onRemove(vehicle.id)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          title="Garajdan Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-dark-700 rounded text-gray-400 text-xs">
          <Calendar className="w-3 h-3" />
          {vehicle.year}
        </span>
        {vehicle.segment_name && (
          <span className="px-2 py-1 bg-dark-700 rounded text-gray-400 text-xs">
            {vehicle.segment_name}
          </span>
        )}
        {vehicle.body_type && (
          <span className="px-2 py-1 bg-dark-700 rounded text-gray-400 text-xs">
            {vehicle.body_type}
          </span>
        )}
        {vehicle.engine_type && (
          <span className="px-2 py-1 bg-dark-700 rounded text-gray-400 text-xs">
            {vehicle.engine_type}
          </span>
        )}
      </div>

      <Link
        href={`/parcalar?marka=${encodeURIComponent(vehicle.brand_name)}&model=${encodeURIComponent(vehicle.model_name)}&yil=${vehicle.year}`}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-500/10 hover:bg-primary-500 text-primary-500 hover:text-dark-900 rounded-lg transition-all text-sm font-medium"
      >
        <Search className="w-4 h-4" />
        Parça Ara
      </Link>
    </div>
  )
}

export default memo(GarageCard)
