'use client'

import { memo } from 'react'
import { Trash2, Search, Wrench, MessageCircle, Car, Gauge, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { GarageVehicleNatro } from '@/types/api'
import { getWhatsAppUrl } from '@/lib/config'

interface GarageCardProps {
  vehicle: GarageVehicleNatro
  vehicleImage: string | null
  onRemove: (id: number) => void
}

function GarageCard({ vehicle, vehicleImage, onRemove }: GarageCardProps) {
  const partsHref = `/parcalar?brand=${encodeURIComponent(vehicle.brand_slug)}&gen=${encodeURIComponent(vehicle.generation_slug)}`
  const detailHref = `/garaj/${vehicle.id}`
  const whatsappMsg = `Merhaba, ${vehicle.brand_name} ${vehicle.generation_name} aracim icin yardim istiyorum.`

  const formatKm = (km: number) => km.toLocaleString('tr-TR')

  const kmAge = vehicle.km_updated_at
    ? (() => {
        const diff = Date.now() - new Date(vehicle.km_updated_at).getTime()
        const days = Math.floor(diff / 86400000)
        if (days === 0) return 'bugun'
        if (days === 1) return 'dun'
        if (days < 30) return `${days} gun once`
        return `${Math.floor(days / 30)} ay once`
      })()
    : null

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-400 hover:shadow-md transition-all group">
      {/* Vehicle Image */}
      <div className="relative h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        {vehicleImage ? (
          <Image src={vehicleImage} alt={`${vehicle.brand_name} ${vehicle.generation_name}`} fill className="object-contain p-4" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <Car className="w-16 h-16 text-gray-300" />
        )}
        <button
          onClick={() => onRemove(vehicle.id)}
          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all backdrop-blur-sm"
          title="Garajdan Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <Link href={detailHref} className="block">
          <h3 className="text-gray-900 font-semibold group-hover:text-primary-600 transition-colors leading-tight">
            {vehicle.brand_name}
          </h3>
          <p className="text-gray-600 text-sm leading-tight mt-0.5 truncate">
            {vehicle.generation_name}
          </p>
          {vehicle.nickname && (
            <p className="text-primary-500 text-xs font-medium mt-1">&quot;{vehicle.nickname}&quot;</p>
          )}
        </Link>

        {/* KM Info */}
        {vehicle.current_km !== null && (
          <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-600">
            <Gauge className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{formatKm(vehicle.current_km)} km</span>
            {kmAge && <span className="text-xs text-gray-400">({kmAge})</span>}
          </div>
        )}

        {/* Maintenance Badges */}
        {(vehicle.overdue_count > 0 || vehicle.upcoming_count > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {vehicle.overdue_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                {vehicle.overdue_count} gecikmi\u015f
              </span>
            )}
            {vehicle.upcoming_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                <Clock className="w-3 h-3" />
                {vehicle.upcoming_count} yakla\u015f\u0131yor
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Link
            href={partsHref}
            className="flex flex-col items-center gap-1 px-2 py-2 bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white rounded-lg transition-all text-xs font-medium"
          >
            <Search className="w-4 h-4" />
            Parca Ara
          </Link>
          <Link
            href={detailHref}
            className="flex flex-col items-center gap-1 px-2 py-2 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg transition-all text-xs font-medium"
          >
            <Wrench className="w-4 h-4" />
            Bakim
          </Link>
          <a
            href={getWhatsAppUrl(whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 px-2 py-2 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-all text-xs font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Talep
          </a>
        </div>
      </div>
    </div>
  )
}

export default memo(GarageCard)
