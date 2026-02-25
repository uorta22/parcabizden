'use client'

import { useCallback } from 'react'
import VehicleSelector from './VehicleSelector'
import type { VehicleSelection } from './VehicleSelector'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    brand_slug: string
    brand_name: string
    generation_slug: string
    generation_name: string
    year?: number
    nickname?: string
    spec_id?: number
  }) => Promise<void>
}

export default function AddVehicleModal({ isOpen, onClose, onAdd }: AddVehicleModalProps) {
  const handleSelect = useCallback(async (data: VehicleSelection) => {
    await onAdd({
      brand_slug: data.brand_slug,
      brand_name: data.brand_name,
      generation_slug: data.generation_slug || '',
      generation_name: data.generation_name,
      year: data.year,
      spec_id: data.spec_id,
    })
  }, [onAdd])

  return (
    <VehicleSelector
      mode="garage"
      isModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelect}
    />
  )
}
