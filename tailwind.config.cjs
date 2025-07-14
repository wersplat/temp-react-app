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
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Primary Blue
        'primary': {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',  // Primary blue
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        // Accent Red
        'accent': {
          50: '#ffebee',
          100: '#ffccd1',
          200: '#ff999b',
          300: '#ff6666',
          400: '#ff3d3d',
          500: '#ff1a1a',  // Accent red
          600: '#cc0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
        },
        // Neutral Gray
        'neutral': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Success Green
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning Yellow
        'warning': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Keep existing brand colors for backward compatibility
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
  plugins: [],
}
