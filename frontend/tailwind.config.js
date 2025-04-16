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
          50: '#f0f2ff',
          100: '#e0e5ff',
          200: '#c7d1ff',
          300: '#a5b4ff',
          400: '#818dff',
          500: '#324ae0',
          600: '#2a3ec0',
          700: '#2232a0',
          800: '#1a2680',
          900: '#121a60',
        },
      },
    },
  },
  plugins: [],
} 