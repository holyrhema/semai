/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FDFBF2',
          100: '#FBF5DD', // Light Sand Canvas
          200: '#F2E8BF',
          300: '#E7E1B1', // Warm Dune Card
          400: '#D5CC94',
        },
        forest: {
          400: '#4D9644',
          600: '#306D29', // Leaf Accent
          700: '#23571E',
          800: '#174213',
          900: '#0D530E', // Deep Canopy Green
          950: '#073307',
        }
      },
      fontSize: {
        'xs': '0.90rem',    // ~14.4px (+20%)
        'sm': '1.05rem',    // ~16.8px (+20%)
        'base': '1.20rem',  // ~19.2px (+20%)
        'lg': '1.35rem',    // ~21.6px (+20%)
        'xl': '1.50rem',    // ~24px (+20%)
        '2xl': '1.80rem',   // ~28.8px (+20%)
      }
    },
  },
  plugins: [],
}
