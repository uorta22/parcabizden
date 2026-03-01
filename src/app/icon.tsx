import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default async function Icon() {
  const logoData = await readFile(join(process.cwd(), 'public', 'pb_logo.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: '4px',
        }}
      >
        <img
          src={logoBase64}
          width="44"
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
