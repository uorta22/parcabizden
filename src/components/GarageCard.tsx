'use client'

import { memo, useState } from 'react'
import { Trash2, Search, Wrench, MessageCircle, Car, Gauge, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import type { GarageVehicleNatro } from '@/types/api'
import { getWhatsAppUrl } from '@/lib/config'
import Badge from '@/components/Badge'

interface GarageCardProps {
  vehicle: GarageVehicleNatro
  vehicleImage: string | null
  onRemove: (id: number) => void
}

function GarageCard({ vehicle, vehicleImage, onRemove }: GarageCardProps) {
  const [imgError, setImgError] = useState(false)
  const partsHref = `/parcalar?brand=${encodeURIComponent(vehicle.brand_slug)}&gen=${encodeURIComponent(vehicle.generation_slug)}&marka=${encodeURIComponent(vehicle.brand_name)}&model_name=${encodeURIComponent(vehicle.generation_name)}`
  const detailHref = `/hesabim/garaj/${vehicle.id}`
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
    <Link href={detailHref} className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-400 hover:shadow-md transition-all group flex flex-col cursor-pointer">
      {/* Vehicle Image */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {vehicleImage && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={vehicleImage} alt={`${vehicle.brand_name} ${vehicle.generation_name}`} className="w-full h-full object-contain p-2" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <Car className="w-12 h-12 text-gray-300" />
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(vehicle.id) }}
          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all backdrop-blur-sm"
          title="Garajdan Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div>
          <h3 className="text-gray-900 font-semibold group-hover:text-primary-600 transition-colors leading-tight">
            {vehicle.year ? `${vehicle.year} ${vehicle.brand_name}` : vehicle.brand_name}
          </h3>
          <p className="text-gray-600 text-sm leading-tight mt-0.5 truncate">
            {vehicle.generation_name}
          </p>
          {vehicle.nickname && (
            <p className="text-primary-500 text-xs font-medium mt-1">&quot;{vehicle.nickname}&quot;</p>
          )}
        </div>

        {/* KM Info */}
        {vehicle.current_km !== null && (
          <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-600">
            <Gauge className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{formatKm(vehicle.current_km)} km</span>
            {kmAge && <span className="text-xs text-gray-400">({kmAge})</span>}
          </div>
        )}

        {/* Bakım durumu badge'leri */}
        {(vehicle.overdue_count > 0 || vehicle.upcoming_count > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {vehicle.overdue_count > 0 && (
              <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>
                {vehicle.overdue_count} gecikmiş
              </Badge>
            )}
            {vehicle.upcoming_count > 0 && (
              <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>
                {vehicle.upcoming_count} yaklaşıyor
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-auto pt-4">
          <Link
            href={partsHref}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-1 px-2 py-2 bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white rounded-lg transition-all text-xs font-medium"
          >
            <Search className="w-4 h-4" />
            Parca Ara
          </Link>
          <span
            className="flex flex-col items-center gap-1 px-2 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium"
          >
            <Wrench className="w-4 h-4" />
            Bakim
          </span>
          <a
            href={getWhatsAppUrl(whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-1 px-2 py-2 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-all text-xs font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Talep
          </a>
        </div>
      </div>
    </Link>
  )
}

export default memo(GarageCard)
