/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      colors: {
        'brand-bg': '#0D1117',
        'brand-panel': '#161B22',
        'brand-primary': '#388BFD',
        'brand-primary-hover': '#2176F2',
        'brand-border': '#30363D',
        'brand-text': '#C9D1D9',
        'brand-text-secondary': '#8B949E',
      },
      animation: {
        'highlight': 'highlight 2.5s ease-out forwards',
      },
      keyframes: {
        highlight: {
          '0%': { backgroundColor: 'rgba(56, 139, 253, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        }
      }
    }
  },
  plugins: [],
}