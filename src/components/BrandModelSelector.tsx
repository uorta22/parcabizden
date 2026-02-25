'use client'

import VehicleSelector from './VehicleSelector'

export default function BrandModelSelector() {
  return (
    <VehicleSelector
      mode="browse"
      onSelect={() => {
        // Navigation is handled internally by VehicleSelector in browse mode
      }}
    />
  )
}
