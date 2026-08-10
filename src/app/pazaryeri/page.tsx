'use client'

/**
 * Satıcı paneli ana sayfa — mağaza durumuna göre şekillenir.
 *
 * Akış: giriş yoksa karşılama ekranı → mağaza yoksa /basvuru'ya yönlendirilir
 * → 'pending' ise inceleme bilgisi → 'approved' ise özet kartlar.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Tag, Inbox, BadgeCheck, Clock, XCircle, Loader2, Store, LogIn, ArrowRight } from 'lucide-react'
import { useSellerSession } from './_components/useSellerSession'
import { fetchMyListings, fetchSellerRequests, fetchMyOffers } from '@/lib/seller'

export default function PazaryeriHome() {
  const { user, authLoading, seller, checkingSeller } = useSellerSession()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !checkingSeller && user && seller === null) {
      router.replace('/basvuru')
    }
  }, [authLoading, checkingSeller, user, seller, router])

  if (authLoading || (user && checkingSeller)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user) return <WelcomeGate />
  if (seller === null) return null // /basvuru'ya yönlendiriliyor
  if (seller.status === 'pending') return <PendingCard />
  if (seller.status !== 'approved') return <RejectedCard reason={seller.rejection_reason} suspended={seller.status === 'suspended'} />

  return <ApprovedDashboard sellerName={seller.name} />
}

function WelcomeGate() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
      <Store className="mb-4 h-12 w-12 text-gray-300" />
      <h1 className="text-2xl font-black text-gray-900">Satıcı Paneline Hoş Geldin</h1>
      <p className="mt-2 text-gray-500">
        Mağazanı, ilanlarını ve sana düşen talepleri buradan yönetirsin. Devam etmek için giriş yap.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/giris" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-400">
          <LogIn className="h-4 w-4" /> Giriş Yap
        </Link>
        <Link href="/kayit" className="rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-700 hover:bg-gray-50">
          Kayıt Ol
        </Link>
      </div>
    </main>
  )
}

function PendingCard() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900">
        <Clock className="mb-4 h-10 w-10" />
        <h1 className="text-2xl font-black">Başvurun inceleniyor</h1>
        <p className="mt-2 opacity-80">
          Vergi levhan kontrol ediliyor. Onaylandığında ilan vermeye ve gelen taleplere teklif göndermeye başlayabilirsin.
        </p>
      </div>
      <Link href="/basvuru" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-500">
        Başvuru detaylarını gör →
      </Link>
    </main>
  )
}

function RejectedCard({ reason, suspended }: { reason: string | null; suspended: boolean }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
        <XCircle className="mb-4 h-10 w-10" />
        <h1 className="text-2xl font-black">{suspended ? 'Mağazan askıya alındı' : 'Başvurun reddedildi'}</h1>
        <p className="mt-2 opacity-80">{reason || 'Detaylar için başvuru sayfana bak.'}</p>
      </div>
      <Link href="/basvuru" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-500">
        Başvuru detaylarını gör →
      </Link>
    </main>
  )
}

function ApprovedDashboard({ sellerName }: { sellerName: string }) {
  const [activeListings, setActiveListings] = useState<number | null>(null)
  const [pendingRequests, setPendingRequests] = useState<number | null>(null)
  const [offerCount, setOfferCount] = useState<number | null>(null)

  useEffect(() => {
    fetchMyListings().then(r => setActiveListings(r.listings.filter(l => l.status === 'active').length)).catch(() => setActiveListings(0))
    fetchSellerRequests().then(r => setPendingRequests(r.requests.filter(req => req.my_offer_count === 0).length)).catch(() => setPendingRequests(0))
    fetchMyOffers().then(r => setOfferCount(r.offers.length)).catch(() => setOfferCount(0))
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Merhaba, {sellerName}</h1>
        <p className="mt-1 text-sm text-gray-500">Mağazan yayında. İşte panelinin özeti.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          href="/ilanlarim" icon={Tag} label="Aktif İlan" value={activeListings}
          hint="Yayındaki ilanlarını yönet, süresi dolmak üzere olanları teyit et"
        />
        <SummaryCard
          href="/talepler" icon={Inbox} label="Yanıt Bekleyen Talep" value={pendingRequests}
          hint="Henüz teklif göndermediğin, sana düşen talepler"
        />
        <SummaryCard
          href="/tekliflerim" icon={BadgeCheck} label="Gönderilmiş Teklif" value={offerCount}
          hint="Tüm tekliflerinin durumunu izle"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-bold text-gray-900">Hızlı işlemler</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/ilan-ver" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-400">
            Yeni İlan Ver <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/talepler" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Gelen Talepleri Gör <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  )
}

function SummaryCard({
  href, icon: Icon, label, value, hint,
}: { href: string; icon: typeof Tag; label: string; value: number | null; hint: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-primary-400">
      <Icon className="h-5 w-5 text-primary-500" />
      <div className="mt-3 text-3xl font-black text-gray-900">
        {value === null ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-gray-100" /> : value}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-700">{label}</div>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </Link>
  )
}
