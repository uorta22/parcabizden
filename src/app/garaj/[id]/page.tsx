'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronRight, Car, Search, MessageCircle, Wrench, Plus,
  Gauge, StickyNote, Pencil, Trash2, Save, Cog, Zap, Fuel,
  Settings2, Ruler, Hash, CreditCard, X,
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
import { findAutodataGenerationImage } from '@/lib/vehicleImage'
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
  const [editingPlaka, setEditingPlaka] = useState(false)
  const [plakaValue, setPlakaValue] = useState('')
  const [editingSase, setEditingSase] = useState(false)
  const [saseValue, setSaseValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Vehicle specs
  const [selectedSpec, setSelectedSpec] = useState<VehicleSpecRow | null>(null)
  const [specsLoading, setSpecsLoading] = useState(false)

  // Maintenance form
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null)

  const loadData = useCallback(async () => {
    try {
      const garageRes = await garageList()
      const v = garageRes.vehicles.find(v => v.id === garageId)
      if (!v) { router.push('/garaj'); return }
      setVehicle(v)
      setKmValue(v.current_km?.toString() || '')
      setNotesValue(v.notes || '')
      setNicknameValue(v.nickname || '')
      setPlakaValue(v.plaka || '')
      setSaseValue(v.sase_no || '')

      // Use same autodata image source as VehicleSelector
      findAutodataGenerationImage(v.brand_name, v.generation_name)
        .then(img => setVehicleImage(img))
        .catch(() => {})

      const mRes = await maintenanceList(garageId)
      setRecords(mRes.records)

      // Load vehicle specs
      setSpecsLoading(true)
      try {
        let res: { specs: VehicleSpecRow[]; models: unknown[]; brand: string }

        if (v.spec_id) {
          res = await fetchVehicleSpecs(v.brand_slug, undefined, undefined, undefined, v.spec_id)
        } else {
          const genName = v.generation_name
          const modelName = genName.replace(/\s*\(.*$/, '').trim()
          res = await fetchVehicleSpecs(v.brand_slug, genName, v.year ?? undefined)
          if (res.specs.length === 0 && modelName) {
            res = await fetchVehicleSpecs(v.brand_slug, undefined, v.year ?? undefined, modelName)
          }
        }

        if (res.specs.length > 0) {
          if (v.spec_id) {
            const matched = res.specs.find(s => s.id === v.spec_id)
            setSelectedSpec(matched || res.specs[0])
          } else {
            setSelectedSpec(res.specs[0])
          }
        }
      } catch {
        // Specs not available
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

  const handleSavePlaka = async () => {
    if (!vehicle) return
    setSaving(true)
    try {
      await garageUpdate({ id: garageId, plaka: plakaValue })
      setVehicle({ ...vehicle, plaka: plakaValue || null })
      setEditingPlaka(false)
    } finally { setSaving(false) }
  }

  const handleSaveSase = async () => {
    if (!vehicle) return
    setSaving(true)
    try {
      await garageUpdate({ id: garageId, sase_no: saseValue })
      setVehicle({ ...vehicle, sase_no: saseValue || null })
      setEditingSase(false)
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
    <div className="min-h-screen py-6 md:py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/garaj" className="hover:text-gray-900 transition-colors">Garajim</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{vehicle.year ? `${vehicle.year} ` : ''}{vehicle.brand_name} {vehicle.generation_name}</span>
        </nav>

        {/* ===== Araç Başlık Kartı (tam genişlik) ===== */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="md:flex">
            <div className="md:w-64 h-44 md:h-auto bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative flex-shrink-0">
              {vehicleImage ? (
                <Image src={vehicleImage} alt={vehicle.brand_name} fill className="object-contain p-5" sizes="260px" />
              ) : (
                <Car className="w-20 h-20 text-gray-300" />
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {vehicle.year ? `${vehicle.year} ${vehicle.brand_name}` : vehicle.brand_name}
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">{vehicle.generation_name}</p>
                  </div>
                  {/* Nickname inline */}
                  <div className="flex-shrink-0">
                    {editingNickname ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={nicknameValue}
                          onChange={(e) => setNicknameValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-32"
                          placeholder="Takma ad..."
                        />
                        <button onClick={handleSaveNickname} disabled={saving} className="p-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingNickname(false); setNicknameValue(vehicle.nickname || '') }} className="p-1 text-gray-400 hover:text-gray-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingNickname(true)} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-lg">
                        <Pencil className="w-3 h-3" />
                        {vehicle.nickname ? `"${vehicle.nickname}"` : 'Takma ad'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Modification badge */}
                {selectedSpec?.modification && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    <Cog className="w-3 h-3" />
                    {selectedSpec.modification}
                    {selectedSpec.power_hp && <span className="opacity-70">({selectedSpec.power_hp} HP)</span>}
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href={partsHref} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white rounded-lg transition-all text-sm font-medium">
                  <Search className="w-4 h-4" /> Parca Ara
                </Link>
                <a href={getWhatsAppUrl(whatsappMsg)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-all text-sm font-medium">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 2-Kolon Grid ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ── Sol Kolon: Araç Bilgileri ── */}
          <div className="space-y-6">
            {/* Araç Bilgileri Kartı */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-primary-500" /> Arac Bilgileri
              </h2>
              <div className="space-y-3">
                {/* Plaka */}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CreditCard className="w-4 h-4" /> Plaka
                  </div>
                  {editingPlaka ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={plakaValue}
                        onChange={(e) => setPlakaValue(e.target.value.toUpperCase())}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-36 uppercase"
                        placeholder="34 ABC 123"
                        maxLength={20}
                      />
                      <button onClick={handleSavePlaka} disabled={saving} className="p-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditingPlaka(false); setPlakaValue(vehicle.plaka || '') }} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {vehicle.plaka ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="bg-blue-700 text-white text-[10px] font-bold px-1 py-0.5 rounded leading-none">TR</span>
                          <span className="font-semibold text-sm text-gray-900">{vehicle.plaka}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Girilmedi</span>
                      )}
                      <button onClick={() => setEditingPlaka(true)} className="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Şase No */}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Hash className="w-4 h-4" /> Sase No
                  </div>
                  {editingSase ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={saseValue}
                        onChange={(e) => setSaseValue(e.target.value.toUpperCase())}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-44 uppercase font-mono"
                        placeholder="WBA12345678901234"
                        maxLength={17}
                      />
                      <button onClick={handleSaveSase} disabled={saving} className="p-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditingSase(false); setSaseValue(vehicle.sase_no || '') }} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {vehicle.sase_no ? (
                        <span className="font-mono text-sm text-gray-900">{vehicle.sase_no}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Girilmedi</span>
                      )}
                      <button onClick={() => setEditingSase(true)} className="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Kilometre */}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Gauge className="w-4 h-4" /> Kilometre
                  </div>
                  {editingKm ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={kmValue}
                        onChange={(e) => setKmValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-28"
                        placeholder="45000"
                      />
                      <span className="text-xs text-gray-400">km</span>
                      <button onClick={handleSaveKm} disabled={saving || !kmValue} className="p-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditingKm(false); setKmValue(vehicle.current_km?.toString() || '') }} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {vehicle.current_km !== null ? (
                        <span className="font-semibold text-sm text-gray-900">{vehicle.current_km.toLocaleString('tr-TR')} km</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Girilmedi</span>
                      )}
                      <button onClick={() => setEditingKm(true)} className="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {vehicle.km_updated_at && !editingKm && (
                  <p className="text-[10px] text-gray-400 -mt-2 pl-6">Son: {new Date(vehicle.km_updated_at).toLocaleDateString('tr-TR')}</p>
                )}
              </div>
            </div>

            {/* Notlar Kartı */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-amber-500" /> Notlar
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
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                    placeholder="Sigorta tarihi, muayene tarihi vb. notlar..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveNotes} disabled={saving} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50">
                      {saving ? '...' : 'Kaydet'}
                    </button>
                    <button onClick={() => { setEditingNotes(false); setNotesValue(vehicle.notes || '') }} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm">
                      Iptal
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {vehicle.notes || <span className="text-gray-400">Henuz not eklenmedi.</span>}
                </p>
              )}
            </div>
          </div>

          {/* ── Sağ Kolon: Teknik Özellikler ── */}
          <div>
            {(specsLoading || selectedSpec) && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Cog className="w-5 h-5 text-gray-500" /> Teknik Ozellikler
                </h2>

                {specsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : selectedSpec ? (
                  <div className="space-y-2.5">
                    {selectedSpec.engine_cc && (
                      <SpecRow icon={<Cog className="w-4 h-4" />} label="Motor" value={`${selectedSpec.engine_cc} cc${selectedSpec.cylinders ? ` / ${selectedSpec.cylinders} silindir` : ''}`} />
                    )}
                    {selectedSpec.power_hp && (
                      <SpecRow icon={<Zap className="w-4 h-4" />} label="Guc" value={`${selectedSpec.power_hp} HP`} />
                    )}
                    {selectedSpec.torque_nm && (
                      <SpecRow icon={<Zap className="w-4 h-4" />} label="Tork" value={`${selectedSpec.torque_nm} Nm`} />
                    )}
                    {selectedSpec.fuel_type && (
                      <SpecRow icon={<Fuel className="w-4 h-4" />} label="Yakit" value={selectedSpec.fuel_type} />
                    )}
                    {selectedSpec.transmission && (
                      <SpecRow icon={<Settings2 className="w-4 h-4" />} label="Sanziman" value={selectedSpec.transmission} />
                    )}
                    {selectedSpec.drivetrain && (
                      <SpecRow icon={<Settings2 className="w-4 h-4" />} label="Cekis" value={selectedSpec.drivetrain} />
                    )}
                    {selectedSpec.accel_0_100 && (
                      <SpecRow icon={<Gauge className="w-4 h-4" />} label="0-100 km/s" value={`${selectedSpec.accel_0_100} sn`} />
                    )}
                    {selectedSpec.top_speed_kmh && (
                      <SpecRow icon={<Gauge className="w-4 h-4" />} label="Max Hiz" value={`${selectedSpec.top_speed_kmh} km/s`} />
                    )}
                    {selectedSpec.fuel_combined && (
                      <SpecRow icon={<Fuel className="w-4 h-4" />} label="Yakit Tuketimi" value={`${selectedSpec.fuel_combined} L/100km`} />
                    )}
                    {(selectedSpec.length_mm || selectedSpec.width_mm || selectedSpec.height_mm) && (
                      <SpecRow icon={<Ruler className="w-4 h-4" />} label="Boyutlar" value={`${selectedSpec.length_mm || '—'}x${selectedSpec.width_mm || '—'}x${selectedSpec.height_mm || '—'} mm`} />
                    )}
                    {selectedSpec.wheelbase_mm && (
                      <SpecRow icon={<Ruler className="w-4 h-4" />} label="Aks Araligi" value={`${selectedSpec.wheelbase_mm} mm`} />
                    )}
                    {selectedSpec.weight_kg && (
                      <SpecRow icon={<Ruler className="w-4 h-4" />} label="Agirlik" value={`${selectedSpec.weight_kg} kg`} />
                    )}
                    {selectedSpec.trunk_liters && (
                      <SpecRow icon={<Ruler className="w-4 h-4" />} label="Bagaj" value={`${selectedSpec.trunk_liters} L`} />
                    )}
                    {selectedSpec.fuel_tank_liters && (
                      <SpecRow icon={<Fuel className="w-4 h-4" />} label="Yakit Deposu" value={`${selectedSpec.fuel_tank_liters} L`} />
                    )}

                    <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                      {selectedSpec.model} {selectedSpec.generation}
                      {selectedSpec.year_start && ` (${selectedSpec.year_start}${selectedSpec.year_end ? `–${selectedSpec.year_end}` : '–'})`}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* ===== Bakım Kayıtları (tam genişlik) ===== */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" /> Bakim Kayitlari
            </h2>
            <button
              onClick={() => { setEditRecord(null); setShowForm(true) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Bakim Ekle
            </button>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
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

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}
