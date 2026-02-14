'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Car, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import GarageCard from '@/components/GarageCard'
import AddVehicleModal from '@/components/AddVehicleModal'
import type { GarageVehicle } from '@/types/api'
import * as api from '@/lib/api'

export default function GarajPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (user) {
      api.getGarageVehicles()
        .then(setVehicles)
        .catch(() => {})
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [user])

  const handleAddVehicle = async (data: { brand_id: number; model_id: number; segment_id?: number; year: number; nickname?: string }) => {
    await api.addGarageVehicle(data)
    const updated = await api.getGarageVehicles()
    setVehicles(updated)
  }

  const handleRemoveVehicle = async (id: number) => {
    if (!confirm('Bu aracı garajdan silmek istediğinize emin misiniz?')) return
    await api.removeGarageVehicle(id)
    setVehicles(vehicles.filter(v => v.id !== id))
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
            <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Garajıma Erişin</h1>
            <p className="text-gray-400 mb-8">
              Araçlarınızı kaydedin, hızlıca parça arayın. Garajınıza erişmek için giriş yapın.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/giris"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-lg transition-all"
              >
                <LogIn className="w-5 h-5" />
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-all border border-dark-600"
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
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Garajım</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Garajım</h1>
            <p className="text-gray-400">Kayıtlı araçlarınızı yönetin</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-lg transition-all"
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
            <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Garajınız Boş</h2>
            <p className="text-gray-400 mb-6">
              Araç ekleyerek hızlıca parça araması yapabilirsiniz.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-lg transition-all"
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
