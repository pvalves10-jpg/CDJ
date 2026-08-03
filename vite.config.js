import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base '/CDJ/' — o app é publicado em https://<usuario>.github.io/CDJ/
export default defineConfig({
  base: '/CDJ/',
  plugins: [react(), tailwindcss()],
})
