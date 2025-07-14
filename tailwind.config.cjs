/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Enable dark mode via class strategy
  darkMode: 'class',
  // Configure JIT mode
  mode: 'jit',
  // Enable smooth scrolling
  theme: {
    extend: {
      scrollBehavior: {
        smooth: 'smooth',
      },
    },
  },
  // Include all variants
  variants: {
    extend: {
      backgroundColor: ['responsive', 'hover', 'focus', 'dark'],
      textColor: ['responsive', 'hover', 'focus', 'dark'],
      borderColor: ['responsive', 'hover', 'focus', 'dark'],
      ringColor: ['responsive', 'hover', 'focus', 'dark'],
      ringWidth: ['responsive', 'hover', 'focus'],
      opacity: ['responsive', 'hover', 'focus', 'disabled'],
      scrollBehavior: ['responsive'],
    },
  },
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
