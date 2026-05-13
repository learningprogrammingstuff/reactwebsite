import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build output goes to ./dist — drop it straight into a Cloudflare Pages project.
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es'
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          jszip: ['jszip']
        }
      }
    }
  }
})
