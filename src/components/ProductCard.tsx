'use client'

import Link from 'next/link'
import { ShoppingCart, MessageCircle, Tag, Heart } from 'lucide-react'
import type { ShopProduct } from '@/types/shop'
import { formatPrice } from '@/lib/products'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getWhatsAppUrl } from '@/lib/config'
import { CategoryIcon } from '@/components/CategoryIcons'
import { getBrandLogoUrl } from '@/components/BrandLogos'
import { favoriteAdd, favoriteRemove } from '@/lib/api'
import { useState } from 'react'

export default function ProductCard({ product, onRemoveFavorite }: { product: ShopProduct; onRemoveFavorite?: (id: string | number) => void }) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isFav, setIsFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const productImage = product.thumbnail || (product.images && product.images.length > 0 ? product.images[0] : null)
  const brandLogo = product.brand_name ? getBrandLogoUrl(product.brand_name) : null
  const hasPrice = product.price != null && product.price > 0
  const hasDiscount = hasPrice && product.discount_price != null && product.discount_price < product.price!

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      product_id: String(product.id),
      product_name: product.name,
      product_slug: product.slug,
      product_image: product.thumbnail || undefined,
      unit_price: hasDiscount ? product.discount_price! : (product.price || 0),
      has_price: hasPrice,
    })
    toast('Ürün sepete eklendi', 'success')
  }

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    setFavLoading(true)
    try {
      if (onRemoveFavorite) {
        await favoriteRemove(product.id)
        onRemoveFavorite(product.id)
        toast('Favorilerden çıkarıldı', 'info')
      } else if (isFav) {
        await favoriteRemove(product.id)
        setIsFav(false)
        toast('Favorilerden çıkarıldı', 'info')
      } else {
        await favoriteAdd(product.id)
        setIsFav(true)
        toast('Favorilere eklendi', 'success')
      }
    } catch {
      toast('İşlem başarısız oldu', 'error')
    } finally {
      setFavLoading(false)
    }
  }

  // OEM varsa /parca/{oem}, yoksa /urun/{slug}
  const detailHref = product.oem_number
    ? `/parca/${encodeURIComponent(product.oem_number)}`
    : `/urun/${product.slug}`

  return (
    <Link
      href={detailHref}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all duration-200"
    >
      {/* Image / Brand Logo Placeholder */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {productImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : brandLogo ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandLogo}
              alt={product.brand_name || 'Marka'}
              className="w-16 h-16 object-contain opacity-40 group-hover:opacity-60 transition-opacity duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <CategoryIcon id={product.category} className="text-gray-300 group-hover:text-gray-400 transition-colors" size={48} strokeWidth={1.2} />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg">
            %{Math.round((1 - product.discount_price! / product.price!) * 100)} indirim
          </span>
        )}

        {/* Stock badge */}
        <span className={`absolute top-2 right-2 px-2 py-1 text-[11px] font-medium rounded-lg ${
          product.in_stock !== false
            ? 'bg-green-600 text-white'
            : 'bg-gray-700 text-white'
        }`}>
          {product.in_stock !== false ? 'Stokta Var' : 'Stokta Yok'}
        </span>

        {/* Favorite heart */}
        {user && (
          <button
            onClick={handleToggleFav}
            disabled={favLoading}
            className={`absolute top-10 right-2 p-1.5 rounded-full transition-all ${
              (isFav || onRemoveFavorite)
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-white/70 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
            } ${favLoading ? 'opacity-50' : ''}`}
          >
            <Heart className={`w-4 h-4 ${(isFav || onRemoveFavorite) ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <CategoryIcon id={product.category} className="text-gray-400" size={14} strokeWidth={2} />
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{product.category.replace(/_/g, ' ')}</span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug mb-2 line-clamp-2">
          {product.name}
        </h3>

        {product.oem_number && (
          <p className="text-xs font-mono text-gray-400 mb-3">OEM: {product.oem_number}</p>
        )}

        {product.brand_name && (
          <div className="flex items-center gap-1 mb-3">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{product.brand_name}</span>
          </div>
        )}

        <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-gray-100">
          {hasPrice ? (
            <div>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through block">{formatPrice(product.price!)}</span>
              )}
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(hasDiscount ? product.discount_price! : product.price!)}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-sm font-medium text-gray-500">Fiyat Sor</span>
            </div>
          )}

          {hasPrice ? (
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-dark-900 text-xs font-semibold rounded-lg transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Ekle
            </button>
          ) : (
            <a
              href={getWhatsAppUrl(`Merhaba, "${product.name}" ürün için fiyat bilgisi almak istiyorum.${product.oem_number ? `\nOEM: ${product.oem_number}` : ''}`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Sor
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}
