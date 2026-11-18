import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // O Supabase deixa o arquivo um pouco maior que o padrão; está tudo bem.
  build: { chunkSizeWarningLimit: 800 },
})
