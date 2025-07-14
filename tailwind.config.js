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
      },
      colors: {
        'brand-blue': {
          50: '#f0f8ff',
          100: '#dbeeff',
          200: '#b3d7ff',
          300: '#84bfff',
          400: '#57a6ff',
          500: '#2b8cff',
          600: '#1975e6',
          700: '#1059b3',
          800: '#083d80',
          900: '#031f4d',
        },
        'brand-red': {
          50: '#fff5f5',
          100: '#ffd8d8',
          200: '#ffb3b3',
          300: '#ff8d8d',
          400: '#ff6767',
          500: '#ff4141',
          600: '#e63232',
          700: '#b22424',
          800: '#801717',
          900: '#4d0a0a',
        },
      },
    },
  },
  plugins: [],
}
