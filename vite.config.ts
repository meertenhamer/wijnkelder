import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Lokaal: /api-verzoeken gaan naar `npm run dev:api` (wrangler dev)
    proxy: { '/api': 'http://localhost:8787' },
  },
})
