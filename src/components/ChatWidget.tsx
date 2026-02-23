'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, ChevronDown, Loader2 } from 'lucide-react'
import { siteConfig } from '@/lib/config'
import { validateVIN } from '@/lib/vehicle'
import * as api from '@/lib/api'
import type { Brand, Model, Segment } from '@/types/api'

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
  brandId: number
  modelId: number
  segmentId: number
  year: number
  messages: ChatMessage[]
}

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
    brandId: 0,
    modelId: 0,
    segmentId: 0,
    year: 0,
    messages: [],
  }
}

function saveSession(s: ChatSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
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

  if (!siteConfig.chat.enabled) return null

  return (
    <>
      {isOpen && (
        session.step === 'form'
          ? <InfoForm session={session} setSession={setSession} />
          : <LiveChat session={session} setSession={setSession} onClose={() => setIsOpen(false)} />
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

  // Cascading dropdowns
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [years, setYears] = useState<number[]>([])

  const [brandId, setBrandId] = useState(session.brandId)
  const [modelId, setModelId] = useState(session.modelId)
  const [segmentId, setSegmentId] = useState(session.segmentId)
  const [year, setYear] = useState(session.year)

  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingSegments, setLoadingSegments] = useState(false)
  const [loadingYears, setLoadingYears] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load brands on mount
  useEffect(() => {
    setLoadingBrands(true)
    api.getBrands()
      .then(setBrands)
      .catch(() => {})
      .finally(() => setLoadingBrands(false))
  }, [])

  // Load models when brand changes
  useEffect(() => {
    if (!brandId) { setModels([]); return }
    setLoadingModels(true)
    api.getModels(brandId)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false))
  }, [brandId])

  // Load segments when model changes
  useEffect(() => {
    if (!modelId) { setSegments([]); return }
    setLoadingSegments(true)
    api.getSegments(modelId)
      .then(setSegments)
      .catch(() => setSegments([]))
      .finally(() => setLoadingSegments(false))
  }, [modelId])

  // Load years when segment changes
  useEffect(() => {
    if (!segmentId) { setYears([]); return }
    setLoadingYears(true)
    api.getYears(segmentId)
      .then(setYears)
      .catch(() => setYears([]))
      .finally(() => setLoadingYears(false))
  }, [segmentId])

  const handleBrandChange = (v: number) => {
    setBrandId(v)
    setModelId(0)
    setSegmentId(0)
    setYear(0)
  }

  const handleModelChange = (v: number) => {
    setModelId(v)
    setSegmentId(0)
    setYear(0)
  }

  const handleSegmentChange = (v: number) => {
    setSegmentId(v)
    setYear(0)
  }

  const formatSegmentLabel = (seg: Segment) => {
    const parts = [seg.name]
    if (seg.engine_type) parts.push(seg.engine_type)
    if (seg.body_type) parts.push(seg.body_type)
    return parts.join(' - ')
  }

  const buildVehicleString = (): string => {
    const brand = brands.find(b => b.id === brandId)
    const model = models.find(m => m.id === modelId)
    const parts: string[] = []
    if (brand) parts.push(brand.name)
    if (model) parts.push(model.name)
    if (year) parts.push(String(year))
    return parts.join(' ')
  }

  const canSubmit = name.trim().length > 0 && validatePhone(phone)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
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
      text: `Merhaba ${name.trim()}, ${vehicle ? vehicle + ' için ' : ''}nasıl yardımcı olabiliriz?`,
      timestamp: Date.now(),
    }

    const newSession: ChatSession = {
      ...session,
      step: 'chat',
      name: name.trim(),
      phone: phone.replace(/\s/g, ''),
      vin: vin.trim(),
      vehicle,
      brandId,
      modelId,
      segmentId,
      year,
      messages: [welcomeMsg],
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
            value={brandId}
            onChange={(e) => handleBrandChange(Number(e.target.value))}
            disabled={loadingBrands}
            className="w-full appearance-none text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:opacity-50"
          >
            <option value={0}>{loadingBrands ? 'Yükleniyor...' : 'Marka Seçin'}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {loadingBrands ? (
            <Loader2 className="absolute right-3 bottom-2.5 w-4 h-4 text-green-500 animate-spin pointer-events-none" />
          ) : (
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Model */}
        <div className="relative">
          <label className="block text-gray-700 text-xs font-medium mb-1">Model</label>
          <select
            value={modelId}
            onChange={(e) => handleModelChange(Number(e.target.value))}
            disabled={!brandId || loadingModels}
            className="w-full appearance-none text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:opacity-50"
          >
            <option value={0}>{loadingModels ? 'Yükleniyor...' : 'Model Seçin'}</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {loadingModels ? (
            <Loader2 className="absolute right-3 bottom-2.5 w-4 h-4 text-green-500 animate-spin pointer-events-none" />
          ) : (
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Motor / Kasa Tipi */}
        <div className="relative">
          <label className="block text-gray-700 text-xs font-medium mb-1">Motor / Kasa Tipi</label>
          <select
            value={segmentId}
            onChange={(e) => handleSegmentChange(Number(e.target.value))}
            disabled={!modelId || loadingSegments}
            className="w-full appearance-none text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:opacity-50"
          >
            <option value={0}>{loadingSegments ? 'Yükleniyor...' : 'Motor / Kasa Tipi Seçin'}</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>{formatSegmentLabel(s)}</option>
            ))}
          </select>
          {loadingSegments ? (
            <Loader2 className="absolute right-3 bottom-2.5 w-4 h-4 text-green-500 animate-spin pointer-events-none" />
          ) : (
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Yıl */}
        <div className="relative">
          <label className="block text-gray-700 text-xs font-medium mb-1">Yıl</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={!segmentId || loadingYears}
            className="w-full appearance-none text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:opacity-50"
          >
            <option value={0}>{loadingYears ? 'Yükleniyor...' : 'Yıl Seçin'}</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {loadingYears ? (
            <Loader2 className="absolute right-3 bottom-2.5 w-4 h-4 text-green-500 animate-spin pointer-events-none" />
          ) : (
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
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
}: {
  session: ChatSession
  setSession: React.Dispatch<React.SetStateAction<ChatSession>>
  onClose: () => void
}) {
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [online] = useState(isOnline)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastMessageIdRef = useRef<string>('')

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

  // Polling for admin messages (every 5s)
  useEffect(() => {
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

        // Find new admin messages we haven't seen
        const existingIds = new Set(session.messages.map(m => m.id))
        const newMsgs: ChatMessage[] = msgs
          .filter(m => !existingIds.has(`server-${m.id}`) && (m.sender === 'admin' || m.sender === 'system'))
          .map(m => ({
            id: `server-${m.id}`,
            sender: (m.sender === 'admin' ? 'admin' : 'system') as ChatMessage['sender'],
            text: m.message,
            timestamp: new Date(m.created_at).getTime(),
          }))

        if (newMsgs.length > 0) {
          setSession(prev => ({
            ...prev,
            messages: [...prev.messages, ...newMsgs],
          }))
        }
      } catch { /* ignore polling errors */ }
    }

    pollingRef.current = setInterval(poll, 5000)
    // Initial poll
    poll()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.ticketId])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return

    const customerMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text: text.trim(),
      timestamp: Date.now(),
    }

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, customerMsg],
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

      if (data.autoReply) {
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
    } finally {
      setSending(false)
    }
  }, [session.ticketId, session.name, session.vehicle, session.phone, session.vin, sending, setSession])

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
        <button
          onClick={onClose}
          className="p-1 hover:bg-green-700 rounded-lg transition-colors sm:hidden"
          aria-label="Chat'i kapat"
        >
          <X className="w-5 h-5" />
        </button>
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
