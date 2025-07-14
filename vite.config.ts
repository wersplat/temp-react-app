import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: true
  },
  optimizeDeps: {
    include: ['@heroicons/react']
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    cssMinify: true
  }
})
