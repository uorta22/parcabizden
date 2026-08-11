'use client'

/**
 * AssistantWidget — 4 sekmeli gelişmiş yardım paneli.
 *
 * Otoparçasan tarzı yapı:
 *   ┌────────────────────────────────────────┐
 *   │ Header (tab-spesifik başlık + KAPAT)   │
 *   ├────────────────────────────────────────┤
 *   │ BODY (aktif tab içeriği)               │
 *   │  • home    → karşılama + quick actions │
 *   │  • sss     → filtreli accordion FAQ    │
 *   │  • message → conversational tree       │
 *   │  • contact → telefon / WA / TG / mail  │
 *   ├────────────────────────────────────────┤
 *   │ Footer: tab navigasyon + chat input    │
 *   └────────────────────────────────────────┘
 *
 * Conversational tree: TREE objesi ile her node'un başlığı + seçenekleri
 * tanımlı. Kullanıcı seçim yapınca thread'e user mesajı eklenir, sonra
 * goto edilen node'un system mesajı eklenir. href ile iç route'a, url
 * ile dış adrese yönlendirme yapılır.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X, Maximize2, ArrowLeft, Send,
  Home, HelpCircle, MessageCircle, Headphones,
  Search, ShoppingBag, Car, UserCircle, Truck,
  Send as TelegramIcon, Mail, Phone, Box,
} from 'lucide-react'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'
import { useAuth } from '@/contexts/AuthContext'

// ─────────────────────────────────────────────────────────
// Conversation tree
// ─────────────────────────────────────────────────────────
type Choice = {
  id: number
  label: string
  goto?: number      // başka düğüme git
  href?: string      // iç sayfaya yönlendir + widget'ı kapat
  url?: string       // dış adrese yeni sekmede aç
  back?: boolean     // 'Ana menüye dön' stilini al
}
type Node = { title: string; choices: Choice[] }

const TREE: Record<number, Node> = {
  0: {
    title: 'Merhaba, size nasıl yardımcı olabilirim?',
    choices: [
      { id: 1,  label: 'Siparişlerim',    goto: 1 },
      { id: 2,  label: 'Aracımı Seç',     goto: 2 },
      { id: 5,  label: 'Üyelik',          goto: 5 },
      { id: 17, label: 'Kargom Nerede',   goto: 17 },
      { id: 13, label: 'İade & Değişim',  goto: 13 },
    ],
  },
  1: {
    title: 'Siparişleriniz hakkında ne öğrenmek istersiniz?',
    choices: [
      { id: 12, label: 'Kargo durumu',      goto: 17 },
      { id: 13, label: 'İade işlemleri',    goto: 13 },
      { id: 0,  label: 'Ana menüye dön',    goto: 0, back: true },
    ],
  },
  2: {
    title: 'Aracınızı hangi yöntem ile seçmek istiyorsunuz?',
    choices: [
      { id: 21, label: 'Şasi ile aracı seç',     href: '/?tab=vin' },
      { id: 22, label: 'Katalogdan aracı seç',   href: '/ilanlar' },
      { id: 23, label: 'Garajımdan seç',         href: '/hesabim/garaj' },
      { id: 0,  label: 'Ana menüye dön',         goto: 0, back: true },
    ],
  },
  5: {
    title: 'Üyelik konusunda ne yapmak istiyorsunuz?',
    choices: [
      { id: 51, label: 'Üye Ol',                 href: '/kayit' },
      { id: 52, label: 'Giriş Yap',              href: '/giris' },
      { id: 53, label: 'Şifremi Unuttum',        href: '/sifremi-unuttum' },
      { id: 54, label: 'Bilgilerimi Güncelle',   href: '/hesabim/profil' },
      { id: 0,  label: 'Ana menüye dön',         goto: 0, back: true },
    ],
  },
  13: {
    title: 'İade işlemleri 14 gün içinde yapılabilir. Detayları seçin:',
    choices: [
      { id: 131, label: 'İade & Değişim Politikası', href: '/kullanim-sartlari' },
      { id: 132, label: 'WhatsApp ile iletişime geç', url: getWhatsAppUrl('Merhaba, iade yapmak istiyorum.') },
      { id: 0,   label: 'Ana menüye dön',             goto: 0, back: true },
    ],
  },
  17: {
    title: 'Kargo durumu için sipariş numaranızla bize ulaşın:',
    choices: [
      { id: 171, label: 'WhatsApp ile sor', url: getWhatsAppUrl('Merhaba, kargo durumumu öğrenebilir miyim?') },
      { id: 172, label: 'Telegram ile sor', url: 'https://t.me/parcabizden' },
      { id: 0,   label: 'Ana menüye dön',   goto: 0, back: true },
    ],
  },
}

// ─────────────────────────────────────────────────────────
// SSS verisi
// ─────────────────────────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  { q: 'ParcaBizden\'e nasıl üye olabilirim?', a: 'Sağ üstteki "Giriş Yap" sekmesine tıklayın, açılan sayfada "Henüz Üye Değil misiniz?" altındaki "Hemen Kayıt Ol" linkine basarak üyelik formunu doldurun.' },
  { q: 'Aracım için doğru parçayı nasıl bulabilirim?', a: 'Anasayfada "Araç ile bul" sekmesinden marka/model/varyant seçerek veya "VIN ile" sekmesinden 17 karakterlik şase numaranızı girerek aracınıza özel parçalara ulaşabilirsiniz.' },
  { q: 'Ürün hakkında detaylı bilgi nasıl alırım?', a: 'Ürün detay sayfasındaki "Ürün Özellikleri", "Uyumlu Araçlar" ve "Çapraz Referans" sekmelerini inceleyebilir, "WhatsApp ile Kontrol Et" butonundan uzmana danışabilirsiniz.' },
  { q: 'Fren diskleri tek mi çift mi geliyor?', a: 'Standart fren diskleri ayrı ayrı satılır. Fren balataları ise ön veya arka takım (set) olarak satılır. İki disk için bir takım balata yeterlidir.' },
  { q: 'Aynı parçanın birden fazla seçeneği neden çıkıyor?', a: 'Üretici markalar aynı araç için farklı kalite/üretim tarihi/tedarikçi seçenekleri sunabilir. Ürün özelliklerini karşılaştırarak veya WhatsApp\'tan danışarak doğru olanı seçebilirsiniz.' },
  { q: 'Aradığım parça katalogda yoksa?', a: 'Müşteri hizmetlerimiz aracılığıyla katalogda olmayan parçaları da temin edebiliriz. WhatsApp veya telefonla iletişime geçin.' },
  { q: 'Fiyatlara KDV dahil mi?', a: 'Evet, tüm fiyatlarımıza KDV dahildir.' },
  { q: 'Stok durumunu nasıl öğrenirim?', a: 'Ürün listesinde ve detay sayfasında stok durumu renkli rozetle (yeşil/kırmızı) gösterilir. Anlık stok için WhatsApp\'tan teyit alabilirsiniz.' },
  { q: 'İade koşulları nelerdir?', a: 'Siparişlerinizi teslimattan itibaren 14 gün içinde iade edebilirsiniz. Ürünlerin kullanılmamış, hasarsız ve orijinal ambalajıyla iade edilmesi gerekir.' },
  { q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Giriş sayfasındaki "Şifremi Unuttum" linkine tıklayın. E-posta adresinize sıfırlama linki gönderilecektir.' },
]

// ═════════════════════════════════════════════════════════
type Tab = 'home' | 'sss' | 'message' | 'contact'
type Message = { role: 'system' | 'user'; text: string; choices?: Choice[] }

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const router = useRouter()
  const { user } = useAuth()
  const firstName = (user?.name || 'oto severler').split(' ')[0]

  // Mesaj thread state
  const [thread, setThread] = useState<Message[]>([
    { role: 'system', text: TREE[0].title, choices: TREE[0].choices },
  ])
  const [input, setInput] = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)

  // SSS arama
  const [faqQuery, setFaqQuery] = useState('')
  const visibleFaqs = useMemo(() => {
    const q = faqQuery.trim().toLowerCase()
    if (!q) return FAQS
    return FAQS.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [faqQuery])

  // ESC ile kapat
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  // Yeni mesaj eklendiğinde aşağı kaydır
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  function selectChoice(c: Choice) {
    setThread(prev => [...prev, { role: 'user', text: c.label }])

    setTimeout(() => {
      if (c.url) { window.open(c.url, '_blank', 'noopener,noreferrer'); return }
      if (c.href) {
        setOpen(false)
        router.push(c.href)
        return
      }
      if (typeof c.goto === 'number') {
        const node = TREE[c.goto]
        if (node) {
          setThread(prev => [...prev, { role: 'system', text: node.title, choices: node.choices }])
        }
      }
    }, 250)
  }

  // Anasayfa quick action'ından message tab'a atla + ilgili node'u thread'e push et
  function jumpToNode(nodeId: number, userLabel: string) {
    const node = TREE[nodeId]
    if (!node) return
    setTab('message')
    setThread(prev => [
      ...prev,
      { role: 'user', text: userLabel },
      { role: 'system', text: node.title, choices: node.choices },
    ])
  }

  function sendInput() {
    const text = input.trim()
    if (!text) return
    setThread(prev => [
      ...prev,
      { role: 'user', text },
      {
        role: 'system',
        text: 'Mesajınız alındı. Daha hızlı yanıt için WhatsApp veya Telegram\'ı tercih edebilirsiniz.',
        choices: [
          { id: 901, label: 'WhatsApp\'a yaz', url: getWhatsAppUrl(text) },
          { id: 902, label: 'Telegram\'a yaz', url: 'https://t.me/parcabizden' },
          { id: 0,   label: 'Ana menüye dön',  goto: 0, back: true },
        ],
      },
    ])
    setInput('')
  }

  // Mobile fullscreen sm:bottom 24'ten farklı
  const panelClass = fullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-white'
    : 'fixed bottom-0 right-0 z-50 flex h-[90vh] w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-black/10 sm:bottom-6 sm:right-6 sm:h-[640px] sm:rounded-3xl'

  return (
    <>
      {/* Floating launcher — z-40: sayfa modalları z-50'de, launcher onların üstüne binmemeli */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Yardım Asistanı"
          className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#4f7bd6] text-white shadow-lg ring-4 ring-white transition-transform hover:scale-105 hover:bg-[#3b5fb8] sm:bottom-6 sm:right-6"
        >
          <Headphones className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow">
            1
          </span>
        </button>
      )}

      {/* Backdrop (mobile) */}
      {open && !fullscreen && (
        <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      {/* Panel */}
      {open && (
        <div className={panelClass} role="dialog" aria-label="Yardım Asistanı">
          {/* ── HEADER ── */}
          <header
            className="relative px-5 pb-5 pt-4 text-white"
            style={{ background: 'linear-gradient(160deg, #4f7bd6 0%, #3b5fb8 100%)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {tab !== 'home' && (
                  <button
                    onClick={() => setTab('home')}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                    aria-label="Anasayfaya dön"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}

                {tab === 'home' ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                      <Headphones className="h-5 w-5" />
                    </div>
                    <div className="relative rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-sm font-semibold text-gray-800">
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400">
                        Merhaba, Ben Oto Asistan
                      </span>
                      Nasıl Yardımcı Olabiliriz ?
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-bold">{TAB_TITLES[tab].title}</h2>
                    <p className="text-xs text-white/75">{TAB_TITLES[tab].subtitle}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFullscreen(v => !v)}
                  className="flex flex-col items-center gap-0.5 rounded-lg p-1 text-[10px] font-bold tracking-wider text-white/80 hover:text-white"
                  aria-label="Genişlet"
                >
                  <Maximize2 className="h-5 w-5" />
                  <span>GENİŞLET</span>
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-0.5 rounded-lg p-1 text-[10px] font-bold tracking-wider text-white/80 hover:text-white"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                  <span>KAPAT</span>
                </button>
              </div>
            </div>

            {/* Tab-spesifik üst ek (SSS arama bandı) */}
            {tab === 'sss' && (
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={faqQuery}
                  onChange={e => setFaqQuery(e.target.value)}
                  placeholder="Filtrele.."
                  className="w-full rounded-xl bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
            )}
          </header>

          {/* ── BODY ── */}
          <div className="flex-1 overflow-y-auto bg-white">
            {tab === 'home'    && <HomeTab firstName={firstName} onJump={jumpToNode} />}
            {tab === 'sss'     && <SssTab faqs={visibleFaqs} resetSearch={() => setFaqQuery('')} setTab={setTab} />}
            {tab === 'message' && <MessageTab thread={thread} onChoice={selectChoice} threadEndRef={threadEndRef} />}
            {tab === 'contact' && <ContactTab />}
          </div>

          {/* ── FOOTER: tab nav + (message tab'ında) input ── */}
          <footer className="border-t border-gray-100 bg-white">
            {tab === 'message' && (
              <form
                onSubmit={e => { e.preventDefault(); sendInput() }}
                className="flex items-center gap-2 border-b border-gray-100 p-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Yazınız..."
                  className="flex-1 rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4f7bd6]/30"
                />
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f7bd6] text-white hover:bg-[#3b5fb8] disabled:opacity-50"
                  disabled={!input.trim()}
                  aria-label="Gönder"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}

            <nav className="grid grid-cols-4">
              <TabButton id="home"    icon={<Home className="h-5 w-5" />}          label="Anasayfa"   active={tab === 'home'}    onClick={() => setTab('home')} />
              <TabButton id="sss"     icon={<HelpCircle className="h-5 w-5" />}    label="S.S.S."     active={tab === 'sss'}     onClick={() => setTab('sss')} />
              <TabButton id="message" icon={<MessageCircle className="h-5 w-5" />} label="Oto Asistan" active={tab === 'message'} onClick={() => setTab('message')} />
              <TabButton id="contact" icon={<Headphones className="h-5 w-5" />}    label="İletişim"   active={tab === 'contact'} onClick={() => setTab('contact')} />
            </nav>
          </footer>
        </div>
      )}
    </>
  )
}

// ═════════════════════════════════════════════════════════
// Tab sayfaları
// ═════════════════════════════════════════════════════════
const TAB_TITLES: Record<Exclude<Tab, 'home'>, { title: string; subtitle: string }> = {
  sss:     { title: 'Sıkça Sorulan Sorular', subtitle: 'Aradığınız cevap büyük ihtimalle burada' },
  message: { title: 'Oto Asistan',           subtitle: 'Size nasıl yardımcı olabiliriz ?' },
  contact: { title: 'İletişim',              subtitle: 'Bize aşağıdaki kanallardan ulaşabilirsiniz.' },
}

function HomeTab({ firstName, onJump }: { firstName: string; onJump: (nodeId: number, userLabel: string) => void }) {
  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="text-2xl font-black leading-tight text-gray-900">
          Merhaba {firstName} <span aria-hidden>👋</span>
        </h2>
        <p className="mt-1 text-sm text-gray-500">Hangi konuda yardıma ihtiyacın var ?</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <QuickAction icon={<ShoppingBag className="h-4 w-4" />} onClick={() => onJump(1,  'Siparişlerim')}>Siparişlerim</QuickAction>
        <QuickAction icon={<Car className="h-4 w-4" />}         onClick={() => onJump(2,  'Aracımı Seç')}>Aracımı Seç</QuickAction>
        <QuickAction icon={<UserCircle className="h-4 w-4" />}  onClick={() => onJump(5,  'Üyelik')}>Üyelik</QuickAction>
        <QuickAction icon={<Truck className="h-4 w-4" />}       onClick={() => onJump(17, 'Kargom Nerede')}>Kargom Nerede</QuickAction>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <ExternalQuickAction
          href={getWhatsAppUrl('Merhaba, yardıma ihtiyacım var.')}
          icon={<MessageCircle className="h-4 w-4 text-emerald-600" />}
        >
          Whatsapp
        </ExternalQuickAction>
        <ExternalQuickAction
          href="https://t.me/parcabizden"
          icon={<TelegramIcon className="h-4 w-4 text-sky-500" />}
        >
          Telegram
        </ExternalQuickAction>
      </div>

      <CampaignCard />
    </div>
  )
}

function SssTab({ faqs, resetSearch, setTab }: { faqs: typeof FAQS; resetSearch: () => void; setTab: (t: Tab) => void }) {
  return (
    <div className="p-5">
      {faqs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <Box className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-700">Bulunamadı :(</p>
          <p className="mt-1 text-xs text-gray-500">
            Canlı desteğe sorununuzu iletebilir veya iletişim kanallarından cevap arayabilirsiniz.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => { resetSearch(); setTab('message') }}
              className="rounded-xl bg-[#4f7bd6] px-4 py-2 text-xs font-bold text-white hover:bg-[#3b5fb8]"
            >
              Canlı Destek
            </button>
            <button
              onClick={() => setTab('contact')}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              İletişim&apos;e Geç
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-xl border border-gray-200 bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-gray-800">
                {f.q}
                <span className="text-gray-400 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <div className="border-t border-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-600">{f.a}</div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageTab({
  thread, onChoice, threadEndRef,
}: { thread: Message[]; onChoice: (c: Choice) => void; threadEndRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div className="space-y-3 p-4">
      {thread.map((m, i) => (
        m.role === 'user' ? (
          <div key={i} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#4f7bd6] px-3.5 py-2 text-sm text-white">
              {m.text}
            </div>
          </div>
        ) : (
          <div key={i} className="space-y-2">
            <div className="flex gap-2">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#4f7bd6] text-white">
                <Headphones className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-sm text-gray-800">
                {m.text}
              </div>
            </div>
            {m.choices && (
              <div className="ml-9 flex flex-wrap gap-1.5">
                {m.choices.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onChoice(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      c.back
                        ? 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                        : 'bg-[#4f7bd6]/10 text-[#4f7bd6] hover:bg-[#4f7bd6]/20'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      ))}
      <div ref={threadEndRef} />
    </div>
  )
}

function ContactTab() {
  return (
    <div className="space-y-2 p-5">
      <ContactCard
        href={`tel:${siteConfig.phone.raw}`}
        icon={<Phone className="h-5 w-5 text-sky-500" />}
        title="Hemen Arayın"
        sub={siteConfig.phone.display}
      />
      <ContactCard
        href={getWhatsAppUrl('Merhaba, bir konu hakkında bilgi alabilir miyim?')}
        icon={<MessageCircle className="h-5 w-5 text-emerald-500" />}
        title="WhatsApp Destek"
        sub={siteConfig.phone.display}
        external
      />
      <ContactCard
        href="https://t.me/parcabizden"
        icon={<TelegramIcon className="h-5 w-5 text-sky-400" />}
        title="Telegram Destek"
        sub="@parcabizden"
        external
      />
      <ContactCard
        href={`mailto:${siteConfig.email}`}
        icon={<Mail className="h-5 w-5 text-orange-500" />}
        title="Mail Gönder"
        sub={siteConfig.email}
      />

      <p className="mt-5 rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
        Destek hattımıza Hafta içi <strong className="text-gray-700">08:45 - 18:00</strong>,
        Hafta Sonu <strong className="text-gray-700">08:45 - 15:00</strong> aralığında ulaşabilirsiniz.
        Yoğun saatlerde mailimize talebinizi iletebilirsiniz.
      </p>
    </div>
  )
}

// ═════════════════════════════════════════════════════════
// Yardımcı UI parçaları
// ═════════════════════════════════════════════════════════
function TabButton({
  icon, label, active, onClick,
}: { id: Tab; icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-colors ${
        active ? 'text-[#4f7bd6]' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function QuickAction({
  icon, children, onClick,
}: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-800 transition-all hover:-translate-y-0.5 hover:border-[#4f7bd6] hover:text-[#4f7bd6] hover:shadow-sm"
    >
      {icon}
      {children}
    </button>
  )
}

function ExternalQuickAction({
  href, icon, children,
}: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-800 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
    >
      {icon}{children}
    </a>
  )
}

function ContactCard({
  href, icon, title, sub, external,
}: { href: string; icon: React.ReactNode; title: string; sub: string; external?: boolean }) {
  const cls = 'flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-gray-300 hover:shadow-sm'
  const body = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">{icon}</div>
      <div>
        <div className="text-sm font-bold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
    </>
  )
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  return <a href={href} className={cls}>{body}</a>
}

function CampaignCard() {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div
        className="relative h-28"
        style={{ background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' }}
      >
        <div className="absolute inset-0 grid place-items-center p-4 text-center text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
              7500₺ ve üzeri 2 taksite
            </p>
            <p className="mt-1 inline-block rounded-md bg-white/15 px-3 py-1 text-base font-black backdrop-blur-sm">
              %0 KOMİSYON
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <span className="inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700">
          Kampanya
        </span>
        <h3 className="mt-2 text-sm font-bold text-gray-900">%0 KOMİSYON ve ÜCRETSİZ KARGO</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
          5000₺ üzeri tüm siparişlerde ücretsiz kargo! 7500₺ ve üzeri 2 taksitli alışverişlerde %0 komisyon!
        </p>
      </div>
    </article>
  )
}
