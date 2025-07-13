import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 4173,      // Default Vite preview port
    strictPort: true // Exit if port is in use
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
})
