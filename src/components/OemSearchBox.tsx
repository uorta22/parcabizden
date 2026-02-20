'use client'

import { useState, useRef } from 'react'
import { Search, Loader2, MessageCircle, Package, AlertCircle } from 'lucide-react'
import { searchOemParts } from '@/lib/api'
import type { OemSearchResult } from '@/lib/api'
import { getWhatsAppUrl } from '@/lib/config'

export default function OemSearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OemSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) { inputRef.current?.focus(); return }

    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const data = await searchOemParts(q)
      setResults(data.results || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Arama sırasında hata oluştu')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <section className="py-10 md:py-14 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              OEM Numarası ile <span className="text-primary-500">Ara</span>
            </h2>
            <p className="text-gray-500 text-sm">
              Parça numarasını biliyorsanız doğrudan arayın.
            </p>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Örn: 8E0407151, 1K0615301"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span className="hidden sm:inline">Ara</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {searched && !loading && !error && (
            <div className="mt-4">
              {results.length > 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-200 overflow-hidden">
                  {results.slice(0, 10).map((r, i) => (
                    <div key={`${r.oem_number}-${i}`} className="flex items-center gap-3 p-4 hover:bg-gray-100/50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{r.oem_number}</p>
                      </div>
                      <a
                        href={getWhatsAppUrl(`Merhaba, ${r.oem_number} OEM numaralı "${r.name}" parçası için fiyat almak istiyorum.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Fiyat Sor
                      </a>
                    </div>
                  ))}
                  {results.length > 10 && (
                    <div className="px-4 py-3 bg-gray-100/50 text-center">
                      <p className="text-xs text-gray-500">
                        {results.length - 10} sonuç daha var. Daha spesifik arama yaparak daraltabilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-gray-500 text-sm mb-2">Sonuç bulunamadı.</p>
                  <a
                    href={getWhatsAppUrl(`Merhaba, "${query}" OEM numaralı parçayı arıyorum. Yardımcı olur musunuz?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp ile sorun
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
