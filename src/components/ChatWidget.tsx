'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, ChevronDown, Loader2, RotateCcw } from 'lucide-react'
import { siteConfig } from '@/lib/config'
import { validateVIN } from '@/lib/vehicle'

// ── Types ──

interface ChatMessage {
  id: string
  sender: 'customer' | 'system' | 'admin'
  text: string
  timestamp: number
}

interface ChatSession {
  ticketId: string
  step: 'form' | 'chat'
  name: string
  phone: string
  vin: string
  vehicle: string
  brand: string
  model: string
  year: number
  messages: ChatMessage[]
  ticketCreated: boolean // true after first message sent to backend
}

// ── Quick Options ──

const QUICK_OPTIONS = [
  { id: 'price', label: 'Parça fiyatı öğrenmek istiyorum' },
  { id: 'stock', label: 'Stok durumu sormak istiyorum' },
  { id: 'search', label: 'Parça bulmamda yardım edin' },
  { id: 'agent', label: 'Temsilciye bağlan' },
]

// ── Helpers ──

function generateTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

const STORAGE_KEY = 'parcabizden-chat'

function loadSession(): ChatSession {
  if (typeof window === 'undefined') return defaultSession()
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChatSession
      if (parsed.step && parsed.ticketId) return parsed
    }
  } catch { /* ignore */ }
  return defaultSession()
}

function defaultSession(): ChatSession {
  return {
    ticketId: generateTicketId(),
    step: 'form',
    name: '',
    phone: '',
    vin: '',
    vehicle: '',
    brand: '',
    model: '',
    year: 0,
    messages: [],
    ticketCreated: false,
  }
}

function saveSession(s: ChatSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch { /* ignore */ }
}

function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

function isOnline(): boolean {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const hour = now.getHours()
  return (
    (siteConfig.chat.workingDays as readonly number[]).includes(day) &&
    hour >= siteConfig.chat.workingHoursStart &&
    hour < siteConfig.chat.workingHoursEnd
  )
}

function validatePhone(phone: string): boolean {
  return /^05\d{9}$/.test(phone.replace(/\s/g, ''))
}

// ── Component ──

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<ChatSession>(loadSession)

  const resetChat = useCallback(() => {
    clearSession()
    setSession(defaultSession())
  }, [])

  if (!siteConfig.chat.enabled) return null

  return (
    <>
      {isOpen && (
        session.step === 'form'
          ? <InfoForm session={session} setSession={setSession} />
          : <LiveChat session={session} setSession={setSession} onClose={() => setIsOpen(false)} onReset={resetChat} />
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label={isOpen ? "Chat'i kapat" : 'Destek ile iletişime geçin'}
      >
        <div className="relative">
          {!isOpen && (
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
          )}
          <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110 ${
            isOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-500 hover:bg-green-600'
          }`}>
            {isOpen ? (
              <X className="w-7 h-7 md:w-8 md:h-8 text-white" />
            ) : (
              <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
            )}
          </div>
          {!isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg">
              Bize yazın
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900" />
            </div>
          )}
        </div>
      </button>
    </>
  )
}

// ══════════════════════════════════════
// STEP 1 — Info Form
// ══════════════════════════════════════

// Generate year options (current year down to 2000)
const YEAR_OPTIONS: number[] = []
for (let y = new Date().getFullYear(); y >= 2000; y--) YEAR_OPTIONS.push(y)

interface ChatBrand {
  name: string
  slug: string
}

function InfoForm({
  session,
  setSession,
}: {
  session: ChatSession
  setSession: React.Dispatch<React.SetStateAction<ChatSession>>
}) {
  const [name, setName] = useState(session.name)
  const [phone, setPhone] = useState(session.phone)
  const [vin, setVin] = useState(session.vin)
  const [vinError, setVinError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const [brands, setBrands] = useState<ChatBrand[]>([])
  const [brand, setBrand] = useState(session.brand)
  const [model, setModel] = useState(session.model)
  const [year, setYear] = useState(session.year)

  const [loadingBrands, setLoadingBrands] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load brands from proxy route (always /api/brands, not external URL)
  useEffect(() => {
    setLoadingBrands(true)
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => setBrands(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingBrands(false))
  }, [])

  const buildVehicleString = (): string => {
    const parts: string[] = []
    if (brand) parts.push(brand)
    if (model.trim()) parts.push(model.trim())
    if (year) parts.push(String(year))
    return parts.join(' ')
  }

  const canSubmit = name.trim().length > 0 && validatePhone(phone)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return
    if (!validatePhone(phone)) {
      setPhoneError('Geçerli bir telefon numarası girin (05XX XXX XX XX)')
      return
    }
    if (vin.trim() && !validateVIN(vin.trim())) {
      setVinError('Geçerli bir şase numarası girin (17 karakter)')
      return
    }

    setSubmitting(true)
    const vehicle = buildVehicleString()

    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      sender: 'system',
      text: `Merhaba ${name.trim()}, ${vehicle ? vehicle + ' için ' : ''}size nasıl yardımcı olabiliriz? Aşağıdaki seçeneklerden birini seçin veya mesajınızı yazın.`,
      timestamp: Date.now(),
    }

    const newSession: ChatSession = {
      ...session,
      step: 'chat',
      name: name.trim(),
      phone: phone.replace(/\s/g, ''),
      vin: vin.trim(),
      vehicle,
      brand,
      model: model.trim(),
      year,
      messages: [welcomeMsg],
      ticketCreated: false,
    }

    saveSession(newSession)
    setSession(newSession)
    setSubmitting(false)
  }

  return (
    <div className="fixed max-sm:inset-0 sm:bottom-24 sm:right-4 md:right-6 z-50 max-sm:bg-white sm:w-[380px] sm:h-[560px] bg-white sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-semibold text-sm">{siteConfig.name} Destek</h3>
          <p className="text-green-100 text-xs">Bilgilerinizi doldurun, sohbete başlayalım</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Ad Soyad */}
        <div>
          <label className="block text-gray-700 text-xs font-medium mb-1">Ad Soyad *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınız Soyadınız"
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-gray-700 text-xs font-medium mb-1">Telefon *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
            placeholder="05XX XXX XX XX"
            className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${phoneError ? 'border-red-400' : 'border-gray-300'}`}
          />
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        </div>

        {/* Şase No */}
        <div>
          <label className="block text-gray-700 text-xs font-medium mb-1">Şase No (Opsiyonel)</label>
          <input
            type="text"
            value={vin}
            onChange={(e) => { setVin(e.target.value.toUpperCase()); setVinError('') }}
            placeholder="VF1XXXXXXXXX"
            maxLength={17}
            className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${vinError ? 'border-red-400' : 'border-gray-300'}`}
          />
          {vinError ? (
            <p className="text-red-500 text-xs mt-1">{vinError}</p>
          ) : (
            <p className="text-gray-400 text-xs mt-1">Varsa daha hızlı sonuç sağlanır</p>
          )}
        </div>

        {/* Marka */}
        <div className="relative">
          <label className="block text-gray-700 text-xs font-medium mb-1">Marka</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={loadingBrands}
            className="w-full appearance-none text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:opacity-50"
          >
            <option value="">{loadingBrands ? 'Yükleniyor...' : 'Marka Seçin'}</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.name}>{b.name}</option>
            ))}
          </select>
          {loadingBrands ? (
            <Loader2 className="absolute right-3 bottom-2.5 w-4 h-4 text-green-500 animate-spin pointer-events-none" />
          ) : (
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-gray-700 text-xs font-medium mb-1">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Örn: Golf, Octavia, 320d..."
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Yıl */}
        <div className="relative">
          <label className="block text-gray-700 text-xs font-medium mb-1">Yıl</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full appearance-none text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value={0}>Yıl Seçin</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          Sohbete Başla
        </button>
      </form>
    </div>
  )
}

// ══════════════════════════════════════
// STEP 2 — Live Chat
// ══════════════════════════════════════

function LiveChat({
  session,
  setSession,
  onClose,
  onReset,
}: {
  session: ChatSession
  setSession: React.Dispatch<React.SetStateAction<ChatSession>>
  onClose: () => void
  onReset: () => void
}) {
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [online] = useState(isOnline)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())

  // Show quick options only if ticket hasn't been created yet
  const showQuickOptions = !session.ticketCreated

  // Persist session on change
  useEffect(() => {
    saveSession(session)
  }, [session])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.messages.length])

  // Focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  // Track scroll position
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 80)
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Polling for admin messages (every 5s) — only after ticket is created
  useEffect(() => {
    if (!session.ticketCreated) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/messages?ticketId=${encodeURIComponent(session.ticketId)}`)
        if (!res.ok) return
        const data = await res.json()
        const msgs = data.messages as Array<{
          id: string
          sender: string
          message: string
          created_at: string
        }>
        if (!msgs || msgs.length === 0) return

        // Only pick up admin messages not yet seen (ref is mutable, never stale)
        const newMsgs: ChatMessage[] = msgs
          .filter(m => m.sender === 'admin' && !seenIdsRef.current.has(String(m.id)))
          .map(m => ({
            id: `server-${m.id}`,
            sender: 'admin' as const,
            text: m.message,
            timestamp: new Date(m.created_at).getTime(),
          }))

        if (newMsgs.length === 0) return

        // Mark as seen BEFORE updating state
        newMsgs.forEach(m => seenIdsRef.current.add(m.id.replace('server-', '')))

        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, ...newMsgs],
        }))
      } catch { /* ignore polling errors */ }
    }

    pollingRef.current = setInterval(poll, 5000)
    poll()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.ticketId, session.ticketCreated])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return

    const isFirstMessage = !session.ticketCreated

    const customerMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text: text.trim(),
      timestamp: Date.now(),
    }

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, customerMsg],
      ticketCreated: true,
    }))
    setInputText('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: session.ticketId,
          message: text.trim(),
          name: session.name || undefined,
          vehicle: session.vehicle || undefined,
          phone: session.phone || undefined,
          vin: session.vin || undefined,
          pageUrl: window.location.pathname,
        }),
      })

      const data = await res.json()

      // Only show auto-reply for first message
      if (isFirstMessage && data.autoReply) {
        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'system',
          text: data.autoReply,
          timestamp: Date.now(),
        }
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, replyMsg],
        }))
      }
    } catch {
      if (isFirstMessage) {
        const fallbackMsg: ChatMessage = {
          id: `fallback-${Date.now()}`,
          sender: 'system',
          text: 'Talebiniz alındı, en kısa sürede size dönüş yapacağız.',
          timestamp: Date.now(),
        }
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, fallbackMsg],
        }))
      }
    } finally {
      setSending(false)
    }
  }, [session.ticketId, session.ticketCreated, session.name, session.vehicle, session.phone, session.vin, sending, setSession])

  const handleQuickOption = (text: string) => {
    sendMessage(text)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputText)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="fixed max-sm:inset-0 sm:bottom-24 sm:right-4 md:right-6 z-50 max-sm:bg-white sm:w-[380px] sm:h-[560px] bg-white sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold text-sm">{siteConfig.name} Destek</h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-300' : 'bg-gray-400'}`} />
              <p className="text-green-100 text-xs">
                {online ? 'Çevrimiçi' : 'Çevrimdışı — mesajınız iletilecek'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            className="p-1.5 hover:bg-green-700 rounded-lg transition-colors"
            aria-label="Yeni sohbet"
            title="Yeni sohbet"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-green-700 rounded-lg transition-colors sm:hidden"
            aria-label="Chat'i kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 relative">
        {session.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[80%]">
              {msg.sender === 'admin' && (
                <span className="text-[10px] text-gray-500 font-medium mb-0.5 block">Destek</span>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'customer'
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {/* Quick option buttons — shown before first message */}
        {showQuickOptions && (
          <div className="flex flex-col gap-2 pt-1">
            {QUICK_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleQuickOption(opt.label)}
                disabled={sending}
                className="text-left text-sm px-3 py-2 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 hover:border-green-400 transition-colors disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-2xl rounded-bl-md text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-0 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-md rounded-full p-1.5 hover:bg-gray-50 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 px-3 py-2 shrink-0 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın..."
            rows={1}
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-green-500 bg-white max-h-20"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Mesaj gönder"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
