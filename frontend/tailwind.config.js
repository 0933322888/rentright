/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f6fa',
          100: '#e8ecf4',
          200: '#d1d8e9',
          300: '#a9b8d4',
          400: '#7a8fb8',
          500: '#5869ac',
          600: '#4a5a9a',
          700: '#3e4a7f',
          800: '#353e68',
          900: '#2f3655',
        },
      },
    },
  },
  plugins: [],
} 