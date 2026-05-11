import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4b9',
          200: '#fcd48c',
          300: '#fbc45f',
          400: '#fab83d',
          500: '#f9ac1b',
          600: '#f5a518',
          700: '#ef9b14',
          800: '#e99110',
          900: '#df8008',
        },
        secondary: {
          50: '#e8eaf0',
          100: '#c5cada',
          200: '#9ea7c1',
          300: '#7784a8',
          400: '#596995',
          500: '#3c4f82',
          600: '#36487a',
          700: '#2e3f6f',
          800: '#273665',
          900: '#1a2652',
        },
        dark: {
          50: '#e6e7e9',
          100: '#c1c3c8',
          200: '#989ca4',
          300: '#6f7480',
          400: '#505764',
          500: '#313949',
          600: '#2c3342',
          700: '#252c39',
          800: '#1f2431',
          900: '#131721',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        'archivo-black': ['var(--font-archivo-black)', 'Archivo Black', 'system-ui', 'sans-serif'],
        'space-grotesk': ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      // Çerez banner animasyonu
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out forwards',
      },
    },
  },
  // Kategori ikon gradient'leri dinamik birleştirildiği için safelist gerekli
  safelist: [
    'from-red-500', 'to-orange-500',
    'from-sky-500', 'to-blue-500',
    'from-amber-500', 'to-yellow-500',
    'from-gray-500', 'to-slate-500',
    'from-blue-500', 'to-cyan-500',
    'from-purple-500', 'to-pink-500',
    'from-green-500', 'to-emerald-500',
    'from-gray-600',
    'from-yellow-500',
    'from-teal-500',
    'from-amber-400',
    'from-cyan-500',
    'from-indigo-500',
    'from-violet-500', 'to-purple-500',
    'from-pink-500', 'to-rose-500',
    'from-stone-500', 'to-gray-500',
    'to-gray-600',
    'bg-gradient-to-br',
  ],
  plugins: [],
}
export default config
