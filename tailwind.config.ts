import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#1A1A1A',
        blue: '#1A4DAB',
        yellow: '#F5C400',
        red: '#D62B2B',
        beige: '#F5F0E8',
        gray: '#5C5C5C',
        'light-gray': '#EBEBEB',
        border: '#D0CCC4',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
