'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Car, AlertTriangle, Clock, Gauge } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import GarageCard from '@/components/GarageCard'
import AddVehicleModal from '@/components/AddVehicleModal'
import type { GarageVehicleNatro } from '@/types/api'
import { garageList, garageAdd, garageRemove } from '@/lib/api'
import { findAutodataGenerationImage } from '@/lib/vehicleImage'

export default function HesabimGarajPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<GarageVehicleNatro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [vehicleImages, setVehicleImages] = useState<Record<number, string | null>>({})

  useEffect(() => {
    if (user) {
      garageList()
        .then((res) => setVehicles(res.vehicles))
        .catch(() => {})
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [user])

  const handleAddVehicle = async (data: {
    brand_slug: string
    brand_name: string
    generation_slug: string
    generation_name: string
    year?: number
    nickname?: string
    spec_id?: number
  }) => {
    await garageAdd(data)
    const updated = await garageList()
    setVehicles(updated.vehicles)
  }

  const handleRemoveVehicle = async (id: number) => {
    if (!confirm('Bu aracı garajdan silmek istediğinize emin misiniz?')) return
    await garageRemove(id)
    setVehicles((prev) => prev.filter((v) => v.id !== id))
  }

  const stats = useMemo(() => {
    const totalVehicles = vehicles.length
    const totalUpcoming = vehicles.reduce((s, v) => s + v.upcoming_count, 0)
    const totalOverdue = vehicles.reduce((s, v) => s + v.overdue_count, 0)
    return { totalVehicles, totalUpcoming, totalOverdue }
  }, [vehicles])

  useEffect(() => {
    if (vehicles.length === 0) return
    let cancelled = false
    Promise.all(
      vehicles.map(async (v) => {
        const img = await findAutodataGenerationImage(v.brand_name, v.generation_name)
        return { id: v.id, img }
      })
    ).then((results) => {
      if (cancelled) return
      const map: Record<number, string | null> = {}
      for (const { id, img } of results) map[id] = img
      setVehicleImages(map)
    })
    return () => {
      cancelled = true
    }
  }, [vehicles])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Garajım</h1>
          <p className="text-gray-500 text-sm">Kayıtlı araçlarınızı yönetin</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Araç Ekle</span>
        </button>
      </div>

      {/* Dashboard Stats */}
      {!isLoading && vehicles.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Gauge className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
              <p className="text-xs text-gray-500">Toplam Araç</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUpcoming}</p>
              <p className="text-xs text-gray-500">Yaklaşan Bakım</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOverdue}</p>
              <p className="text-xs text-gray-500">Gecikmiş Bakım</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Car className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Garajınız Boş</h2>
          <p className="text-gray-500 mb-6">Araç ekleyerek hızlıca parça araması yapabilirsiniz.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            İlk Aracınızı Ekleyin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
          {vehicles.map((vehicle) => (
            <GarageCard
              key={vehicle.id}
              vehicle={vehicle}
              vehicleImage={vehicleImages[vehicle.id] ?? null}
              onRemove={handleRemoveVehicle}
            />
          ))}
        </div>
      )}

      <AddVehicleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddVehicle}
      />
    </div>
  )
}
