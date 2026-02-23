'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { MAINTENANCE_TYPES, addMonths, getMaintenanceTypeByKey } from '@/lib/maintenance'
import type { MaintenanceRecord } from '@/types/api'

interface MaintenanceFormProps {
  garageId: number
  currentKm: number | null
  record?: MaintenanceRecord | null
  onSave: (data: {
    garage_id: number
    maintenance_type: string
    done_km?: number
    done_date?: string
    next_km?: number
    next_date?: string
    notes?: string
  }) => Promise<void>
  onCancel: () => void
}

export default function MaintenanceForm({ garageId, currentKm, record, onSave, onCancel }: MaintenanceFormProps) {
  const [maintenanceType, setMaintenanceType] = useState(record?.maintenance_type || '')
  const [doneKm, setDoneKm] = useState(record?.done_km?.toString() || currentKm?.toString() || '')
  const [doneDate, setDoneDate] = useState(record?.done_date || new Date().toISOString().split('T')[0])
  const [nextKm, setNextKm] = useState(record?.next_km?.toString() || '')
  const [nextDate, setNextDate] = useState(record?.next_date || '')
  const [notes, setNotes] = useState(record?.notes || '')
  const [saving, setSaving] = useState(false)

  // Auto-calculate next_km and next_date when type or done values change
  useEffect(() => {
    if (record) return // Don't auto-calculate in edit mode
    const mt = getMaintenanceTypeByKey(maintenanceType)
    if (!mt) return

    if (doneKm) {
      setNextKm(String(parseInt(doneKm) + mt.defaultIntervalKm))
    }
    if (doneDate) {
      setNextDate(addMonths(new Date(doneDate), mt.defaultIntervalMonths))
    }
  }, [maintenanceType, doneKm, doneDate, record])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!maintenanceType) return
    setSaving(true)
    try {
      await onSave({
        garage_id: garageId,
        maintenance_type: maintenanceType,
        done_km: doneKm ? parseInt(doneKm) : undefined,
        done_date: doneDate || undefined,
        next_km: nextKm ? parseInt(nextKm) : undefined,
        next_date: nextDate || undefined,
        notes: notes || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {record ? 'Bakim Kaydini Duzenle' : 'Bakim Kaydi Ekle'}
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bakim Tipi</label>
            <select
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Seciniz...</option>
              {MAINTENANCE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yapildigi KM</label>
              <input
                type="number"
                value={doneKm}
                onChange={(e) => setDoneKm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="orn. 45000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yapildigi Tarih</label>
              <input
                type="date"
                value={doneDate}
                onChange={(e) => setDoneDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sonraki KM</label>
              <input
                type="number"
                value={nextKm}
                onChange={(e) => setNextKm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="orn. 55000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sonraki Tarih</label>
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Not (opsiyonel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Ek notlar..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Iptal
            </button>
            <button
              type="submit"
              disabled={saving || !maintenanceType}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
