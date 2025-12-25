import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // เปลี่ยน 'akha-dictionary' เป็นชื่อ Repository ของคุณ
  base: './', 
  build: {
    outDir: 'dist',
  }
})
