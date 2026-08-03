import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Em produção o app é publicado em https://<usuario>.github.io/<repo>/.
// Descobrimos o nome do repositório pela variável do GitHub Actions, então
// funciona com qualquer nome; fora do CI (dev/local), a base é '/'.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${repo ?? 'CDJ'}/` : '/',
  plugins: [react(), tailwindcss()],
}))
