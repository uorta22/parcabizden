import React from 'react'
import {
  Cog,
  Wind,
  Fuel,
  Pipette,
  SlidersHorizontal,
  Disc3,
  Gauge,
  Circle,
  Car,
  GlassWater,
  Lightbulb,
  BatteryCharging,
  Snowflake,
  Armchair,
  Speaker,
  Truck,
  Box,
} from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyIcon = React.ComponentType<any>

export const CATEGORY_ICON_MAP: Record<string, AnyIcon> = {
  engine: Cog,
  turbo_intake: Wind,
  fuel: Fuel,
  exhaust: Pipette,
  transmission: SlidersHorizontal,
  brake: Disc3,
  suspension: Gauge,
  wheel_tyre: Circle,
  body_exterior: Car,
  glass_mirror: GlassWater,
  lighting: Lightbulb,
  electrical: BatteryCharging,
  climate: Snowflake,
  interior: Armchair,
  audio_media: Speaker,
  tow_transport: Truck,
  other: Box,
}

export const CATEGORY_COLORS: Record<string, string> = {
  engine: 'from-red-500 to-orange-500',
  turbo_intake: 'from-sky-500 to-blue-500',
  fuel: 'from-amber-500 to-yellow-500',
  exhaust: 'from-gray-500 to-slate-500',
  transmission: 'from-blue-500 to-cyan-500',
  brake: 'from-purple-500 to-pink-500',
  suspension: 'from-green-500 to-emerald-500',
  wheel_tyre: 'from-gray-600 to-gray-500',
  body_exterior: 'from-yellow-500 to-orange-500',
  glass_mirror: 'from-teal-500 to-cyan-500',
  lighting: 'from-amber-400 to-yellow-500',
  electrical: 'from-cyan-500 to-blue-500',
  climate: 'from-indigo-500 to-blue-500',
  interior: 'from-violet-500 to-purple-500',
  audio_media: 'from-pink-500 to-rose-500',
  tow_transport: 'from-stone-500 to-gray-500',
  other: 'from-gray-500 to-gray-600',
}

export function CategoryIcon({ id, className, size = 20, strokeWidth = 1.8 }: { id: string; className?: string; size?: number; strokeWidth?: number }) {
  const Icon = CATEGORY_ICON_MAP[id] || CATEGORY_ICON_MAP.other
  return <Icon className={className} size={size} strokeWidth={strokeWidth} />
}

export function getCategoryColor(id: string) {
  return CATEGORY_COLORS[id] || CATEGORY_COLORS.other
}
