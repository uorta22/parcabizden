'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Search, Sparkles, Package, ChevronRight, MessageCircle, Loader2, Clock, ArrowRight, Trash2 } from 'lucide-react'
import { searchOemParts } from '@/lib/api'
import type { OemSearchResult } from '@/lib/api'
import { parseSmartQuery, buildSearchQueries, POPULAR_SEARCHES } from '@/lib/smart-search'
import { getWhatsAppUrl } from '@/lib/config'

interface SearchHistoryItem {
  query: string
  timestamp: number
  resultCount: number
}

const HISTORY_KEY = 'ai-asistan-history'
const MAX_HISTORY = 10

function getHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(items: SearchHistoryItem[]) {
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)))
}

export default function AiAsistanPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<OemSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [parsedInfo, setParsedInfo] = useState<{ brand: string | null; parts: string[] } | null>(null)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery || query).trim()
    if (!q) return

    setQuery(q)
    setIsSearching(true)
    setError('')
    setSearched(true)
    setResults([])

    const parsed = parseSmartQuery(q)
    setParsedInfo({ brand: parsed.brand, parts: parsed.parts })

    const queries = buildSearchQueries(parsed)
    if (queries.length === 0) queries.push(q)

    try {
      const allResults: OemSearchResult[] = []
      const seenOems = new Set<string>()

      for (const searchTerm of queries) {
        try {
          const data = await searchOemParts(searchTerm)
          if (data.results) {
            for (const r of data.results) {
              if (!seenOems.has(r.oem_number)) {
                seenOems.add(r.oem_number)
                allResults.push(r)
              }
            }
          }
        } catch {
          // Individual query failure is OK, continue with others
        }
      }

      setResults(allResults)

      // Save to history
      const newItem: SearchHistoryItem = { query: q, timestamp: Date.now(), resultCount: allResults.length }
      const updated = [newItem, ...getHistory().filter(h => h.query !== q)].slice(0, MAX_HISTORY)
      saveHistory(updated)
      setHistory(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Arama sırasında hata oluştu')
    } finally {
      setIsSearching(false)
    }
  }, [query])

  const clearHistory = useCallback(() => {
    saveHistory([])
    setHistory([])
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-purple-50 to-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 border border-purple-200 rounded-full mb-5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-purple-700">Akıllı Parça Arama</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Hangi parçayı <span className="text-purple-600">arıyorsunuz?</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base mb-8">
              Aracınızı ve aradığınız parçayı tarif edin, size en uygun sonuçları bulalım.
            </p>

            {/* Search Box */}
            <div className="relative max-w-xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Örn: Golf 7 klima kompresörü"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 shadow-lg rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm md:text-base"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching || !query.trim()}
                  className="px-6 md:px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 flex-shrink-0 shadow-lg shadow-purple-600/20"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span className="hidden md:inline">Ara</span>
                </button>
              </div>
            </div>

            {/* Popular Searches */}
            {!searched && (
              <div className="mt-6 max-w-xl mx-auto">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Popüler Aramalar</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => { setQuery(term); handleSearch(term) }}
                      className="px-3 py-1.5 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg text-xs text-gray-600 hover:text-purple-700 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">

          {/* Loading */}
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-500 text-sm">Parçalar aranıyor...</p>
              {parsedInfo?.brand && (
                <p className="text-purple-600 text-xs mt-1">
                  Marka: <span className="font-semibold capitalize">{parsedInfo.brand}</span>
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {searched && !isSearching && !error && (
            <>
              {parsedInfo && (parsedInfo.brand || parsedInfo.parts.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {parsedInfo.brand && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      Marka: <span className="font-semibold capitalize">{parsedInfo.brand}</span>
                    </span>
                  )}
                  {parsedInfo.parts.slice(0, 3).map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700 capitalize">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {results.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-900 font-semibold text-sm">
                      <span className="text-purple-600 tabular-nums">{results.length}</span> sonuç bulundu
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden shadow-sm">
                    {results.slice(0, 20).map((r, i) => (
                      <Link
                        key={`${r.oem_number}-${i}`}
                        href={`/parca/${encodeURIComponent(r.oem_number)}`}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 font-mono">{r.oem_number}</span>
                            {r.brand_slug && (
                              <span className="text-xs text-gray-400 capitalize">{r.brand_slug.replace(/-/g, ' ')}</span>
                            )}
                          </div>
                        </div>
                        <span className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0">
                          Detay
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    ))}
                    {results.length > 20 && (
                      <div className="px-4 py-3 bg-gray-50 text-center">
                        <p className="text-xs text-gray-500">{results.length - 20} sonuç daha mevcut. Aramanızı daraltarak daha kesin sonuçlar alabilirsiniz.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg mb-2">Sonuç bulunamadı</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    &ldquo;{query}&rdquo; ile eşleşen parça bulamadık. WhatsApp üzerinden uzman ekibimiz size yardımcı olsun.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={getWhatsAppUrl(`Merhaba, "${query}" parçası arıyorum. Yardımcı olur musunuz?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp ile Sorun
                    </a>
                    <Link
                      href="/parcalar"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    >
                      Kategorilere Gözat
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Search History */}
          {!searched && history.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Son Aramalar</p>
                </div>
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Temizle
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {history.map((item, i) => (
                  <button
                    key={`${item.query}-${i}`}
                    onClick={() => { setQuery(item.query); handleSearch(item.query) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 truncate">{item.query}</span>
                    <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                      {item.resultCount} sonuç
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          {!searched && (
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200 rounded-2xl p-6 md:p-8 text-center">
              <h3 className="text-gray-900 font-bold text-base mb-2">Parça numaranızı mı biliyorsunuz?</h3>
              <p className="text-gray-500 text-sm mb-4">OEM numarası ile doğrudan arama yaparak parçanızı anında bulabilirsiniz.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                OEM ile Ara
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
