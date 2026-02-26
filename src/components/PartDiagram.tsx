'use client'

import { useState, useEffect } from 'react'
import { ZoomIn, X, Loader2 } from 'lucide-react'
import { fetchDiagramUrl } from '@/lib/api'

interface PartDiagramProps {
  brand: string
  gen: string
  node: string
  nodeLabel?: string
}

export default function PartDiagram({ brand, gen, node, nodeLabel }: PartDiagramProps) {
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setDiagramUrl(null)
    setImgError(false)
    fetchDiagramUrl(brand, gen, node).then(url => {
      setDiagramUrl(url)
      setLoading(false)
    })
  }, [brand, gen, node])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxOpen])

  if (loading) {
    return (
      <div className="mb-5 bg-gray-50 border border-gray-200 rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!diagramUrl || imgError) return null

  return (
    <>
      <div className="mb-5 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setLightboxOpen(true)}
          className="w-full group cursor-zoom-in"
        >
          <div className="relative bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={diagramUrl}
              alt={nodeLabel || node}
              className="w-full max-h-[400px] object-contain mx-auto"
              onError={() => setImgError(true)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                <ZoomIn className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600 font-medium">Buyut</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={diagramUrl}
            alt={nodeLabel || node}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
