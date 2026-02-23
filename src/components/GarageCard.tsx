'use client'

import { memo } from 'react'
import { Trash2, Search, Car } from 'lucide-react'
import Link from 'next/link'
import type { GarageVehicleNatro } from '@/types/api'

interface GarageCardProps {
  vehicle: GarageVehicleNatro
  onRemove: (id: number) => void
}

function GarageCard({ vehicle, onRemove }: GarageCardProps) {
  const partsHref = `/parcalar?brand=${encodeURIComponent(vehicle.brand_slug)}&gen=${encodeURIComponent(vehicle.generation_slug)}`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-400 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Car className="w-6 h-6 text-primary-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-gray-900 font-semibold group-hover:text-primary-600 transition-colors leading-tight">
              {vehicle.brand_name}
            </h3>
            <p className="text-gray-600 text-sm leading-tight mt-0.5 truncate">
              {vehicle.generation_name}
            </p>
            {vehicle.nickname && (
              <p className="text-primary-500 text-xs font-medium mt-1">{vehicle.nickname}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onRemove(vehicle.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
          title="Garajdan Sil"
          aria-label={`${vehicle.brand_name} ${vehicle.generation_name} aracını garajdan sil`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-full text-gray-600 text-xs font-medium">
          {vehicle.brand_name}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 bg-primary-50 rounded-full text-primary-700 text-xs font-medium">
          {vehicle.generation_name}
        </span>
      </div>

      <Link
        href={partsHref}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white rounded-lg transition-all text-sm font-medium border border-primary-100 hover:border-primary-500"
      >
        <Search className="w-4 h-4" />
        Parça Ara
      </Link>
    </div>
  )
}

export default memo(GarageCard)
