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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
