'use client'

/**
 * Mağaza Aç — satıcı başvuru formu.
 *
 * Akış: giriş yapmış kullanıcı formu doldurur → başvuru 'pending' olarak
 * kaydedilir → admin vergi levhasını inceleyip onaylar/reddeder.
 *
 * Referans platformlarda gözlemlenen iki sürtünme burada bilinçli olarak yok:
 *  - Başvuru ücretsiz ve komisyonsuz (rakiplerde de öyle; giriş engeli olmamalı)
 *  - Kayıt sırasında TC kimlik/adres duvarı yok; şahıs işletmesi TC ile,
 *    şirket vergi no ile kayıt olabiliyor, gerisi onay sonrası.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, Upload, CheckCircle2, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  fetchCities, fetchDistricts, fetchMySeller, registerSeller,
  type GeoCity, type GeoDistrict, type SellerProfile,
} from '@/lib/api'

const MAX_DOC_MB = 5

// Giriş/kayıt formlarındaki alan stiliyle aynı (bkz. app/giris/page.tsx).
const INPUT =
  'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 ' +
  'placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors ' +
  'disabled:bg-gray-50 disabled:text-gray-400'

export default function MagazaAcPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [checking, setChecking] = useState(true)

  const [cities, setCities] = useState<GeoCity[]>([])
  const [districts, setDistricts] = useState<GeoDistrict[]>([])

  const [name, setName] = useState('')
  const [cityId, setCityId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [address, setAddress] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [phone, setPhone] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [doc, setDoc] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Mevcut başvuru var mı?
  useEffect(() => {
    if (authLoading) return
    if (!user) { setChecking(false); return }
    fetchMySeller()
      .then(r => setSeller(r.seller))
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [user, authLoading])

  useEffect(() => {
    fetchCities().then(r => setCities(r.cities)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!cityId) { setDistricts([]); setDistrictId(''); return }
    fetchDistricts(Number(cityId)).then(r => setDistricts(r.districts)).catch(() => setDistricts([]))
    setDistrictId('')
  }, [cityId])

  const taxDigits = taxNumber.replace(/\D/g, '')
  const waDigits = whatsapp.replace(/\D/g, '')
  const canSubmit = useMemo(
    () => name.trim().length >= 3 && !!cityId && waDigits.length >= 10 &&
          (taxDigits.length === 10 || taxDigits.length === 11) && !submitting,
    [name, cityId, waDigits, taxDigits, submitting]
  )

  const onFile = (f: File | null) => {
    setError('')
    if (f && f.size > MAX_DOC_MB * 1024 * 1024) {
      setError(`Belge en fazla ${MAX_DOC_MB} MB olabilir`)
      return
    }
    setDoc(f)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true); setError('')
    try {
      const form = new FormData()
      form.set('name', name.trim())
      form.set('city_id', cityId)
      if (districtId) form.set('district_id', districtId)
      if (address.trim()) form.set('address', address.trim())
      form.set('whatsapp', waDigits)
      if (phone.replace(/\D/g, '')) form.set('phone', phone.replace(/\D/g, ''))
      form.set('tax_number', taxDigits)
      if (doc) form.set('tax_document', doc)

      const res = await registerSeller(form)
      toast(res.message, 'success')
      const me = await fetchMySeller()
      setSeller(me.seller)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Başvuru gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || checking) {
    return (
      <main className="container mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </main>
    )
  }

  if (!user) return <LoginGate onLogin={() => router.push('/giris')} />
  if (seller) return <StatusCard seller={seller} />

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-600">
          <Store className="h-3.5 w-3.5" /> Satıcı Başvurusu
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Mağazanı aç</h1>
        <p className="mt-2 text-gray-500">
          Ücretsiz ve komisyonsuz. Vergi levhanı yükle, onaydan sonra ilan vermeye ve
          gelen taleplere teklif göndermeye başla.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        <Field label="Mağaza adı" required hint="Müşterilerin göreceği isim">
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Örn. Yıldız Oto Çıkma Parça"
            className={INPUT} maxLength={150}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="İl" required>
            <select value={cityId} onChange={e => setCityId(e.target.value)} className={INPUT}>
              <option value="">İl seçin</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="İlçe" hint={cityId ? undefined : 'Önce il seçin'}>
            <select
              value={districtId} onChange={e => setDistrictId(e.target.value)}
              className={INPUT} disabled={!cityId || districts.length === 0}
            >
              <option value="">İlçe seçin</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Açık adres" hint="Alıcılar mağazanı bulabilsin (opsiyonel)">
          <textarea
            value={address} onChange={e => setAddress(e.target.value)}
            rows={2} maxLength={400} className={`${INPUT} resize-none`}
            placeholder="Mahalle, cadde, no"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp" required hint="Talepler buraya bildirilir">
            <input
              value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              inputMode="tel" placeholder="05XX XXX XX XX" className={INPUT}
            />
          </Field>
          <Field label="Sabit telefon">
            <input
              value={phone} onChange={e => setPhone(e.target.value)}
              inputMode="tel" placeholder="0212 XXX XX XX" className={INPUT}
            />
          </Field>
        </div>

        <Field
          label="Vergi no / TC kimlik no" required
          hint="Şirket için 10 haneli vergi no, şahıs işletmesi için 11 haneli TC"
        >
          <input
            value={taxNumber} onChange={e => setTaxNumber(e.target.value)}
            inputMode="numeric" maxLength={11} className={INPUT} placeholder="__________"
          />
        </Field>

        <Field label="Vergi levhası" hint="PDF, JPG veya PNG · en fazla 5 MB · yalnızca onay ekibi görür">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-4 transition-colors hover:border-primary-400 hover:bg-primary-50/40">
            <Upload className="h-5 w-5 flex-shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
              {doc ? doc.name : 'Dosya seç'}
            </span>
            {doc && <span className="text-xs text-gray-400">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>}
            <input
              type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        {error && (
          <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
          </p>
        )}

        <button
          type="submit" disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-4 text-base font-black uppercase tracking-wider text-white transition-all hover:bg-primary-400 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Store className="h-5 w-5" />}
          {submitting ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Başvurunu göndererek <Link href="/kullanim-sartlari" className="underline">kullanım şartlarını</Link> kabul etmiş olursun.
        </p>
      </form>
    </main>
  )
}

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-800">
        {label} {required && <span className="text-primary-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

function LoginGate({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="container mx-auto max-w-lg px-4 py-24 text-center">
      <Store className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <h1 className="text-2xl font-black text-gray-900">Mağaza açmak için giriş yapın</h1>
      <p className="mt-2 text-gray-500">
        Satıcı başvurusu hesabınıza bağlanır. Hesabınız yoksa kayıt olmanız yeterli.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={onLogin} className="rounded-xl bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-400">
          Giriş Yap
        </button>
        <Link href="/kayit" className="rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-700 hover:bg-gray-50">
          Kayıt Ol
        </Link>
      </div>
    </main>
  )
}

function StatusCard({ seller }: { seller: SellerProfile }) {
  const view = {
    pending:   { Icon: Clock,        cls: 'amber',   title: 'Başvurun inceleniyor',
                 body: 'Vergi levhan kontrol ediliyor. Onaylandığında ilan vermeye başlayabileceksin.' },
    approved:  { Icon: CheckCircle2, cls: 'emerald', title: 'Mağazan onaylandı',
                 body: 'Artık ilan verebilir ve gelen taleplere teklif gönderebilirsin.' },
    rejected:  { Icon: XCircle,      cls: 'red',     title: 'Başvurun reddedildi',
                 body: seller.rejection_reason || 'Belgelerinde bir sorun var.' },
    suspended: { Icon: XCircle,      cls: 'red',     title: 'Mağazan askıya alındı',
                 body: seller.rejection_reason || 'Mağazan geçici olarak kapatıldı.' },
  }[seller.status]

  const tone: Record<string, string> = {
    amber:   'border-amber-200 bg-amber-50 text-amber-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    red:     'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-16">
      <div className={`rounded-2xl border p-8 ${tone[view.cls]}`}>
        <view.Icon className="mb-4 h-10 w-10" />
        <h1 className="text-2xl font-black">{view.title}</h1>
        <p className="mt-2 opacity-80">{view.body}</p>
      </div>

      <dl className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-6">
        <Row label="Mağaza" value={seller.name} />
        <Row label="Konum" value={[seller.city_name, seller.district_name].filter(Boolean).join(' / ')} />
        <Row label="WhatsApp" value={seller.whatsapp} />
        <Row label="Vergi levhası" value={seller.has_document ? 'Yüklendi' : 'Yüklenmedi'} />
      </dl>

      {seller.status === 'approved' && (
        <Link
          href="/ilan-ver"
          className="mt-6 block rounded-xl bg-primary-500 py-4 text-center font-black uppercase tracking-wider text-white hover:bg-primary-400"
        >
          İlk İlanını Ver
        </Link>
      )}
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-semibold text-gray-900">{value || '—'}</dd>
    </div>
  )
}
