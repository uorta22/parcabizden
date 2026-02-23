'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Car, LogIn, AlertTriangle, Clock, Gauge } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import GarageCard from '@/components/GarageCard'
import AddVehicleModal from '@/components/AddVehicleModal'
import type { GarageVehicleNatro } from '@/types/api'
import { garageList, garageAdd, garageRemove } from '@/lib/api'
import { loadVehicleTree, findVehicleImage } from '@/lib/vehicleImage'

type VehicleTree = Awaited<ReturnType<typeof loadVehicleTree>>

export default function GarajPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [vehicles, setVehicles] = useState<GarageVehicleNatro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [tree, setTree] = useState<VehicleTree | null>(null)

  useEffect(() => {
    // Load vehicle tree in parallel with garage list
    loadVehicleTree().then(setTree).catch(() => {})
  }, [])

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
    nickname?: string
  }) => {
    await garageAdd(data)
    const updated = await garageList()
    setVehicles(updated.vehicles)
  }

  const handleRemoveVehicle = async (id: number) => {
    if (!confirm('Bu araci garajdan silmek istediginize emin misiniz?')) return
    await garageRemove(id)
    setVehicles((prev) => prev.filter((v) => v.id !== id))
  }

  // Compute stats
  const stats = useMemo(() => {
    const totalVehicles = vehicles.length
    const totalUpcoming = vehicles.reduce((s, v) => s + v.upcoming_count, 0)
    const totalOverdue = vehicles.reduce((s, v) => s + v.overdue_count, 0)
    return { totalVehicles, totalUpcoming, totalOverdue }
  }, [vehicles])

  // Compute vehicle images
  const vehicleImages = useMemo(() => {
    if (!tree) return {}
    const map: Record<number, string | null> = {}
    for (const v of vehicles) {
      map[v.id] = findVehicleImage(tree, v.brand_slug, v.generation_slug)
    }
    return map
  }, [tree, vehicles])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Garajima Erisin</h1>
            <p className="text-gray-500 mb-8">
              Araclarinizi kaydedin, hizlica parca arayin. Garajiniza erismek icin giris yapin.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/giris"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
              >
                <LogIn className="w-5 h-5" />
                Giris Yap
              </Link>
              <Link
                href="/kayit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all border border-gray-200"
              >
                Kayit Ol
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Garajim</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Garajim</h1>
            <p className="text-gray-500">Kayitli araclarinizi yonetin</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Arac Ekle</span>
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
                <p className="text-xs text-gray-500">Toplam Arac</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUpcoming}</p>
                <p className="text-xs text-gray-500">Yaklasan Bakim</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOverdue}</p>
                <p className="text-xs text-gray-500">Gecikmis Bakim</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Garajiniz Bos</h2>
            <p className="text-gray-500 mb-6">
              Arac ekleyerek hizlica parca aramasi yapabilirsiniz.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Ilk Aracinizi Ekleyin
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  )
}
