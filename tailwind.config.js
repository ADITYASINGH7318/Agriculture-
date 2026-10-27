/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#071e12',
          900: '#0c2e1c',
          800: '#14432a',
          700: '#1d5c3b',
          600: '#28794f',
          500: '#349964',
        },
        farm: {
          bg: '#f8faf7',
          card: '#ffffff',
          accent: '#10b981',
          lime: '#84cc16',
          amber: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
