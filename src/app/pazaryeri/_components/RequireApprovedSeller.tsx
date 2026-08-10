'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, Clock, XCircle, Loader2 } from 'lucide-react'
import { useSellerSession } from './useSellerSession'
import type { SellerProfile } from '@/lib/api'

/**
 * İlanlarım / Gelen Talepler / Tekliflerim gibi sayfalar yalnızca onaylı satıcıya
 * açık — bu bileşen giriş, mağaza ve onay durumuna göre uygun ekranı gösterir,
 * onaylıysa `children` render fonksiyonuna satıcı kaydını geçirir.
 */
export default function RequireApprovedSeller({
  children,
}: {
  children: (seller: SellerProfile) => React.ReactNode
}) {
  const { user, authLoading, seller, checkingSeller } = useSellerSession()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/giris')
  }, [authLoading, user, router])

  if (authLoading || checkingSeller || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!seller) {
    return (
      <Gate
        Icon={Store}
        title="Önce mağaza açmalısın"
        body="Bu sayfaya erişebilmek için önce ücretsiz satıcı başvurunu tamamlaman gerekiyor."
        href="/basvuru"
        label="Mağaza Aç"
      />
    )
  }

  if (seller.status === 'pending') {
    return (
      <Gate
        Icon={Clock}
        title="Başvurun inceleniyor"
        body="Vergi levhan kontrol ediliyor. Onaylandığında bu sayfayı kullanabilirsin."
        href="/basvuru"
        label="Başvuru Durumunu Gör"
      />
    )
  }

  if (seller.status !== 'approved') {
    return (
      <Gate
        Icon={XCircle}
        title={seller.status === 'rejected' ? 'Başvurun reddedildi' : 'Mağazan askıya alındı'}
        body={seller.rejection_reason || 'Mağaza durumunla ilgili detaylar için başvuru sayfana bak.'}
        href="/basvuru"
        label="Detayları Gör"
      />
    )
  }

  return <>{children(seller)}</>
}

function Gate({
  Icon, title, body, href, label,
}: { Icon: typeof Store; title: string; body: string; href: string; label: string }) {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <Icon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <h1 className="text-2xl font-black text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500">{body}</p>
      <div className="mt-6 flex justify-center">
        <Link href={href} className="rounded-xl bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-400">
          {label}
        </Link>
      </div>
    </div>
  )
}
