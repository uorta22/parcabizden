'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react'
import { siteConfig } from '@/lib/config'

interface ChatMessage {
  id: string
  sender: 'customer' | 'system'
  text: string
  timestamp: number
}

interface ChatState {
  ticketId: string
  messages: ChatMessage[]
  name: string
  vehicle: string
}

function generateTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

const STORAGE_KEY = 'parcabizden-chat'

function loadChat(): ChatState {
  if (typeof window === 'undefined') {
    return { ticketId: generateTicketId(), messages: [], name: '', vehicle: '' }
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { ticketId: generateTicketId(), messages: [], name: '', vehicle: '' }
}

function saveChat(state: ChatState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

const QUICK_OPTIONS = [
  'Parça arıyorum',
  'Fiyat bilgisi',
  'Kargo durumu',
  'Diğer',
]

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'system',
  text: 'Merhaba! ParcaBizden Destek ekibine hoş geldiniz. Size nasıl yardımcı olabiliriz?',
  timestamp: Date.now(),
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatState, setChatState] = useState<ChatState>(loadChat)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  if (!siteConfig.chat.enabled) return null

  const messages = chatState.messages.length > 0
    ? chatState.messages
    : [WELCOME_MESSAGE]

  const hasUserMessages = chatState.messages.some(m => m.sender === 'customer')

  // Persist to sessionStorage
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (chatState.messages.length > 0) {
      saveChat(chatState)
    }
  }, [chatState])

  // Scroll to bottom on new messages
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, isOpen])

  // Track scroll position
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 80)
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  // Focus input when opened
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return

    const customerMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text: text.trim(),
      timestamp: Date.now(),
    }

    const newState: ChatState = {
      ...chatState,
      messages: [
        ...(chatState.messages.length === 0 ? [WELCOME_MESSAGE] : []),
        ...chatState.messages,
        customerMsg,
      ],
    }
    setChatState(newState)
    setInputText('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: chatState.ticketId,
          message: text.trim(),
          name: chatState.name || undefined,
          vehicle: chatState.vehicle || undefined,
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
        setChatState(prev => ({
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
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, fallbackMsg],
      }))
    } finally {
      setSending(false)
    }
  }, [chatState, sending])

  const handleQuickOption = (option: string) => {
    sendMessage(option)
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
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[360px] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-semibold text-sm">{siteConfig.name} Destek</h3>
              <p className="text-green-100 text-xs">Genellikle birkaç dakika içinde yanıt verir</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-green-700 rounded-lg transition-colors"
              aria-label="Chat'i kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 relative">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'customer'
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick options (show if no user messages yet) */}
            {!hasUserMessages && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleQuickOption(opt)}
                    disabled={sending}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Sending indicator */}
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

            {/* Scroll to bottom */}
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
            {/* Optional fields (collapsible row) */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Adınız (opsiyonel)"
                value={chatState.name}
                onChange={(e) => setChatState(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
              />
              <input
                type="text"
                placeholder="Araç bilgisi (opsiyonel)"
                value={chatState.vehicle}
                onChange={(e) => setChatState(prev => ({ ...prev, vehicle: e.target.value }))}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
              />
            </div>

            {/* Message input */}
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
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label={isOpen ? 'Chat\'i kapat' : 'Destek ile iletişime geçin'}
      >
        <div className="relative">
          {/* Pulse animation ring */}
          {!isOpen && (
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
          )}

          <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110 ${
            isOpen
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-green-500 hover:bg-green-600'
          }`}>
            {isOpen ? (
              <X className="w-7 h-7 md:w-8 md:h-8 text-white" />
            ) : (
              <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
            )}
          </div>

          {/* Tooltip */}
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
