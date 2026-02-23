'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Car, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import GarageCard from '@/components/GarageCard'
import AddVehicleModal from '@/components/AddVehicleModal'
import type { GarageVehicleNatro } from '@/types/api'
import { garageList, garageAdd, garageRemove } from '@/lib/api'

export default function GarajPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [vehicles, setVehicles] = useState<GarageVehicleNatro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

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
    if (!confirm('Bu aracı garajdan silmek istediğinize emin misiniz?')) return
    await garageRemove(id)
    setVehicles((prev) => prev.filter((v) => v.id !== id))
  }

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
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Garajıma Erişin</h1>
            <p className="text-gray-500 mb-8">
              Araçlarınızı kaydedin, hızlıca parça arayın. Garajınıza erişmek için giriş yapın.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/giris"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
              >
                <LogIn className="w-5 h-5" />
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all border border-gray-200"
              >
                Kayıt Ol
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
          <span className="text-gray-900">Garajım</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Garajım</h1>
            <p className="text-gray-500">Kayıtlı araçlarınızı yönetin</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Araç Ekle
          </button>
        </div>

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
            <p className="text-gray-500 mb-6">
              Araç ekleyerek hızlıca parça araması yapabilirsiniz.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              İlk Aracınızı Ekleyin
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <GarageCard
                key={vehicle.id}
                vehicle={vehicle}
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
