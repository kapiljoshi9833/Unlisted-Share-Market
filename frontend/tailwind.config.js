/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#020202',
        surface: '#0A0A0A',
        surfaceHover: '#111111',
        border: '#242424',
        accentDark: '#1D5E3C',
        accentBright: '#4AF4A3',
        textMain: '#FAFAFA',
        textMuted: '#8A8A8A',
        sellRed: '#EF4444',
        sellDark: '#3B1212',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}