import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // O front roda em 5173 e a API em 3000 (npm run server). O proxy evita
    // CORS no desenvolvimento e deixa os caminhos iguais aos de produção.
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
})
