import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const alt = 'ParcaBizden - Yedek Parça & Çıkma Parça Talep Platformu'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  const logoData = await readFile(join(process.cwd(), 'public', 'pb_logo.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #18181b 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: '#1a3a5c',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '24px',
            padding: '24px 40px',
            marginBottom: '32px',
          }}
        >
          <img
            src={logoBase64}
            width="400"
            height="218"
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 500,
            color: '#a1a1aa',
            marginBottom: '48px',
          }}
        >
          Yedek Parca & Cikma Parca Talep Platformu
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {['50+ Marka', '10.000+ Parca', 'Sase ile Arama', '7/24 WhatsApp'].map(
            (text) => (
              <div
                key={text}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(26, 58, 92, 0.3)',
                  border: '1px solid rgba(26, 58, 92, 0.6)',
                  borderRadius: '999px',
                  color: '#93c5fd',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                {text}
              </div>
            )
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '20px',
            color: '#71717a',
          }}
        >
          parcabizden.com.tr
        </div>
      </div>
    ),
    { ...size }
  )
}
