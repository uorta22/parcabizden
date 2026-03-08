import React from 'react';

// Badge bileşeni için prop tipleri
interface BadgeProps {
  /** Rozet görünüm varyantı */
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  /** Rozet boyutu — varsayılan 'sm' */
  size?: 'sm' | 'md';
  /** İsteğe bağlı ikon (sol tarafta gösterilir) */
  icon?: React.ReactNode;
  /** Rozet içeriği */
  children: React.ReactNode;
}

// Varyanta göre renk sınıfları
const variantClasses: Record<BadgeProps['variant'], string> = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-orange-100 text-orange-700 border-orange-200',
  danger:  'bg-red-100 text-red-700 border-red-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
};

// Boyuta göre tipografi ve boşluk sınıfları
const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
};

// Temel stil — tüm varyantlarda ortak
const baseClasses = 'inline-flex items-center gap-1 rounded-full font-medium border';

/**
 * Badge — Durum veya kategori bilgisi gösteren küçük etiket bileşeni.
 *
 * @example
 * <Badge variant="success" icon={<CheckIcon />}>Stokta Var</Badge>
 * <Badge variant="warning" size="md">Az Kaldı</Badge>
 */
export default function Badge({
  variant,
  size = 'sm',
  icon,
  children,
}: BadgeProps) {
  return (
    <span
      className={[
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
      ].join(' ')}
    >
      {/* İkon varsa sol tarafta göster */}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
