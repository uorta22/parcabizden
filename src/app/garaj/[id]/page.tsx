'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronRight, Car, Search, MessageCircle, Wrench, Plus,
  Gauge, StickyNote, Pencil, Trash2, Save, Cog, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import MaintenanceForm from '@/components/MaintenanceForm'
import type { GarageVehicleNatro, MaintenanceRecord, VehicleSpecRow } from '@/types/api'
import {
  garageList, garageUpdate, maintenanceList, maintenanceAdd,
  maintenanceUpdate, maintenanceRemove, fetchVehicleSpecs,
} from '@/lib/api'
import {
  getMaintenanceStatus, getStatusColor, getStatusLabel,
  getMaintenanceLabel,
} from '@/lib/maintenance'
import { loadVehicleTree, findVehicleImage } from '@/lib/vehicleImage'
import { getWhatsAppUrl } from '@/lib/config'

export default function GarageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const garageId = Number(params.id)

  const [vehicle, setVehicle] = useState<GarageVehicleNatro | null>(null)
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [vehicleImage, setVehicleImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Editable fields
  const [editingKm, setEditingKm] = useState(false)
  const [kmValue, setKmValue] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameValue, setNicknameValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Vehicle specs
  const [specs, setSpecs] = useState<VehicleSpecRow[]>([])
  const [selectedSpec, setSelectedSpec] = useState<VehicleSpecRow | null>(null)
  const [specsLoading, setSpecsLoading] = useState(false)
  const [showSpecPicker, setShowSpecPicker] = useState(false)

  // Maintenance form
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [garageRes, treeData] = await Promise.all([
        garageList(),
        loadVehicleTree().catch(() => null),
      ])
      const v = garageRes.vehicles.find(v => v.id === garageId)
      if (!v) { router.push('/garaj'); return }
      setVehicle(v)
      setKmValue(v.current_km?.toString() || '')
      setNotesValue(v.notes || '')
      setNicknameValue(v.nickname || '')

      if (treeData) {
        setVehicleImage(findVehicleImage(treeData, v.brand_slug, v.generation_slug))
      }

      const mRes = await maintenanceList(garageId)
      setRecords(mRes.records)

      // Load vehicle specs
      setSpecsLoading(true)
      try {
        // Extract platform code from generation_name for better matching
        const genName = v.generation_name
        const res = await fetchVehicleSpecs(v.brand_slug, genName, v.year ?? undefined)
        if (res.specs.length > 0) {
          setSpecs(res.specs)
          // If vehicle has spec_id, find it; otherwise select first
          if (v.spec_id) {
            const matched = res.specs.find(s => s.id === v.spec_id)
            setSelectedSpec(matched || res.specs[0])
          } else {
            setSelectedSpec(res.specs[0])
          }
        }
      } catch {
        // Specs not available, that's ok
      } finally {
        setSpecsLoading(false)
      }
    } catch {
      router.push('/garaj')
    } finally {
      setLoading(false)
    }
  }, [garageId, router])

  useEffect(() => {
    if (user) loadData()
    else if (!authLoading) router.push('/giris')
  }, [user, authLoading, loadData, router])

  const handleSaveKm = async () => {
    if (!kmValue || !vehicle) return
    setSaving(true)
    try {
      await garageUpdate({ id: garageId, current_km: parseInt(kmValue) })
      setVehicle({ ...vehicle, current_km: parseInt(kmValue), km_updated_at: new Date().toISOString() })
      setEditingKm(false)
    } finally { setSaving(false) }
  }

  const handleSaveNotes = async () => {
    if (!vehicle) return
    setSaving(true)
    try {
      await garageUpdate({ id: garageId, notes: notesValue })
      setVehicle({ ...vehicle, notes: notesValue || null })
      setEditingNotes(false)
    } finally { setSaving(false) }
  }

  const handleSaveNickname = async () => {
    if (!vehicle) return
    setSaving(true)
    try {
      await garageUpdate({ id: garageId, nickname: nicknameValue })
      setVehicle({ ...vehicle, nickname: nicknameValue || null })
      setEditingNickname(false)
    } finally { setSaving(false) }
  }

  const handleAddMaintenance = async (data: {
    garage_id: number
    maintenance_type: string
    done_km?: number
    done_date?: string
    next_km?: number
    next_date?: string
    notes?: string
  }) => {
    await maintenanceAdd(data)
    const mRes = await maintenanceList(garageId)
    setRecords(mRes.records)
    setShowForm(false)
    // Refresh vehicle stats
    const gRes = await garageList()
    const v = gRes.vehicles.find(v => v.id === garageId)
    if (v) setVehicle(v)
  }

  const handleUpdateMaintenance = async (data: {
    garage_id: number
    maintenance_type: string
    done_km?: number
    done_date?: string
    next_km?: number
    next_date?: string
    notes?: string
  }) => {
    if (!editRecord) return
    await maintenanceUpdate({
      id: editRecord.id,
      maintenance_type: data.maintenance_type,
      done_km: data.done_km ?? null,
      done_date: data.done_date ?? null,
      next_km: data.next_km ?? null,
      next_date: data.next_date ?? null,
      notes: data.notes ?? null,
    })
    const mRes = await maintenanceList(garageId)
    setRecords(mRes.records)
    setEditRecord(null)
    setShowForm(false)
    const gRes = await garageList()
    const v = gRes.vehicles.find(v => v.id === garageId)
    if (v) setVehicle(v)
  }

  const handleDeleteMaintenance = async (id: number) => {
    if (!confirm('Bu bakim kaydini silmek istediginize emin misiniz?')) return
    await maintenanceRemove(id)
    setRecords(prev => prev.filter(r => r.id !== id))
    const gRes = await garageList()
    const v = gRes.vehicles.find(v => v.id === garageId)
    if (v) setVehicle(v)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!vehicle) return null

  const partsHref = `/parcalar?brand=${encodeURIComponent(vehicle.brand_slug)}&gen=${encodeURIComponent(vehicle.generation_slug)}&marka=${encodeURIComponent(vehicle.brand_name)}&model_name=${encodeURIComponent(vehicle.generation_name)}`
  const whatsappMsg = `Merhaba, ${vehicle.brand_name} ${vehicle.generation_name} aracim icin yardim istiyorum.`

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/garaj" className="hover:text-gray-900 transition-colors">Garajim</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{vehicle.year ? `${vehicle.year} ` : ''}{vehicle.brand_name} {vehicle.generation_name}</span>
        </nav>

        {/* Vehicle Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="md:flex">
            <div className="md:w-72 h-48 md:h-auto bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative flex-shrink-0">
              {vehicleImage ? (
                <Image src={vehicleImage} alt={vehicle.brand_name} fill className="object-contain p-6" sizes="300px" />
              ) : (
                <Car className="w-20 h-20 text-gray-300" />
              )}
            </div>
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{vehicle.year ? `${vehicle.year} ${vehicle.brand_name}` : vehicle.brand_name}</h1>
                  <p className="text-gray-600 mt-0.5">{vehicle.generation_name}</p>
                </div>
              </div>

              {/* Nickname */}
              <div className="mt-4">
                {editingNickname ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nicknameValue}
                      onChange={(e) => setNicknameValue(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Takma ad verin..."
                    />
                    <button onClick={handleSaveNickname} disabled={saving} className="p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingNickname(false); setNicknameValue(vehicle.nickname || '') }} className="p-1.5 text-gray-400 hover:text-gray-600">
                      &times;
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingNickname(true)} className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    {vehicle.nickname ? `"${vehicle.nickname}"` : 'Takma ad ekle'}
                  </button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-5">
                <Link href={partsHref} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white rounded-lg transition-all text-sm font-medium">
                  <Search className="w-4 h-4" /> Parca Ara
                </Link>
                <a href={getWhatsAppUrl(whatsappMsg)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-all text-sm font-medium">
                  <MessageCircle className="w-4 h-4" /> WhatsApp Talep
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Teknik Özellikler Section */}
        {(specsLoading || specs.length > 0) && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Cog className="w-5 h-5 text-gray-400" /> Teknik Ozellikler
              </h2>
              {specs.length > 1 && (
                <button
                  onClick={() => setShowSpecPicker(!showSpecPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                >
                  <span className="truncate max-w-[200px]">{selectedSpec?.modification || 'Motor secin'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSpecPicker ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Modification Picker */}
            {showSpecPicker && specs.length > 1 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Motor varyantini secin:</p>
                <div className="flex flex-wrap gap-2">
                  {specs.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSpec(s); setShowSpecPicker(false) }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedSpec?.id === s.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {s.modification}
                      {s.power_hp && <span className="ml-1 opacity-75">({s.power_hp} HP)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {specsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedSpec ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedSpec.engine_cc && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Motor</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSpec.engine_cc} cc
                      {selectedSpec.cylinders && <span className="text-gray-500 font-normal"> / {selectedSpec.cylinders} silindir</span>}
                    </p>
                  </div>
                )}
                {selectedSpec.power_hp && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Guc</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.power_hp} HP</p>
                  </div>
                )}
                {selectedSpec.torque_nm && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tork</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.torque_nm} Nm</p>
                  </div>
                )}
                {selectedSpec.fuel_type && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Yakit</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.fuel_type}</p>
                  </div>
                )}
                {selectedSpec.transmission && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Sanziman</p>
                    <p className="text-sm font-semibold text-gray-900 truncate" title={selectedSpec.transmission}>{selectedSpec.transmission}</p>
                  </div>
                )}
                {selectedSpec.drivetrain && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Cekis</p>
                    <p className="text-sm font-semibold text-gray-900 truncate" title={selectedSpec.drivetrain}>{selectedSpec.drivetrain}</p>
                  </div>
                )}
                {selectedSpec.accel_0_100 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">0-100 km/s</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.accel_0_100} sn</p>
                  </div>
                )}
                {selectedSpec.top_speed_kmh && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Max Hiz</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.top_speed_kmh} km/s</p>
                  </div>
                )}
                {selectedSpec.fuel_combined && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Yakit Tuketimi</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.fuel_combined} L/100km</p>
                  </div>
                )}
                {(selectedSpec.length_mm || selectedSpec.width_mm || selectedSpec.height_mm) && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Boyutlar (U×G×Y)</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSpec.length_mm || '—'}×{selectedSpec.width_mm || '—'}×{selectedSpec.height_mm || '—'} mm
                    </p>
                  </div>
                )}
                {selectedSpec.wheelbase_mm && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Aks Araligi</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.wheelbase_mm} mm</p>
                  </div>
                )}
                {selectedSpec.weight_kg && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Agirlik</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.weight_kg} kg</p>
                  </div>
                )}
                {selectedSpec.trunk_liters && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Bagaj</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.trunk_liters} L</p>
                  </div>
                )}
                {selectedSpec.fuel_tank_liters && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Yakit Deposu</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpec.fuel_tank_liters} L</p>
                  </div>
                )}
              </div>
            ) : null}

            {selectedSpec && (
              <p className="text-[10px] text-gray-400 mt-3">
                {selectedSpec.model} {selectedSpec.generation}
                {selectedSpec.year_start && ` (${selectedSpec.year_start}${selectedSpec.year_end ? `–${selectedSpec.year_end}` : '–'})`}
                {' '}&middot; Kaynak: auto-data.net
              </p>
            )}
          </div>
        )}

        {/* KM Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-gray-400" /> Kilometre
            </h2>
          </div>
          {editingKm ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={kmValue}
                onChange={(e) => setKmValue(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-40"
                placeholder="orn. 45000"
              />
              <span className="text-gray-500 text-sm">km</span>
              <button onClick={handleSaveKm} disabled={saving || !kmValue} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50">
                {saving ? '...' : 'Kaydet'}
              </button>
              <button onClick={() => { setEditingKm(false); setKmValue(vehicle.current_km?.toString() || '') }} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
                Iptal
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {vehicle.current_km !== null ? (
                <span className="text-2xl font-bold text-gray-900">{vehicle.current_km.toLocaleString('tr-TR')} km</span>
              ) : (
                <span className="text-gray-400">Henuz girilmedi</span>
              )}
              <button onClick={() => setEditingKm(true)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
          {vehicle.km_updated_at && !editingKm && (
            <p className="text-xs text-gray-400 mt-1">Son guncelleme: {new Date(vehicle.km_updated_at).toLocaleDateString('tr-TR')}</p>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-gray-400" /> Notlar
            </h2>
            {!editingNotes && (
              <button onClick={() => setEditingNotes(true)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {editingNotes ? (
            <div>
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                placeholder="Plaka, sigorta tarihi, muayene tarihi vb. notlar..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveNotes} disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50">
                  {saving ? '...' : 'Kaydet'}
                </button>
                <button onClick={() => { setEditingNotes(false); setNotesValue(vehicle.notes || '') }} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
                  Iptal
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {vehicle.notes || <span className="text-gray-400">Henuz not eklenmedi. Plaka, sigorta tarihi vb. bilgileri buraya yazabilirsiniz.</span>}
            </p>
          )}
        </div>

        {/* Maintenance Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-gray-400" /> Bakim Kayitlari
            </h2>
            <button
              onClick={() => { setEditRecord(null); setShowForm(true) }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Bakim Ekle
            </button>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-10">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Henuz bakim kaydi yok.</p>
              <p className="text-gray-400 text-xs mt-1">Bakim gecmisini takip etmek icin kayit ekleyin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const status = getMaintenanceStatus(vehicle.current_km, record.next_km, record.next_date)
                return (
                  <div key={record.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-gray-900 text-sm">{getMaintenanceLabel(record.maintenance_type)}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          {record.done_km !== null && <span>Yapildigi: {record.done_km.toLocaleString('tr-TR')} km</span>}
                          {record.done_date && <span>{new Date(record.done_date).toLocaleDateString('tr-TR')}</span>}
                          {record.next_km !== null && <span>Sonraki: {record.next_km.toLocaleString('tr-TR')} km</span>}
                          {record.next_date && <span>{new Date(record.next_date).toLocaleDateString('tr-TR')}</span>}
                        </div>
                        {record.notes && <p className="text-xs text-gray-400 mt-1">{record.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button
                          onClick={() => { setEditRecord(record); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Duzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaintenance(record.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Form Modal */}
      {showForm && (
        <MaintenanceForm
          garageId={garageId}
          currentKm={vehicle.current_km}
          record={editRecord}
          onSave={editRecord ? handleUpdateMaintenance : handleAddMaintenance}
          onCancel={() => { setShowForm(false); setEditRecord(null) }}
        />
      )}
    </div>
  )
}
