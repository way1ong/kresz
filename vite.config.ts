import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }

// BASE_PATH задає GitHub Actions (для GitHub Pages це "/<назва-репо>/").
// Локально застосунок працює з кореня "/".
const base = normalizeBase(process.env.BASE_PATH)

function normalizeBase(value: string | undefined): string {
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
