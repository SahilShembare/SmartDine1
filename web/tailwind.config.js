/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-brown': '#3B2115',
        'dark-brown': '#24140D',
        'warm-orange': '#E8752A',
        'gold': '#F4B942',
        'warm-cream': '#FFF8ED',
        'warm-gray': '#6B5B50',
        'veg-green': '#198754',
        'nonveg-red': '#D32F2F',
        'success-green': '#2E7D32',
        brand: {
          50: '#FFF8ED',
          100: '#ffeedd',
          200: '#fed7aa',
          300: '#F4B942',
          400: '#fb923c',
          500: '#E8752A',
          600: '#d9681f',
          700: '#c2410c',
          800: '#3B2115',
          900: '#24140D',
          DEFAULT: '#E8752A',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Merriweather', 'serif'],
      },
      boxShadow: {
        'glow': '0 4px 20px -2px rgba(232, 117, 42, 0.35)',
        'gold-glow': '0 4px 20px -2px rgba(244, 185, 66, 0.4)',
        'soft': '0 4px 20px -2px rgba(36, 20, 13, 0.06)',
        'card': '0 2px 12px -1px rgba(36, 20, 13, 0.08)',
      }
    },
  },
  plugins: [],
}
