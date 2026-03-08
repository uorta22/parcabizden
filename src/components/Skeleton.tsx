// Skeleton yükleme bileşenleri — animasyonlu yer tutucu sistemi

// Sınıf birleştirici yardımcı — harici bağımlılık gerektirmez
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- Temel Skeleton Props ---
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

/**
 * Temel dikdörtgen skeleton bileşeni.
 * width ve height Tailwind sınıfı veya inline stil olarak geçilebilir.
 */
export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded-lg", className)}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Dairesel skeleton bileşeni (avatar, ikon gibi alanlar için).
 * @param size - Piksel cinsinden genişlik ve yükseklik (varsayılan: 40)
 */
export function SkeletonCircle({ size = 40, className }: SkeletonCircleProps) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded-full flex-shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/**
 * ProductCard bileşeninin iskelet yükleyicisi.
 * Görsel alanı, kategori satırı, başlık satırları ve fiyat alanını taklit eder.
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      {/* Ürün görseli alanı — 4:3 oran */}
      <div className="aspect-[4/3] w-full">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* Kart içeriği */}
      <div className="p-4 space-y-3">
        {/* Kategori / marka satırı */}
        <Skeleton className="h-3 w-1/3" />

        {/* Başlık satırları */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Fiyat ve buton alanı */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * GenerationCard bileşeninin iskelet yükleyicisi.
 * Nesil seçici kartlarını (görsel, başlık, alt başlık, özellikler) taklit eder.
 */
export function GenerationCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      {/* Araç görseli alanı — 16:10 oran */}
      <div className="aspect-[16/10] w-full">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* Kart içeriği */}
      <div className="p-4 space-y-3">
        {/* Başlık (nesil adı) */}
        <Skeleton className="h-5 w-3/5" />

        {/* Alt başlık (yıl aralığı vb.) */}
        <Skeleton className="h-3 w-2/5" />

        {/* Özellikler satırı */}
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
