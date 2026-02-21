import React from 'react'
import {
  IconEngine,
  IconCarTurbine,
  IconGasStation,
  IconTestPipe,
  IconManualGearbox,
  IconDisc,
  IconCarFan,
  IconWheel,
  IconCarSuv,
  IconWiper,
  IconBulb,
  IconBatteryAutomotive,
  IconAirConditioning,
  IconArmchair,
  IconDeviceSpeaker,
  IconCarCrane,
  IconBox,
} from '@tabler/icons-react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyIcon = React.ComponentType<any>

export const CATEGORY_ICON_MAP: Record<string, AnyIcon> = {
  engine: IconEngine,
  turbo_intake: IconCarTurbine,
  fuel: IconGasStation,
  exhaust: IconTestPipe,
  transmission: IconManualGearbox,
  brake: IconDisc,
  suspension: IconCarFan,
  wheel_tyre: IconWheel,
  body_exterior: IconCarSuv,
  glass_mirror: IconWiper,
  lighting: IconBulb,
  electrical: IconBatteryAutomotive,
  climate: IconAirConditioning,
  interior: IconArmchair,
  audio_media: IconDeviceSpeaker,
  tow_transport: IconCarCrane,
  other: IconBox,
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

export function CategoryIcon({ id, className, size = 20, stroke = 1.8 }: { id: string; className?: string; size?: number; stroke?: number }) {
  const Icon = CATEGORY_ICON_MAP[id] || CATEGORY_ICON_MAP.other
  return <Icon className={className} size={size} stroke={stroke} />
}

export function getCategoryColor(id: string) {
  return CATEGORY_COLORS[id] || CATEGORY_COLORS.other
}
